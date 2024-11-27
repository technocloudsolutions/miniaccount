'use client';

import { useState } from 'react';
import { initializeDatabase } from '@/lib/initializeDatabase';

export function InitializeDbButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await initializeDatabase();
      setStatus(result ? 'success' : 'error');
    } catch (error) {
      console.error('Error initializing database:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      <button
        onClick={handleInitialize}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white font-medium shadow-lg ${
          status === 'success'
            ? 'bg-green-500'
            : status === 'error'
            ? 'bg-red-500'
            : 'bg-blue-500'
        } hover:opacity-90 disabled:opacity-50`}
      >
        {loading ? 'Initializing...' : 'Initialize Database'}
      </button>
      {status !== 'idle' && (
        <p className={`mt-2 text-sm ${
          status === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {status === 'success' ? 'Database initialized successfully' : 'Failed to initialize database'}
        </p>
      )}
    </div>
  );
} 