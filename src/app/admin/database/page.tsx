'use client';

import { useState } from 'react';
import { initializeDatabase, checkDatabaseStructure } from '@/lib/initializeDatabase';

export default function DatabaseManagement() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const result = await initializeDatabase();
      setStatus({ success: result, timestamp: new Date().toISOString() });
    } catch (error) {
      setStatus({ error, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    setLoading(true);
    try {
      const result = await checkDatabaseStructure();
      setStatus(result);
    } catch (error) {
      setStatus({ error, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleInitialize}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Initialize Database
        </button>

        <button
          onClick={handleCheck}
          disabled={loading}
          className="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Check Database Structure
        </button>

        {loading && <div>Loading...</div>}

        {status && (
          <pre className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
} 