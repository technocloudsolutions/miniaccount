import { db } from './firebase';
import { collection, getDocs, query, doc, setDoc, addDoc, deleteDoc, where } from 'firebase/firestore';

// Define collection names as constants
const COLLECTIONS = {
  USERS: 'users',
  BANK_ACCOUNTS: 'bankAccounts',
  TRANSACTIONS: 'transactions',
  EXPENSE_CATEGORIES: 'expenseCategories',
} as const;

// Function to check if a collection exists
const checkCollection = async (collectionName: string, userId?: string) => {
  if (typeof window === 'undefined') return true; // Skip on server side
  
  try {
    const collectionRef = collection(db, collectionName);
    
    // If we have a userId, check for user-specific documents
    if (userId) {
      const q = query(collectionRef, where('userId', '==', userId));
      await getDocs(q);
    } else {
      // Otherwise just check if collection exists
      await getDocs(query(collectionRef));
    }
    
    console.log(`Collection ${collectionName} exists`);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // This is expected for empty collections
      return true;
    }
    console.error(`Error checking collection ${collectionName}:`, error);
    return false;
  }
};

// Function to initialize a collection
const initializeCollection = async (collectionName: string, userId?: string) => {
  if (typeof window === 'undefined') return true; // Skip on server side
  
  try {
    console.log(`Initializing collection: ${collectionName}`);
    const collectionRef = collection(db, collectionName);
    
    // Create a temporary document with userId if provided
    const tempDoc = {
      _temp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(userId && { userId }),
    };

    // Add the document
    const docRef = await addDoc(collectionRef, tempDoc);
    console.log(`Created temp document in ${collectionName}`);

    // Delete it immediately
    await deleteDoc(docRef);
    console.log(`Deleted temp document from ${collectionName}`);

    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // This is expected for authenticated collections
      return true;
    }
    console.error(`Error initializing collection ${collectionName}:`, error);
    return false;
  }
};

// Function to initialize database structure
export const initializeDatabase = async (userId?: string) => {
  if (!userId) return false;
  
  console.log('Starting database initialization...');
  let success = true;

  for (const collectionName of Object.values(COLLECTIONS)) {
    try {
      // Check if collection exists
      const exists = await checkCollection(collectionName, userId);
      
      if (!exists) {
        // Initialize collection if it doesn't exist
        const initialized = await initializeCollection(collectionName, userId);
        if (!initialized) {
          success = false;
          console.error(`Failed to initialize collection: ${collectionName}`);
        }
      }
    } catch (error) {
      success = false;
      console.error(`Error processing collection ${collectionName}:`, error);
    }
  }

  if (success) {
    console.log('Database initialization completed successfully');
  } else {
    console.error('Database initialization completed with errors');
  }

  return success;
};

// Function to check database structure
export const checkDatabaseStructure = async (userId?: string) => {
  if (!userId) {
    return { collections: {}, isValid: false };
  }

  const status = {
    collections: {} as Record<string, boolean>,
    isValid: true,
  };

  for (const collectionName of Object.values(COLLECTIONS)) {
    try {
      const exists = await checkCollection(collectionName, userId);
      status.collections[collectionName] = exists;
      if (!exists) {
        status.isValid = false;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('permission-denied')) {
        // This is expected for authenticated collections
        status.collections[collectionName] = true;
      } else {
        console.warn(`Collection ${collectionName} not initialized:`, error);
        status.collections[collectionName] = false;
        status.isValid = false;
      }
    }
  }

  return status;
}; 