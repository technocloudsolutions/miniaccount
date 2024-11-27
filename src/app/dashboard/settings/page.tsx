'use client';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, CurrencyDollarIcon, TagIcon } from '@heroicons/react/24/outline';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { addSupplierCategory, getSupplierCategories, deleteSupplierCategory, addSupplier, getSuppliers, deleteSupplier, addInventoryCategory, getInventoryCategories } from '@/lib/firebaseService';
import { SupplierCategory, Supplier, InventoryCategory } from '@/types';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parentId?: string | null;
  isActive?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

interface TabProps {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

const bankCategories = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'checking', label: 'Checking Account' },
  { value: 'business', label: 'Business Account' },
  { value: 'current', label: 'Current Account' },
  { value: 'merchant', label: 'Merchant Account' },
] as const;

type BankCategory = typeof bankCategories[number]['value'];

type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  category: BankCategory;
  branch?: string;
  swiftCode?: string;
  createdAt: string;
  updatedAt: string;
};

interface TabItem {
  id: 'bankAccounts' | 'expenseCategories' | 'supplierCategories' | 'suppliers' | 'inventoryCategories';
  label: string;
  icon: React.ComponentType<any>;
}

export default function SettingsPage() {
  const router = useRouter();
  
  // All useState hooks must be declared at the top level
  const [activeTab, setActiveTab] = useState('bankAccounts');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [supplierCategories, setSupplierCategories] = useState<SupplierCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New account state
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    category: 'savings' as BankCategory,
    branch: '',
    swiftCode: '',
  });

  // New category state
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    isActive: true,
  });

  // New subcategory state
  const [newSubcategory, setNewSubcategory] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    parentId: '',
    isActive: true,
  });

  // Supplier category state
  const [newSupplierCategory, setNewSupplierCategory] = useState({
    name: '',
    description: '',
    color: '#4F46E5',
    isActive: true,
  });

  // New supplier state
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    categoryId: '',
    description: '',
  });

  // Add this state
  const [newInventoryCategory, setNewInventoryCategory] = useState({
    name: '',
    description: '',
  });

  // Add this to your state declarations at the top of the component
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      fetchData();
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    
    setIsLoading(true);
    try {
      const [accountsData, categoriesData, supplierCatsData, suppliersData, inventoryCatsData] = await Promise.all([
        fetchBankAccounts(),
        fetchExpenseCategories(),
        getSupplierCategories(),
        getSuppliers(),
        getInventoryCategories(),
      ]);

      if (accountsData) setBankAccounts(accountsData);
      if (categoriesData) setExpenseCategories(categoriesData);
      if (supplierCatsData) setSupplierCategories(supplierCatsData);
      if (suppliersData) setSuppliers(suppliersData);
      if (inventoryCatsData) setInventoryCategories(inventoryCatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupplierCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!newSupplierCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      await addSupplierCategory({ 
        name: newSupplierCategory.name.trim(),
        description: newSupplierCategory.description || '' 
      });
      
      // Reset form
      setNewSupplierCategory({
        name: '',
        description: '',
        color: '#4F46E5',
        isActive: true,
      });
      
      // Fetch updated categories
      const updatedCategories = await getSupplierCategories();
      setSupplierCategories(updatedCategories);
      
    } catch (err) {
      console.error('Error adding supplier category:', err);
      setError(err instanceof Error ? err.message : 'Failed to add supplier category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSupplierCategory = async (categoryId: string) => {
    try {
      setIsLoading(true);
      
      if (!auth.currentUser?.uid) {
        setError('User not authenticated');
        return;
      }

      await deleteSupplierCategory(categoryId);
      
      // Fetch updated data
      const updatedCategories = await getSupplierCategories();
      setSupplierCategories(updatedCategories);
      
      setError(null);
    } catch (err) {
      console.error('Error deleting supplier category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete supplier category');
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fetch functions with sorting and active status
  const fetchBankAccounts = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const accountsRef = collection(db, 'bankAccounts');
      const q = query(accountsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const accounts: BankAccount[] = [];
      querySnapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as BankAccount);
      });

      // Sort by most recently added
      accounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setBankAccounts(accounts);
      return accounts;
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setError('Failed to load bank accounts');
      return [];
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const categoriesRef = collection(db, 'expenseCategories');
      const q = query(categoriesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const categories: ExpenseCategory[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as ExpenseCategory);
      });

      setExpenseCategories(categories);
      return categories;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      setError('Failed to load expense categories');
      return [];
    }
  };

  // New function to update category order
  const handleUpdateCategoryOrder = async (categoryId: string, newOrder: number) => {
    try {
      const docRef = doc(db, 'expenseCategories', categoryId);
      await updateDoc(docRef, {
        order: newOrder,
        updatedAt: new Date().toISOString(),
      });
      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error updating category order:', error);
      setError('Failed to update category order');
    }
  };

  // New function to toggle category active status
  const handleToggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      const docRef = doc(db, 'expenseCategories', categoryId);
      await updateDoc(docRef, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
      });
      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error toggling category status:', error);
      setError('Failed to update category status');
    }
  };

  // Enhanced delete function with cascade delete for subcategories
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Get all subcategories
      const subcategories = expenseCategories.filter(cat => cat.parentId === categoryId);

      // Delete all subcategories first
      for (const subcat of subcategories) {
        const subDocRef = doc(db, 'expenseCategories', subcat.id);
        await deleteDoc(subDocRef);
      }

      // Delete main category
      const docRef = doc(db, 'expenseCategories', categoryId);
      await deleteDoc(docRef);

      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    } finally {
      setIsLoading(false);
    }
  };

  // Bank Account Functions
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const accountsRef = collection(db, 'bankAccounts');
      await addDoc(accountsRef, {
        ...newAccount,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      setNewAccount({
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        category: 'savings',
        branch: '',
        swiftCode: '',
      });

      await fetchBankAccounts();
    } catch (error) {
      console.error('Error adding bank account:', error);
      setError('Failed to add bank account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      setError('');
      
      const docRef = doc(db, 'bankAccounts', accountId);
      await deleteDoc(docRef);

      await fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      setError('Failed to delete bank account');
    } finally {
      setIsLoading(false);
    }
  };

  // Expense Category Functions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const categoriesRef = collection(db, 'expenseCategories');
      await addDoc(categoriesRef, {
        ...newCategory,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setNewCategory({
        name: '',
        description: '',
        color: '#4F46E5',
        isActive: true,
      });

      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error adding expense category:', error);
      setError('Failed to add expense category');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const categoriesRef = collection(db, 'expenseCategories');
      await addDoc(categoriesRef, {
        name: newSubcategory.name,
        description: newSubcategory.description,
        color: newSubcategory.color,
        parentId,
        userId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setNewSubcategory({
        name: '',
        description: '',
        color: '#4F46E5',
        parentId: '',
        isActive: true,
      });

      await fetchExpenseCategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      setError('Failed to add subcategory');
    } finally {
      setIsLoading(false);
    }
  };

  const getMainCategories = () => {
    return expenseCategories.filter(cat => !cat.parentId);
  };

  const getSubcategories = (parentId: string) => {
    return expenseCategories.filter(cat => cat.parentId === parentId);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // New helper functions for filtering and sorting
  const getActiveMainCategories = () => {
    return getMainCategories().filter(cat => cat.isActive !== false);
  };

  const getInactiveMainCategories = () => {
    return getMainCategories().filter(cat => cat.isActive === false);
  };

  const getActiveSubcategories = (parentId: string) => {
    return getSubcategories(parentId).filter(cat => cat.isActive !== false);
  };

  // Add tabs configuration
  const tabs: TabItem[] = [
    { id: 'bankAccounts', label: 'Bank Accounts', icon: CurrencyDollarIcon },
    { id: 'expenseCategories', label: 'Expense Categories', icon: TagIcon },
    { id: 'supplierCategories', label: 'Supplier Categories', icon: TagIcon },
    { id: 'suppliers', label: 'Suppliers', icon: TagIcon },
    { id: 'inventoryCategories', label: 'Inventory Categories', icon: TagIcon },
  ];

  // Add this function to handle adding suppliers
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!newSupplier.name.trim()) {
        setError('Supplier name is required');
        return;
      }

      if (!newSupplier.categoryId) {
        setError('Supplier category is required');
        return;
      }

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      await addSupplier({
        name: newSupplier.name.trim(),
        categoryId: newSupplier.categoryId,
        description: newSupplier.description || '',
      });
      
      // Reset form
      setNewSupplier({
        name: '',
        categoryId: '',
        description: '',
      });
      
      // Fetch updated data
      const [updatedSuppliers, updatedCategories] = await Promise.all([
        getSuppliers(),
        getSupplierCategories(),
      ]);
      
      setSuppliers(updatedSuppliers);
      setSupplierCategories(updatedCategories);
      
    } catch (err) {
      console.error('Error adding supplier:', err);
      setError(err instanceof Error ? err.message : 'Failed to add supplier');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle deleting suppliers
  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      await deleteSupplier(supplierId);
      
      // Fetch updated suppliers
      const updatedSuppliers = await getSuppliers();
      setSuppliers(updatedSuppliers);
      
    } catch (err) {
      console.error('Error deleting supplier:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete supplier');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this handler function
  const handleAddInventoryCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!newInventoryCategory.name.trim()) {
        setError('Category name is required');
        return;
      }

      await addInventoryCategory({ 
        name: newInventoryCategory.name.trim(),
        description: newInventoryCategory.description || '' 
      });
      
      setNewInventoryCategory({
        name: '',
        description: '',
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error adding inventory category:', err);
      setError(err instanceof Error ? err.message : 'Failed to add inventory category');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function with your other handler functions
  const handleDeleteInventoryCategory = async (categoryId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      await deleteDoc(doc(db, 'inventoryCategories', categoryId));
      
      // Fetch updated categories
      const updatedCategories = await getInventoryCategories();
      setInventoryCategories(updatedCategories);
      
    } catch (err) {
      console.error('Error deleting inventory category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete inventory category');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state with better UI
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Error state with better UI
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg">
        <p className="font-medium">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Modify the return statement to use tabs
  return (
    <div className="space-y-6" suppressHydrationWarning>
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                  }
                `} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {/* Bank Accounts Panel */}
        {activeTab === 'bankAccounts' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Bank Accounts</h2>
            
            {/* Add New Bank Account Form */}
            <form onSubmit={handleAddAccount} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    required
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Type
                  </label>
                  <select
                    id="category"
                    required
                    value={newAccount.category}
                    onChange={(e) => setNewAccount({ ...newAccount, category: e.target.value as BankCategory })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    {bankCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    required
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Holder
                  </label>
                  <input
                    type="text"
                    id="accountHolder"
                    required
                    value={newAccount.accountHolder}
                    onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch (Optional)
                  </label>
                  <input
                    type="text"
                    id="branch"
                    value={newAccount.branch}
                    onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SWIFT/IFSC Code (Optional)
                  </label>
                  <input
                    type="text"
                    id="swiftCode"
                    value={newAccount.swiftCode}
                    onChange={(e) => setNewAccount({ ...newAccount, swiftCode: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Bank Account
                </button>
              </div>
            </form>

            {/* Bank Accounts List */}
            <div className="space-y-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{account.bankName}</p>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400">
                        {bankCategories.find(cat => cat.value === account.category)?.label || account.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Account: {account.accountNumber} • Holder: {account.accountHolder}
                    </p>
                    {(account.branch || account.swiftCode) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {account.branch && `Branch: ${account.branch}`}
                        {account.branch && account.swiftCode && ' • '}
                        {account.swiftCode && `SWIFT/IFSC: ${account.swiftCode}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {bankAccounts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">No bank accounts added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Expense Categories Panel */}
        {activeTab === 'expenseCategories' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Expense Categories
            </h2>
            
            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    required
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="categoryColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Color
                  </label>
                  <input
                    type="color"
                    id="categoryColor"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="mt-1 block w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Category
                </button>
              </div>
            </form>

            {/* Categories List */}
            <div className="space-y-4">
              {getActiveMainCategories().map((category) => (
                <div key={category.id} className="space-y-2">
                  {/* Main Category */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleCategoryExpansion(category.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <svg
                          className={`h-4 w-4 transform transition-transform ${
                            expandedCategories.has(category.id) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Subcategories and Add Subcategory Form */}
                  {expandedCategories.has(category.id) && (
                    <div className="ml-8 space-y-2">
                      {/* Subcategories List */}
                      {getActiveSubcategories(category.id).map((subcategory) => (
                        <div
                          key={subcategory.id}
                          className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: subcategory.color }}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {subcategory.name}
                              </p>
                              {subcategory.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {subcategory.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteCategory(subcategory.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {/* Add Subcategory Form */}
                      <form
                        onSubmit={(e) => handleAddSubcategory(e, category.id)}
                        className="mt-2 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <input
                              type="text"
                              placeholder="Subcategory Name"
                              required
                              value={newSubcategory.name}
                              onChange={(e) =>
                                setNewSubcategory({
                                  ...newSubcategory,
                                  name: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Description (Optional)"
                              value={newSubcategory.description}
                              onChange={(e) =>
                                setNewSubcategory({
                                  ...newSubcategory,
                                  description: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={newSubcategory.color}
                              onChange={(e) =>
                                setNewSubcategory({
                                  ...newSubcategory,
                                  color: e.target.value,
                                })
                              }
                              className="h-8 w-8 rounded border border-gray-300 dark:border-gray-600"
                            />
                            <button
                              type="submit"
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-primary-600/80 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                            >
                              <PlusIcon className="h-4 w-4 mr-1" />
                              Add Subcategory
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
              {getActiveMainCategories().length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No expense categories added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Supplier Categories Panel */}
        {activeTab === 'supplierCategories' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Supplier Categories
            </h2>
            
            {/* Error display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                Loading...
              </div>
            )}
            
            {/* Add New Supplier Category Form */}
            <form onSubmit={handleAddSupplierCategory} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="supplierCategoryName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="supplierCategoryName"
                    required
                    value={newSupplierCategory.name}
                    onChange={(e) => setNewSupplierCategory({ ...newSupplierCategory, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label htmlFor="supplierCategoryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    id="supplierCategoryDescription"
                    value={newSupplierCategory.description}
                    onChange={(e) => setNewSupplierCategory({ ...newSupplierCategory, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Supplier Category
                </button>
              </div>
            </form>

            {/* Supplier Categories List */}
            <div className="space-y-4">
              {supplierCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSupplierCategory(category.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {supplierCategories.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No supplier categories added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Suppliers Panel */}
        {activeTab === 'suppliers' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Suppliers
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            
            {isLoading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                Loading...
              </div>
            )}
            
            <form onSubmit={handleAddSupplier} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    required
                    value={newSupplier.categoryId}
                    onChange={(e) => setNewSupplier({ ...newSupplier, categoryId: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select category</option>
                    {supplierCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSupplier.description}
                    onChange={(e) => setNewSupplier({ ...newSupplier, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Supplier
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {supplier.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Category: {supplierCategories.find(cat => cat.id === supplier.categoryId)?.name}
                    </p>
                    {supplier.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {supplier.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {suppliers.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No suppliers added yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Inventory Categories Panel */}
        {activeTab === 'inventoryCategories' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Inventory Categories
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            
            {isLoading && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
                Loading...
              </div>
            )}
            
            <form onSubmit={handleAddInventoryCategory} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newInventoryCategory.name}
                    onChange={(e) => setNewInventoryCategory({ ...newInventoryCategory, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newInventoryCategory.description}
                    onChange={(e) => setNewInventoryCategory({ ...newInventoryCategory, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Category
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {inventoryCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteInventoryCategory(category.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
              {inventoryCategories.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No inventory categories added yet
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 