/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Expense {
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
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  category: string;
  branch?: string;
  swiftCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
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

export type SupplierCategory = {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type Purchase = {
  id: string;
  userId: string;
  purchaseDate: string;
  supplierCategory: string;
  supplierName: string;
  amount: number;
  description: string;
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: 'cash' | 'credit' | 'bank' | 'cheque';
  createdAt: any;
  updatedAt: any;
}

// Add type for the fetch functions
export type FetchBankAccounts = () => Promise<BankAccount[] | null>
export type FetchExpenseCategories = () => Promise<ExpenseCategory[] | null>

// Add this new type
export type Supplier = {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

// Add these new types
export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  initialQuantity: number;
  initialUnitPrice: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type InventoryCategory = {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type InventoryTransaction = {
  id: string;
  itemId: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  reference?: string; // Purchase ID or Sale ID
  notes?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

// Add these types
export type Invoice = {
  id: string;
  invoiceNumber: string;
  saleId: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

// Update Sale type to include invoice reference
export type Sale = {
  id: string;
  date: string;
  customerName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'cheque';
  bankAccountId?: string;
  status: 'completed' | 'pending' | 'cancelled';
  notes?: string;
  invoiceId?: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit' | 'cheque';