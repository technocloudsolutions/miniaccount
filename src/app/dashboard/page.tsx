'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

interface Transaction {
  id: string;
  type: 'sale' | 'expense' | 'purchase';
  amount: number;
  description: string;
  date: string;
  customer?: string;
  category?: string;
  userId: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalExpenses: 0,
    totalPurchases: 0,
    netProfit: 0,
    todaySales: 0,
    todayExpenses: 0,
    todayPurchases: 0,
    monthSales: 0,
    monthExpenses: 0,
    monthPurchases: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('si-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    });
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Initialize stats
        const totalStats = {
          totalSales: 0,
          totalExpenses: 0,
          totalPurchases: 0,
          todaySales: 0,
          todayExpenses: 0,
          todayPurchases: 0,
          monthSales: 0,
          monthExpenses: 0,
          monthPurchases: 0,
        };

        const transactions: Transaction[] = [];

        // Fetch transactions
        const transactionsRef = collection(db, 'transactions');
        const transactionsQuery = query(
          transactionsRef,
          where('userId', '==', user.uid)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);

        // Process transactions
        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          const transactionDate = new Date(data.date);
          transactionDate.setHours(0, 0, 0, 0);
          const amount = data.amount || 0;
          const transactionType = (data.type || '').toLowerCase().trim();

          transactions.push({
            id: doc.id,
            type: transactionType as 'sale' | 'expense' | 'purchase',
            amount: amount,
            description: data.description || '',
            date: data.date,
            customer: data.customer,
            category: data.category,
            userId: data.userId
          } as Transaction);

          if (transactionType === 'sale' || transactionType === 'sales') {
            totalStats.totalSales += amount;
            if (isSameDay(transactionDate, today)) {
              totalStats.todaySales += amount;
            }
            if (transactionDate >= firstDayOfMonth) {
              totalStats.monthSales += amount;
            }
          } else if (transactionType === 'expense' || transactionType === 'expenses') {
            if (isSameDay(transactionDate, today)) {
              totalStats.todayExpenses += amount;
            }
            if (transactionDate >= firstDayOfMonth) {
              totalStats.monthExpenses += amount;
            }
            totalStats.totalExpenses += amount;
          }
        });

        // Fetch purchases
        const purchasesRef = collection(db, 'purchases');
        const purchasesQuery = query(
          purchasesRef,
          where('userId', '==', user.uid)
        );
        const purchasesSnapshot = await getDocs(purchasesQuery);

        // Process purchases
        purchasesSnapshot.forEach((doc) => {
          const data = doc.data();
          const purchaseDate = new Date(data.purchaseDate);
          purchaseDate.setHours(0, 0, 0, 0);
          const amount = data.amount || 0;

          transactions.push({ 
            ...data, 
            id: doc.id,
            type: 'purchase',
            date: data.purchaseDate,
            amount: amount,
            description: data.description || '',
            userId: data.userId
          } as Transaction);

          if (isSameDay(purchaseDate, today)) {
            totalStats.todayPurchases += amount;
          }
          if (purchaseDate >= firstDayOfMonth) {
            totalStats.monthPurchases += amount;
          }
          totalStats.totalPurchases += amount;
        });

        // Sort and set transactions
        const sortedTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        setRecentTransactions(sortedTransactions);
        setStats({
          ...totalStats,
          netProfit: totalStats.totalSales - (totalStats.totalPurchases + totalStats.totalExpenses),
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today&apos;s Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today&apos;s Summary</h3>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sales</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(stats.todaySales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Purchases</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {formatCurrency(stats.todayPurchases)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(stats.todayExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Summary</h3>
            <CalendarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Sales</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(stats.monthSales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Purchases</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {formatCurrency(stats.monthPurchases)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Expenses</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(stats.monthExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Profit</h3>
            <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Sales</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                {formatCurrency(stats.totalSales)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Purchases</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                {formatCurrency(stats.totalPurchases)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Expenses</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {formatCurrency(stats.totalExpenses)}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Profit</span>
                <span className={`text-lg font-semibold ${
                  stats.netProfit >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(stats.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'sale' 
                        ? 'bg-green-100 dark:bg-green-900' 
                        : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'sale' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                        {transaction.customer && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            • {transaction.customer}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.date).toLocaleDateString('si-LK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${
                    transaction.type === 'sale'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'sale' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400">No recent transactions</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 