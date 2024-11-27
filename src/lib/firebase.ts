import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJ2YdNgPiD6nv2fOzx9wkGLjeNqq2UNMs",
  authDomain: "mini-account-acf01.firebaseapp.com",
  projectId: "mini-account-acf01",
  storageBucket: "mini-account-acf01.appspot.com",
  messagingSenderId: "579310065716",
  appId: "1:579310065716:web:202fd6bc0ee96ab505d261"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 