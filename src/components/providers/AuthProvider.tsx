'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { initializeDatabase, checkDatabaseStructure } from '@/lib/initializeDatabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle authentication and database initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.email);
      setUser(user);

      if (user) {
        try {
          // Check and initialize database for the user
          const dbStatus = await checkDatabaseStructure(user.uid);
          
          if (!dbStatus.isValid) {
            console.log('Database structure is invalid, attempting to initialize...');
            await initializeDatabase(user.uid);
          }

          // Handle routing for authenticated user
          if (pathname === '/' || pathname === '/register') {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error during app initialization:', error);
        }
      } else {
        // Handle routing for unauthenticated user
        if (pathname?.startsWith('/dashboard')) {
          router.push('/');
        }
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 