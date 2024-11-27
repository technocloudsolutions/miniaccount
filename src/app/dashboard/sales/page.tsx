'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';
import AddSaleModal from '@/components/sales/AddSaleModal';
import SalesTable from '@/components/sales/SalesTable';
import SalesCharts from '@/components/sales/SalesCharts';
import InvoiceView from '@/components/sales/InvoiceView';
import type { Sale } from '@/types';

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const salesRef = collection(db, 'transactions');
      const q = query(
        salesRef,
        where('userId', '==', user.uid),
        where('type', '==', 'sale')
      );

      const querySnapshot = await getDocs(q);
      const salesData: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Raw sale data:', data);
        salesData.push({
          id: doc.id,
          date: data.date || new Date().toISOString(),
          customerName: data.customerName || '',
          description: data.description || '',
          quantity: Number(data.quantity) || 0,
          unitPrice: Number(data.unitPrice) || 0,
          amount: Number(data.amount) || 0,
          paymentMethod: data.paymentMethod || 'cash',
          bankAccountId: data.bankAccountId || '',
          status: data.status || 'completed',
          notes: data.notes || '',
          userId: data.userId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });

      // Sort sales by date
      salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('Processed sales data:', salesData);
      setSales(salesData);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSales();
    }
  }, [user]);

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'userId'>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const now = new Date().toISOString();
      
      const transactionData = {
        ...saleData,
        type: 'sale',
        userId: user.uid,
        createdAt: now,
        updatedAt: now,
      };

      console.log('Adding sale with data:', transactionData);

      const salesRef = collection(db, 'transactions');
      await addDoc(salesRef, transactionData);
      await fetchSales();
      setIsAddModalOpen(false);
      setSelectedSale(null);
    } catch (err) {
      console.error('Error adding sale:', err);
      setError('Failed to add sale');
    }
  };

  const handleEditSale = async (saleData: Omit<Sale, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user || !selectedSale) {
      setError('User not authenticated or no sale selected');
      return;
    }

    try {
      setError(null);
      const saleRef = doc(db, 'transactions', selectedSale.id);
      
      await updateDoc(saleRef, {
        ...saleData,
        amount: saleData.quantity * saleData.unitPrice,
        updatedAt: new Date().toISOString(),
      });
      
      await fetchSales();
      setIsAddModalOpen(false);
      setSelectedSale(null);
    } catch (err) {
      console.error('Error updating sale:', err);
      setError('Failed to update sale');
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this sale?')) {
      return;
    }

    try {
      setError(null);
      await deleteDoc(doc(db, 'transactions', saleId));
      await fetchSales();
    } catch (err) {
      console.error('Error deleting sale:', err);
      setError('Failed to delete sale');
    }
  };

  const handleInvoiceClick = (sale: Sale) => {
    setSelectedSale(sale);
    setIsInvoiceModalOpen(true);
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Sales</h1>
          {error && (
            <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>
        <button
          onClick={() => {
            setSelectedSale(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Sale
        </button>
      </div>

      {!loading && sales.length > 0 && (
        <SalesCharts sales={sales} />
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <SalesTable 
          sales={sales} 
          onEdit={handleEdit}
          onDelete={handleDeleteSale}
          onInvoice={handleInvoiceClick}
        />
      )}

      {isAddModalOpen && (
        <AddSaleModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedSale(null);
          }}
          onAdd={selectedSale ? handleEditSale : handleAddSale}
          initialData={selectedSale}
        />
      )}

      {isInvoiceModalOpen && selectedSale && (
        <InvoiceView
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedSale(null);
          }}
          sale={selectedSale}
        />
      )}
    </div>
  );
} 