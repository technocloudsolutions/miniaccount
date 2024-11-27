import { db } from './firebase'; // Make sure you have this firebase config file
import { collection, getDocs, addDoc, deleteDoc, doc, setDoc, serverTimestamp, query, where, updateDoc, getDoc } from 'firebase/firestore';
import type { BankAccount, ExpenseCategory, SupplierCategory, Purchase, Supplier, InventoryItem, InventoryCategory, InventoryTransaction } from '@/types';
import { auth } from './firebase';

export const bankAccountsService = {
  async getAll(): Promise<BankAccount[]> {
    const querySnapshot = await getDocs(collection(db, 'bankAccounts'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BankAccount[];
  },

  async add(account: Omit<BankAccount, 'id'>): Promise<void> {
    await addDoc(collection(db, 'bankAccounts'), account);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'bankAccounts', id));
  }
};

export const categoryService = {
  async getAll(): Promise<ExpenseCategory[]> {
    const querySnapshot = await getDocs(collection(db, 'expenseCategories'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ExpenseCategory[];
  },

  async add(category: Omit<ExpenseCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    await addDoc(collection(db, 'expenseCategories'), {
      ...category,
      createdAt: now,
      updatedAt: now
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'expenseCategories', id));
  }
};

export const addSupplierCategory = async (data: Omit<SupplierCategory, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'supplierCategories');
    const timestamp = serverTimestamp();
    
    await addDoc(docRef, {
      ...data,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addSupplierCategory:', error);
    throw error;
  }
};

export const getSupplierCategories = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const supplierCategoriesRef = collection(db, 'supplierCategories');
    const q = query(supplierCategoriesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SupplierCategory[];
  } catch (error) {
    console.error('Error in getSupplierCategories:', error);
    throw error;
  }
};

export const addPurchase = async (data: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'purchases');
    const timestamp = serverTimestamp();
    
    await addDoc(docRef, {
      ...data,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addPurchase:', error);
    throw error;
  }
};

export const getPurchases = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const purchasesRef = collection(db, 'purchases');
    const q = query(purchasesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Purchase[];
  } catch (error) {
    console.error('Error in getPurchases:', error);
    throw error;
  }
};

export const deleteSupplierCategory = async (id: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'supplierCategories', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error in deleteSupplierCategory:', error);
    throw error;
  }
};

export const addSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'suppliers');
    const timestamp = serverTimestamp();
    
    await addDoc(docRef, {
      ...data,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addSupplier:', error);
    throw error;
  }
};

export const getSuppliers = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const suppliersRef = collection(db, 'suppliers');
    const q = query(suppliersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Supplier[];
  } catch (error) {
    console.error('Error in getSuppliers:', error);
    throw error;
  }
};

export const deleteSupplier = async (id: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'suppliers', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error in deleteSupplier:', error);
    throw error;
  }
};

export const updatePurchase = async (id: string, data: Partial<Purchase>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'purchases', id);
    const timestamp = serverTimestamp();
    
    await updateDoc(docRef, {
      ...data,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in updatePurchase:', error);
    throw error;
  }
};

export const deletePurchase = async (id: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'purchases', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error in deletePurchase:', error);
    throw error;
  }
};

export const addInventoryCategory = async (data: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'inventoryCategories');
    const timestamp = serverTimestamp();
    
    await addDoc(docRef, {
      ...data,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addInventoryCategory:', error);
    throw error;
  }
};

export const getInventoryCategories = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const categoriesRef = collection(db, 'inventoryCategories');
    const q = query(categoriesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryCategory[];
  } catch (error) {
    console.error('Error in getInventoryCategories:', error);
    throw error;
  }
};

export const addInventoryItem = async (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'inventoryItems');
    const timestamp = serverTimestamp();
    
    // Store initial values
    const initialQuantity = data.quantity;
    const initialUnitPrice = data.unitPrice;
    const initialTotalAmount = initialQuantity * initialUnitPrice;
    
    await addDoc(docRef, {
      ...data,
      initialQuantity,
      initialUnitPrice,
      totalAmount: initialTotalAmount,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addInventoryItem:', error);
    throw error;
  }
};

export const getInventoryItems = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const itemsRef = collection(db, 'inventoryItems');
    const q = query(itemsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryItem[];
  } catch (error) {
    console.error('Error in getInventoryItems:', error);
    throw error;
  }
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'inventoryItems', id);
    const timestamp = serverTimestamp();
    
    // If quantity or unit price is being updated, recalculate total amount
    if (data.quantity !== undefined || data.unitPrice !== undefined) {
      const itemDoc = await getDoc(docRef);
      const currentItem = itemDoc.data() as InventoryItem;
      
      const newQuantity = data.quantity ?? currentItem.quantity;
      const newUnitPrice = data.unitPrice ?? currentItem.unitPrice;
      const newTotalAmount = newQuantity * newUnitPrice;
      
      await updateDoc(docRef, {
        ...data,
        totalAmount: newTotalAmount,
        updatedAt: timestamp,
      });
    } else {
      await updateDoc(docRef, {
        ...data,
        updatedAt: timestamp,
      });
    }
  } catch (error) {
    console.error('Error in updateInventoryItem:', error);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = doc(db, 'inventoryItems', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error);
    throw error;
  }
};

export const addInventoryTransaction = async (data: Omit<InventoryTransaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const docRef = collection(db, 'inventoryTransactions');
    const timestamp = serverTimestamp();
    
    // Update inventory item quantity and total amount
    const itemRef = doc(db, 'inventoryItems', data.itemId);
    const itemDoc = await getDoc(itemRef);
    const item = itemDoc.data() as InventoryItem;
    
    const quantityChange = data.type === 'in' ? data.quantity : -data.quantity;
    const newQuantity = item.quantity + quantityChange;
    const newTotalAmount = newQuantity * item.unitPrice; // Calculate new total amount

    await updateDoc(itemRef, {
      quantity: newQuantity,
      totalAmount: newTotalAmount, // Update total amount
      updatedAt: timestamp,
    });

    // Add transaction record
    await addDoc(docRef, {
      ...data,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  } catch (error) {
    console.error('Error in addInventoryTransaction:', error);
    throw error;
  }
};

export const getInventoryTransactions = async (itemId?: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const transactionsRef = collection(db, 'inventoryTransactions');
    let q = query(transactionsRef, where('userId', '==', userId));
    
    if (itemId) {
      q = query(q, where('itemId', '==', itemId));
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as InventoryTransaction[];
  } catch (error) {
    console.error('Error in getInventoryTransactions:', error);
    throw error;
  }
};

export const getBankAccounts = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    const bankAccountsRef = collection(db, 'bankAccounts');
    const q = query(bankAccountsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BankAccount[];
  } catch (error) {
    console.error('Error in getBankAccounts:', error);
    throw error;
  }
}; 