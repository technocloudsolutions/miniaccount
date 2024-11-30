'use client';
import { useState, useEffect } from 'react';
import { Sale, BankAccount, PaymentMethod } from '@/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { formatCurrency } from '@/utils/format';
import { getBankAccounts } from '@/lib/firebaseService';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (saleData: Omit<Sale, 'id' | 'userId'>) => Promise<void>;
  initialData?: Sale | null;
}

export default function AddSaleModal({ isOpen, onClose, onAdd, initialData }: AddSaleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    customerName: initialData?.customerName || '',
    description: initialData?.description || '',
    quantity: initialData?.quantity.toString() || '',
    unitPrice: initialData?.unitPrice.toString() || '',
    paymentMethod: initialData?.paymentMethod || 'cash',
    bankAccountId: initialData?.bankAccountId || '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    if (formData.paymentMethod === 'bank_transfer') {
      loadBankAccounts();
    }
  }, [formData.paymentMethod]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await getBankAccounts();
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      setError('Failed to load bank accounts');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const quantity = Number(formData.quantity);
      const unitPrice = Number(formData.unitPrice);
      const amount = quantity * unitPrice;

      await onAdd({
        date: formData.date,
        customerName: formData.customerName,
        description: formData.description,
        quantity,
        unitPrice,
        amount,
        paymentMethod: formData.paymentMethod,
        status: 'completed',
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      onClose();
    } catch (err) {
      console.error('Error adding sale:', err);
      setError(err instanceof Error ? err.message : 'Failed to add sale');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit Sale' : 'Add Sale'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({...formData, customerName: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Unit Price (LKR)
            </label>
            <input
              type="number"
              value={formData.unitPrice}
              onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit">Credit</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {formData.paymentMethod === 'bank_transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bank Account
              </label>
              <select
                value={formData.bankAccountId}
                onChange={(e) => setFormData({...formData, bankAccountId: e.target.value})}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select bank account</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} - {account.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              rows={3}
            />
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Sale' : 'Add Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 