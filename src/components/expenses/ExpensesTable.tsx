'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Expense } from '@/types';

interface ExpensesTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
}

export default function ExpensesTable({ expenses, onEdit, onDelete }: ExpensesTableProps) {
  const [sortField, setSortField] = useState<keyof Expense>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Get unique categories for filter
  const categories = [...new Set(expenses.map(expense => expense.category))];

  // Filter function
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentMethod = filterPaymentMethod === '' || 
      expense.paymentMethod === filterPaymentMethod;

    const matchesCategory = filterCategory === '' || 
      expense.category === filterCategory;

    const matchesDateRange = (!dateRange.start || new Date(expense.date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(expense.date) <= new Date(dateRange.end));

    return matchesSearch && matchesPaymentMethod && matchesCategory && matchesDateRange;
  });

  // Sort filtered results
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortField === 'date' || sortField === 'billedDate') {
      return sortDirection === 'desc' 
        ? new Date(b[sortField] || b.date).getTime() - new Date(a[sortField] || a.date).getTime()
        : new Date(a[sortField] || a.date).getTime() - new Date(b[sortField] || b.date).getTime();
    }
    if (sortField === 'amount' || sortField === 'paymentAmount') {
      const aValue = Number(a[sortField]) || 0;
      const bValue = Number(b[sortField]) || 0;
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    }
    return sortDirection === 'desc'
      ? String(b[sortField]).localeCompare(String(a[sortField]))
      : String(a[sortField]).localeCompare(String(b[sortField]));
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = sortedExpenses.slice(startIndex, startIndex + itemsPerPage);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const handleSort = (field: keyof Expense) => {
    setSortDirection(currentDirection => 
      sortField === field && currentDirection === 'desc' ? 'asc' : 'desc'
    );
    setSortField(field);
  };

  const SortIndicator = ({ field }: { field: keyof Expense }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1">
        {sortDirection === 'desc' ? '↓' : '↑'}
      </span>
    );
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('si-LK');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const formatAmount = (amount: number) => {
    try {
      return amount.toLocaleString('si-LK', {
        style: 'currency',
        currency: 'LKR'
      });
    } catch (error) {
      console.error('Error formatting amount:', error);
      return `Rs. ${amount.toLocaleString()}`;
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const calculateBalance = (billAmount: number, paymentAmount?: number) => {
    if (!paymentAmount && paymentAmount !== 0) return billAmount;
    
    const bill = Number(billAmount);
    const payment = Number(paymentAmount);
    
    return Math.max(0, bill - payment);
  };

  const getPaymentStatus = (expense: Expense) => {
    if (!expense.paymentAmount && expense.paymentAmount !== 0) return 'unpaid';
    
    const payment = Number(expense.paymentAmount);
    const total = Number(expense.amount);
    
    if (payment === 0) return 'unpaid';
    if (payment >= total) return 'paid';
    if (payment > 0) return 'partial';
    return 'unpaid';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400';
      case 'partial':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const renderPaymentAmount = (expense: Expense) => {
    console.log('Expense payment data:', {
      id: expense.id,
      amount: expense.amount,
      paymentAmount: expense.paymentAmount,
      type: typeof expense.paymentAmount
    });

    const paymentStatus = getPaymentStatus(expense);
    const statusColor = getStatusColor(paymentStatus);

    if (expense.paymentAmount === null || expense.paymentAmount === undefined) {
      return (
        <div>
          <span className="text-red-600 dark:text-red-400">Unpaid</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">No Payment</span>
        </div>
      );
    }

    const paymentAmount = Number(expense.paymentAmount);

    if (paymentAmount === 0 || isNaN(paymentAmount)) {
      return (
        <div>
          <span className="text-red-600 dark:text-red-400">Rs. 0.00</span>
          <span className="block text-xs text-gray-500 dark:text-gray-400">Unpaid</span>
        </div>
      );
    }

    return (
      <div>
        <span className={statusColor}>
          {formatAmount(paymentAmount)}
        </span>
        <span className="block text-xs text-gray-500 dark:text-gray-400">
          {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
        </span>
      </div>
    );
  };

  // Add filter controls above the table
  const FilterControls = () => (
    <div className="mb-4 space-y-2 sm:space-y-0 sm:flex sm:space-x-4 items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by description or category..."
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Category
        </label>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Payment Method
        </label>
        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cheque">Cheque</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Date Range
        </label>
        <div className="flex space-x-2">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setSearchTerm('');
            setFilterPaymentMethod('');
            setFilterCategory('');
            setDateRange({ start: '', end: '' });
          }}
          className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Clear Filters
        </button>
        <button
          onClick={() => {
            const csvContent = generateCSV(sortedExpenses);
            downloadCSV(csvContent, 'expenses_report.csv');
          }}
          className="px-3 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
        >
          Export CSV
        </button>
      </div>
    </div>
  );

  // CSV export functions
  const generateCSV = (data: Expense[]) => {
    const headers = ['Billed Date', 'Payment Date', 'Category', 'Description', 'Payment Method', 'Bill Amount', 'Payment', 'Balance'];
    const rows = data.map(expense => {
      const balance = calculateBalance(expense.amount, expense.paymentAmount);
      return [
        formatDate(expense.billedDate || expense.date),
        formatDate(expense.date),
        expense.category,
        expense.description,
        formatPaymentMethod(expense.paymentMethod),
        formatAmount(expense.amount),
        formatAmount(expense.paymentAmount || 0),
        formatAmount(balance)
      ];
    });
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const PaginationControls = () => (
    <div className="mt-4 flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(startIndex + itemsPerPage, sortedExpenses.length)}
            </span>{' '}
            of <span className="font-medium">{sortedExpenses.length}</span> results
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            {/* Page numbers */}
            {[...Array(totalPages)].map((_, i) => {
              const pageNumber = i + 1;
              const isCurrentPage = pageNumber === currentPage;
              const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 1;
              const isEndPage = pageNumber === 1 || pageNumber === totalPages;

              if (!isNearCurrentPage && !isEndPage) {
                if (pageNumber === 2 || pageNumber === totalPages - 1) {
                  return <span key={i} className="px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400">...</span>;
                }
                return null;
              }

              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Last
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <FilterControls />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Billed Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Bill Amount
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Balance
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedExpenses.length > 0 ? (
                paginatedExpenses.map((expense) => {
                  console.log('Processing expense:', {
                    id: expense.id,
                    amount: expense.amount,
                    paymentAmount: expense.paymentAmount
                  });

                  const balance = calculateBalance(expense.amount, expense.paymentAmount);
                  
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(expense.billedDate || expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                        <div>
                          {expense.description}
                          {expense.bankDetails && (
                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Bank: {expense.bankDetails.bankName} • Account: {expense.bankDetails.accountNumber}
                              {expense.bankDetails.branch && ` • Branch: ${expense.bankDetails.branch}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {formatPaymentMethod(expense.paymentMethod)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400 font-medium">
                        {formatAmount(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {renderPaymentAmount(expense)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {balance > 0 ? (
                          <div>
                            <span className="text-orange-600 dark:text-orange-400">
                              {formatAmount(balance)}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              Outstanding
                            </span>
                          </div>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">Cleared</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              try {
                                onEdit(expense);
                              } catch (error) {
                                console.error('Error editing expense:', error);
                                // Optionally add user feedback here
                              }
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit expense"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete expense"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No expenses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <PaginationControls />
      
      {/* ... existing mobile styles ... */}
    </div>
  );
} 