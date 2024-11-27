'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import AddExpenseModal from '@/components/expenses/AddExpenseModal';
import ExpensesTable from '@/components/expenses/ExpensesTable';
import ExpensesCharts from '@/components/expenses/ExpensesCharts';

// Define the Expense type since it can't be imported
type Expense = {
  id: string;
  amount: number;
  paymentAmount: number;
  description: string;
  date: string;
  category: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'cheque';
  bankDetails?: {
    bankAccountId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    category: string;
    branch?: string;
    swiftCode?: string;
  };
  billedDate?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  type: 'expense';
  currency: string;
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const fetchExpenses = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const expensesRef = collection(db, 'transactions');
      const q = query(
        expensesRef,
        where('userId', '==', user.uid),
        where('type', '==', 'expense')
      );

      const querySnapshot = await getDocs(q);
      const expensesData: Expense[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          amount: data.amount || 0,
          paymentAmount: data.paymentAmount || 0,
          description: data.description || '',
          date: data.date || data.createdAt || new Date().toISOString(),
          category: data.category || 'other',
          paymentMethod: (data.paymentMethod || 'cash') as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'cheque',
          bankDetails: data.bankDetails,
          billedDate: data.billedDate,
          userId: data.userId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          type: 'expense',
          currency: data.currency || 'LKR'
        });
      });

      // Sort expenses by date
      expensesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setExpenses(expensesData);
    } catch (err: unknown) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user, fetchExpenses]);

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'type'>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const transactionData = {
        ...expenseData,
        type: 'expense' as const,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currency: 'LKR'
      };

      await addDoc(collection(db, 'transactions'), transactionData);
      await fetchExpenses();
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error adding expense:', err);
      setError('Failed to add expense');
    }
  };

  const handleEditExpense = async (expenseData: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'type'>) => {
    if (!selectedExpense) return;
    
    try {
      setError(null);
      const expenseRef = doc(db, 'transactions', selectedExpense.id);
      
      const updateData = {
        ...expenseData,
        id: selectedExpense.id,
        userId: selectedExpense.userId,
        type: 'expense' as const,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(expenseRef, updateData);
      await fetchExpenses();
      setIsModalOpen(false);
      setSelectedExpense(null);
    } catch (err) {
      console.error('Error updating expense:', err);
      setError('Failed to update expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setError(null);
      await deleteDoc(doc(db, 'transactions', expenseId));
      await fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Expenses</h1>
          {error && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedExpense(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Expense
        </button>
      </div>

      {!loading && expenses.length > 0 && (
        <ExpensesCharts expenses={expenses} />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <ExpensesTable 
          expenses={expenses} 
          onEdit={handleEdit}
          onDelete={handleDeleteExpense}
        />
      )}

      {isModalOpen && (
        <AddExpenseModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedExpense(null);
          }}
          onAdd={selectedExpense ? handleEditExpense : handleAddExpense}
          initialData={selectedExpense}
        />
      )}
    </div>
  );
} 