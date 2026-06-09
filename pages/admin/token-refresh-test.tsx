/**
 * Token Refresh Test Page
 * For testing and demonstrating automatic token refresh
 */

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/admin/Layout';
import { ProtectedRoute } from '@/components/admin/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { apiGet } from '@/lib/api-client';
import { CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';

export default function TokenRefreshTest() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Array<{ time: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const testTokenRefresh = async () => {
    addLog('Testing manual token refresh...', 'info');
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        addLog('✓ Token refresh successful', 'success');
      } else {
        addLog('✗ Token refresh failed', 'error');
      }
    } catch (error: any) {
      addLog(`✗ Error: ${error.message}`, 'error');
    }
  };

  const testApiCall = async () => {
    addLog('Testing API call with automatic refresh...', 'info');
    try {
      const data = await apiGet('/api/auth/me');
      addLog('✓ API call successful', 'success');
    } catch (error: any) {
      addLog(`✗ API call failed: ${error.message}`, 'error');
    }
  };

  const startContinuousTest = () => {
    setIsTestRunning(true);
    addLog('Starting continuous API test (every 30s)...', 'info');
  };

  const stopContinuousTest = () => {
    setIsTestRunning(false);
    addLog('Stopped continuous API test', 'info');
  };

  useEffect(() => {
    if (!isTestRunning) return;

    const interval = setInterval(async () => {
      addLog('Auto test: Making API call...', 'info');
      try {
        await apiGet('/api/auth/me');
        addLog('Auto test: ✓ Success', 'success');
      } catch (error: any) {
        addLog(`Auto test: ✗ Failed - ${error.message}`, 'error');
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isTestRunning]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Token Refresh Test</h1>
            <p className="text-gray-600 mb-6">
              Test automatic token refresh functionality. Access token expires after 15 minutes.
            </p>

            {/* User Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-blue-900 mb-2">Current User</h2>
              <p className="text-blue-800">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-blue-800">
                <strong>Name:</strong> {user?.name}
              </p>
              <p className="text-sm text-blue-600 mt-2">
                <Clock className="inline w-4 h-4 mr-1" />
                Access token expires in 15 minutes, automatically refreshed every 10 minutes
              </p>
            </div>

            {/* Test Controls */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={testTokenRefresh}
                  className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Manual Token Refresh
                </button>

                <button
                  onClick={testApiCall}
                  className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Test API Call
                </button>

                {!isTestRunning ? (
                  <button
                    onClick={startContinuousTest}
                    className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Start Continuous Test
                  </button>
                ) : (
                  <button
                    onClick={stopContinuousTest}
                    className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Stop Continuous Test
                  </button>
                )}

                <button
                  onClick={clearLogs}
                  className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">How Automatic Refresh Works</h3>
              <ul className="text-yellow-800 space-y-1 text-sm">
                <li>• <strong>Periodic Refresh:</strong> Token refreshes every 10 minutes automatically</li>
                <li>• <strong>On Tab Return:</strong> Token refreshes when you return after 5+ minutes away</li>
                <li>• <strong>On API Failure:</strong> If a request fails with 401, token is refreshed and retried</li>
                <li>• <strong>Session Duration:</strong> Refresh token valid for 7 days</li>
              </ul>
            </div>

            {/* Logs */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Activity Log</h2>
              </div>
              <div className="p-4">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No activity yet. Click a test button to start.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className={`flex items-start p-3 rounded-lg ${
                          log.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : log.type === 'error'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span className="text-sm text-gray-500 mr-3 font-mono whitespace-nowrap">
                          {log.time}
                        </span>
                        <span
                          className={`text-sm flex-1 ${
                            log.type === 'success'
                              ? 'text-green-800'
                              : log.type === 'error'
                              ? 'text-red-800'
                              : 'text-gray-700'
                          }`}
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Testing Instructions</h3>
              <ol className="text-gray-700 space-y-1 text-sm list-decimal list-inside">
                <li>Use "Manual Token Refresh" to manually refresh your access token</li>
                <li>Use "Test API Call" to make an authenticated API request</li>
                <li>Use "Start Continuous Test" to automatically test every 30 seconds</li>
                <li>Open browser DevTools → Application → Cookies to see token cookies</li>
                <li>Check browser console for automatic refresh logs: [Token Refresh], [Visibility Refresh]</li>
                <li>Leave tab inactive for 5+ minutes and return to trigger visibility refresh</li>
              </ol>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
