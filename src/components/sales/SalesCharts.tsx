'use client';
import { Sale } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SalesChartsProps {
  sales: Sale[];
}

export default function SalesCharts({ sales }: SalesChartsProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('si-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  // Group sales by month
  const monthlySales = sales.reduce((acc, sale) => {
    const date = new Date(sale.date);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        name: monthYear,
        total: 0,
        count: 0,
      };
    }
    
    acc[monthYear].total += sale.amount;
    acc[monthYear].count += 1;
    
    return acc;
  }, {} as Record<string, { name: string, total: number, count: number }>);

  // Calculate daily sales for the current month
  const currentMonthSales = sales.reduce((acc, sale) => {
    const date = new Date(sale.date);
    const today = new Date();
    
    if (date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
      const day = date.getDate();
      const dayStr = `Day ${day}`;
      
      if (!acc[dayStr]) {
        acc[dayStr] = {
          name: dayStr,
          total: 0,
          count: 0,
        };
      }
      
      acc[dayStr].total += sale.amount;
      acc[dayStr].count += 1;
    }
    
    return acc;
  }, {} as Record<string, { name: string, total: number, count: number }>);

  const monthlyData = Object.values(monthlySales);
  const dailyData = Object.values(currentMonthSales);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Monthly Sales Overview</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="total" fill="#3B82F6" name="Total Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Current Month Daily Sales</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="total" fill="#10B981" name="Daily Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 