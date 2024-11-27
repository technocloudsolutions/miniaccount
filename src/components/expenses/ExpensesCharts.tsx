'use client';

import { useMemo } from 'react';
import type { Expense } from '@/types';

interface ExpensesChartsProps {
  expenses: Expense[];
}

export default function ExpensesCharts({ expenses }: ExpensesChartsProps) {
  // Calculate monthly expenses data
  const monthlyData = useMemo(() => {
    const data = new Map<string, { total: number; count: number }>();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const current = data.get(monthKey) || { total: 0, count: 0 };
      data.set(monthKey, {
        total: current.total + expense.amount,
        count: current.count + 1
      });
    });

    // Convert to array and sort by date
    return Array.from(data.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6); // Last 6 months
  }, [expenses]);

  // Calculate category distribution
  const categoryData = useMemo(() => {
    const data = new Map<string, { total: number; count: number }>();
    
    expenses.forEach(expense => {
      const current = data.get(expense.category) || { total: 0, count: 0 };
      data.set(expense.category, {
        total: current.total + expense.amount,
        count: current.count + 1
      });
    });

    return Array.from(data.entries());
  }, [expenses]);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('si-LK', {
      style: 'currency',
      currency: 'LKR'
    });
  };

  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
  };

  // Calculate max value for chart scaling
  const maxMonthlyTotal = Math.max(...monthlyData.map(([, data]) => data.total));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Expenses Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Monthly Expenses</h3>
        <div className="h-64 flex items-end space-x-2">
          {monthlyData.map(([month, data]) => (
            <div key={month} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-red-100 dark:bg-red-900/30 rounded-t relative" 
                style={{ height: `${(data.total / maxMonthlyTotal) * 100}%` }}>
                <div className="absolute -top-6 w-full text-center text-sm text-gray-600 dark:text-gray-400">
                  {formatAmount(data.total)}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {getMonthName(month)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expense Categories</h3>
        <div className="space-y-4">
          {categoryData.map(([category, data]) => (
            <div key={category}>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>{category}</span>
                <span>{formatAmount(data.total)} ({data.count} expenses)</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{
                    width: `${(data.total / expenses.reduce((acc, expense) => acc + expense.amount, 0)) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 