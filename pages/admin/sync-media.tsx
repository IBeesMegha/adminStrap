import React, { useState } from 'react';
import { Layout } from '@/components/admin/Layout';

export default function SyncMediaPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dbInfo, setDbInfo] = useState<any>(null);

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/debug/media-count');
      const data = await response.json();
      setDbInfo(data);
    } catch (error) {
      console.error('Error checking database:', error);
      alert('Failed to check database');
    }
  };

  const syncMedia = async () => {
    if (!confirm('This will scan public/uploads and add all files to the database. Continue?')) {
      return;
    }

    try {
      setSyncing(true);
      setResult(null);
      
      const response = await fetch('/api/debug/sync-media', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
      
      // Refresh database info
      await checkDatabase();
    } catch (error) {
      console.error('Error syncing media:', error);
      alert('Failed to sync media');
    } finally {
      setSyncing(false);
    }
  };

  React.useEffect(() => {
    checkDatabase();
  }, []);

  return (
    <Layout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sync Media Files
        </h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Database Info */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Database Status</h2>
            {dbInfo ? (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-lg mb-2">
                  <strong>Media records in database:</strong> {dbInfo.count}
                </p>
                {dbInfo.media && dbInfo.media.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Recent media:</p>
                    <ul className="space-y-1 text-sm">
                      {dbInfo.media.slice(0, 10).map((m: any) => (
                        <li key={m.id} className="text-gray-600">
                          {m.folder ? `${m.folder}/` : ''}{m.name} - {m.url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading...</p>
            )}
            <button
              onClick={checkDatabase}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>

          {/* Sync Button */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Sync Files</h2>
            <p className="text-gray-600 mb-4">
              This will scan the <code className="bg-gray-100 px-2 py-1 rounded">public/uploads</code> directory
              and add all files to the database that aren&apos;t already there.
            </p>
            <button
              onClick={syncMedia}
              disabled={syncing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : 'Sync Media Files'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Sync Results</h2>
              <div className={`p-4 rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className="text-lg mb-2">
                  <strong>Status:</strong> {result.success ? 'Success' : 'Failed'}
                </p>
                <p><strong>Added:</strong> {result.added}</p>
                <p><strong>Skipped:</strong> {result.skipped}</p>
                <p><strong>Total files found:</strong> {result.total}</p>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-red-600">Errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {result.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
