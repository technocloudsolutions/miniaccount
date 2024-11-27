import { db } from '../firebase'
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore'
import { Report, ReportType, ReportFilter, ReportSummary, ReportDataPoint } from '../types/reports'
import { format } from 'date-fns'
import { auth } from '../firebase'

// Currency formatter
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('si-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(amount)
}

export async function generateReport(type: ReportType, filter: ReportFilter): Promise<Report> {
  const userId = auth.currentUser?.uid
  if (!userId) throw new Error('User not authenticated')

  const summary = await getReportSummary(type, filter, userId)
  const data = await getReportData(type, filter, userId)
  
  return {
    id: `${type}-${Date.now()}`,
    type,
    title: getReportTitle(type),
    description: getReportDescription(type),
    filter,
    summary,
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

async function getReportSummary(type: ReportType, filter: ReportFilter, userId: string): Promise<ReportSummary> {
  let totalAmount = 0
  let count = 0
  let previousTotal = 0
  
  try {
    let collectionQuery;
    
    // Use existing collection queries for each type
    switch (type) {
      case 'inventory':
        // Keep existing inventory logic
        collectionQuery = query(
          collection(db, 'inventoryItems'),
          where('userId', '==', userId)
        );
        break;
      case 'sales':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('type', '==', 'sale')
        );
        break;
      case 'expenses':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('type', '==', 'expense')
        );
        break;
      case 'purchases':
        collectionQuery = query(
          collection(db, 'purchases'),
          where('userId', '==', userId)
        );
        break;
      case 'profit_loss':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId)
        );
        break;
    }

    const docs = await getDocs(collectionQuery)
    console.log(`Found ${docs.size} documents for ${type} summary`)

    docs.forEach(doc => {
      const data = doc.data()
      
      if (type === 'inventory') {
        // Keep existing inventory logic
        const totalValue = Number(data.totalAmount || 0)
        totalAmount += totalValue
        count++
      } else {
        // Handle other report types
        const amount = Number(data.amount || data.totalAmount || 0)
        
        if (type === 'profit_loss') {
          if (data.type === 'sale') {
            totalAmount += amount
          } else if (data.type === 'expense' || data.type === 'purchase') {
            totalAmount -= amount
          }
        } else {
          totalAmount += amount
        }
        count++
        
        console.log('Added to summary:', {
          type,
          amount,
          runningTotal: totalAmount,
          count
        })
      }
    })

    // Calculate previous period totals
    const previousFilter = getPreviousPeriodFilter(filter)
    const previousStartDate = previousFilter.dateRange?.startDate
    const previousEndDate = previousFilter.dateRange?.endDate

    docs.forEach(doc => {
      const data = doc.data()
      const docDate = data.date || data.purchaseDate || data.createdAt
      const date = docDate instanceof Timestamp ? 
        docDate.toDate() : 
        new Date(docDate)
      
      if (previousStartDate && previousEndDate &&
          date >= previousStartDate && 
          date <= previousEndDate) {
        const amount = Number(data.amount || data.totalAmount || 0)
        if (type === 'profit_loss') {
          if (data.type === 'sale') {
            previousTotal += amount
          } else if (data.type === 'expense' || data.type === 'purchase') {
            previousTotal -= amount
          }
        } else {
          previousTotal += amount
        }
      }
    })

  } catch (error) {
    console.error(`Error calculating ${type} summary:`, error)
  }

  const previousPeriodChange = previousTotal > 0 
    ? ((totalAmount - previousTotal) / previousTotal) * 100 
    : 0

  const averageAmount = count > 0 ? totalAmount / count : 0
  
  console.log('Final Summary:', {
    type,
    totalAmount,
    count,
    averageAmount,
    previousPeriodChange
  })

  return {
    totalAmount,
    count,
    averageAmount,
    previousPeriodChange,
    formattedTotal: formatCurrency(totalAmount),
    formattedAverage: formatCurrency(averageAmount)
  }
}

async function getReportData(type: ReportType, filter: ReportFilter, userId: string): Promise<ReportDataPoint[]> {
  const data: ReportDataPoint[] = []
  
  try {
    let collectionQuery;
    
    switch (type) {
      case 'inventory':
        collectionQuery = query(
          collection(db, 'inventoryItems'),
          where('userId', '==', userId)
        );
        break;
      case 'sales':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('type', '==', 'sale')
        );
        break;
      case 'expenses':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId),
          where('type', '==', 'expense')
        );
        break;
      case 'purchases':
        collectionQuery = query(
          collection(db, 'purchases'),
          where('userId', '==', userId)
        );
        break;
      case 'profit_loss':
        collectionQuery = query(
          collection(db, 'transactions'),
          where('userId', '==', userId)
        );
        break;
      default:
        throw new Error('Invalid report type');
    }

    const docs = await getDocs(collectionQuery)
    console.log(`Found ${docs.size} documents for ${type}`)

    docs.forEach(doc => {
      const docData = doc.data()
      console.log('Processing document:', docData)

      if (type === 'inventory') {
        const initialStock = Number(docData.initialQuantity || 0)
        const currentStock = Number(docData.quantity || 0)
        const unitPrice = Number(docData.initialUnitPrice || 0)
        const totalValue = Number(docData.totalAmount || 0)

        data.push({
          date: docData.updatedAt instanceof Timestamp ? 
            docData.updatedAt.toDate() : 
            new Date(docData.updatedAt || docData.createdAt || Date.now()),
          value: totalValue,
          label: docData.name || `Item #${doc.id}`,
          formattedValue: formatCurrency(totalValue),
          details: {
            category: docData.category || 'Uncategorized',
            initialStock: initialStock,
            currentStock: currentStock,
            items: [{
              name: docData.name || `Item #${doc.id}`,
              quantity: currentStock,
              price: unitPrice,
              formattedPrice: formatCurrency(unitPrice)
            }],
            status: currentStock > 0 ? 'In Stock' : 'Out of Stock'
          }
        });
      } else {
        const docDate = docData.date || docData.purchaseDate || docData.createdAt
        const date = docDate instanceof Timestamp ? 
          docDate.toDate() : 
          new Date(docDate)

        const amount = Number(docData.amount || docData.totalAmount || 0)
        const paymentAmount = Number(docData.paymentAmount || 0)
        const balanceAmount = amount - paymentAmount

        switch (type) {
          case 'sales':
            data.push({
              date,
              value: amount,
              label: docData.description || `Sale #${doc.id}`,
              formattedValue: formatCurrency(amount),
              details: {
                customer: docData.customerName,
                category: docData.category || 'Uncategorized',
                items: docData.items || [],
                status: docData.status || 'Completed'
              }
            });
            break;

          case 'expenses':
            data.push({
              date,
              value: amount,
              label: docData.description || `Expense #${doc.id}`,
              formattedValue: formatCurrency(amount),
              details: {
                category: docData.category || 'Uncategorized',
                items: [{
                  name: docData.description || 'Expense',
                  quantity: 1,
                  price: amount,
                  formattedPrice: formatCurrency(amount)
                }],
                status: docData.status || 'Completed'
              }
            });
            break;

          case 'purchases':
            data.push({
              date,
              value: amount,
              label: docData.description || `Purchase #${doc.id}`,
              formattedValue: formatCurrency(amount),
              details: {
                supplier: docData.supplierName,
                category: docData.category || 'Uncategorized',
                items: docData.items || [],
                status: balanceAmount > 0 ? 'Pending' : 'Paid'
              }
            });
            break;

          case 'profit_loss':
            const isIncome = docData.type === 'sale'
            const value = isIncome ? amount : -amount
            data.push({
              date,
              value,
              label: `${isIncome ? 'Income' : 'Expense'} - ${docData.description || doc.id}`,
              formattedValue: formatCurrency(Math.abs(value)),
              details: {
                category: docData.category || (isIncome ? 'Income' : 'Expense'),
                items: [{
                  name: docData.description || (isIncome ? 'Income' : 'Expense'),
                  quantity: 1,
                  price: Math.abs(value),
                  formattedPrice: formatCurrency(Math.abs(value))
                }],
                status: isIncome ? 'Income' : 'Expense'
              }
            });
            break;
        }
      }
    })

    console.log(`Processed ${data.length} records for ${type}`)
  } catch (error) {
    console.error(`Error processing ${type} report:`, error)
  }

  return data.sort((a, b) => b.date.getTime() - a.date.getTime())
}

function getCollectionQuery(type: ReportType, filter: ReportFilter, userId: string) {
  switch (type) {
    case 'inventory':
      console.log('Creating inventory query')
      return query(
        collection(db, 'inventoryItems'),
        where('userId', '==', userId)
      )
    case 'purchases':
      return query(
        collection(db, 'purchases'),
        where('userId', '==', userId)
      )
    case 'sales':
      return query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', 'sale')
      )
    case 'expenses':
      return query(
        collection(db, 'transactions'),
        where('userId', '==', userId),
        where('type', '==', 'expense')
      )
    case 'profit_loss':
      return query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      )
    default:
      return query(
        collection(db, 'transactions'),
        where('userId', '==', userId)
      )
  }
}

function getCollectionName(type: ReportType): string {
  // Map report types to actual collection names in your Firebase
  switch (type) {
    case 'sales':
      return 'transactions' // Using transactions collection with type='sale'
    case 'expenses':
      return 'transactions' // Using transactions collection with type='expense'
    case 'purchases':
      return 'transactions' // Using transactions collection with type='purchase'
    case 'inventory':
      return 'inventory'
    case 'profit_loss':
      return 'transactions'
    default:
      return 'transactions'
  }
}

function getPreviousPeriodFilter(filter: ReportFilter): ReportFilter {
  const currentStart = filter.dateRange?.startDate || new Date(new Date().setMonth(new Date().getMonth() - 1))
  const currentEnd = filter.dateRange?.endDate || new Date()
  const duration = currentEnd.getTime() - currentStart.getTime()
  
  const previousStart = new Date(currentStart.getTime() - duration)
  const previousEnd = new Date(currentStart)
  
  return {
    ...filter,
    dateRange: {
      startDate: previousStart,
      endDate: previousEnd
    }
  }
}

function getReportTitle(type: ReportType): string {
  const titles: Record<ReportType, string> = {
    sales: 'Sales Report',
    expenses: 'Expenses Report',
    purchases: 'Purchase Report',
    inventory: 'Inventory Report',
    profit_loss: 'Profit & Loss Statement'
  }
  return titles[type]
}

function getReportDescription(type: ReportType): string {
  const descriptions: Record<ReportType, string> = {
    sales: 'Overview of all sales transactions and revenue',
    expenses: 'Breakdown of all business expenses',
    purchases: 'Analysis of inventory purchases',
    inventory: 'Current stock levels and movement',
    profit_loss: 'Complete profit and loss analysis'
  }
  return descriptions[type]
} 