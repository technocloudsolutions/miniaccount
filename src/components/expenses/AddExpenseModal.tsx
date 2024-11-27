'use client';

import { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { Expense, BankAccount, ExpenseCategory } from '@/types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expenseData: Omit<Expense, 'id' | 'type' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Expense | null;
}

export default function AddExpenseModal({ isOpen, onClose, onAdd, initialData }: AddExpenseModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentAmount: '',
    description: '',
    category: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit' | 'cheque',
    bankAccountId: '',
    date: new Date().toISOString().split('T')[0],
    billedDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        paymentAmount: initialData.paymentAmount?.toString() || '',
        description: initialData.description,
        category: initialData.category,
        paymentMethod: initialData.paymentMethod,
        bankAccountId: initialData.bankDetails?.bankAccountId || '',
        date: initialData.date,
        billedDate: initialData.billedDate || initialData.date,
      });
    }
  }, [initialData]);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const accountsRef = collection(db, 'bankAccounts');
      let q;
      
      if (formData.paymentMethod === 'cheque') {
        q = query(
          accountsRef, 
          where('userId', '==', userId),
          where('category', 'in', ['checking', 'current'])
        );
      } else {
        q = query(accountsRef, where('userId', '==', userId));
      }

      const querySnapshot = await getDocs(q);
      const accounts: BankAccount[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as BankAccount);
      });

      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  }, [formData.paymentMethod]);

  useEffect(() => {
    fetchCategories();
    if (formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cheque') {
      fetchBankAccounts();
    }
  }, [formData.paymentMethod, fetchBankAccounts]);

  const fetchCategories = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const categoriesRef = collection(db, 'expenseCategories');
      const q = query(categoriesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const fetchedCategories: ExpenseCategory[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() } as ExpenseCategory);
      });

      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expenseData = {
        amount: parseFloat(formData.amount),
        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : 0,
        description: formData.description,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        billedDate: formData.billedDate,
        type: 'expense' as const,
      } as Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

      if ((formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cheque') && formData.bankAccountId) {
        const selectedBank = bankAccounts.find(bank => bank.id === formData.bankAccountId);
        if (selectedBank) {
          expenseData.bankDetails = {
            bankAccountId: selectedBank.id,
            bankName: selectedBank.bankName,
            accountNumber: selectedBank.accountNumber,
            accountHolder: selectedBank.accountHolder,
            category: selectedBank.category,
            branch: selectedBank.branch,
            swiftCode: selectedBank.swiftCode,
          };
        }
      }

      if (initialData?.id) {
        await onAdd({
          ...expenseData,
          id: initialData.id,
        } as Expense);
      } else {
        await onAdd(expenseData);
      }

      setFormData({
        amount: '',
        paymentAmount: '',
        description: '',
        category: '',
        paymentMethod: 'cash',
        bankAccountId: '',
        date: new Date().toISOString().split('T')[0],
        billedDate: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                      {initialData ? 'Edit Expense' : 'Add New Expense'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Bill Amount
                        </label>
                        <input
                          type="number"
                          id="amount"
                          step="0.01"
                          required
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Payment Amount
                        </label>
                        <input
                          type="number"
                          id="paymentAmount"
                          step="0.01"
                          value={formData.paymentAmount}
                          onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          placeholder="Enter payment amount if different from bill amount"
                        />
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Category
                        </label>
                        <select
                          id="category"
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <input
                          type="text"
                          id="description"
                          required
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Payment Method
                        </label>
                        <select
                          id="paymentMethod"
                          required
                          value={formData.paymentMethod}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as typeof formData.paymentMethod })}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="credit">Credit</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>

                      {(formData.paymentMethod === 'bank_transfer' || formData.paymentMethod === 'cheque') && (
                        <div>
                          <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Bank Account
                          </label>
                          <select
                            id="bankAccount"
                            required
                            value={formData.bankAccountId}
                            onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="">Select a bank account</option>
                            {bankAccounts.map((account) => (
                              <option key={account.id} value={account.id}>
                                {account.bankName} - {account.accountNumber}
                              </option>
                            ))}
                          </select>
                          {bankAccounts.length === 0 && (
                            <p className="mt-1 text-sm text-red-500">
                              No bank accounts found. Please add one in Settings first.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="billedDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Billed Date
                          </label>
                          <input
                            type="date"
                            id="billedDate"
                            required
                            value={formData.billedDate}
                            onChange={(e) => setFormData({ ...formData, billedDate: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Payment Date
                          </label>
                          <input
                            type="date"
                            id="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              {initialData ? 'Updating...' : 'Adding...'}
                            </div>
                          ) : (
                            initialData ? 'Update Expense' : 'Add Expense'
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 