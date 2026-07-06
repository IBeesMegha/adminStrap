import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface WidgetStatus {
  success: boolean;
  configured: boolean;
  embedActive?: boolean;
  title?: string;
  welcomeText?: string;
  position?: string;
  primaryColor?: string;
  message: string;
}

export default function WidgetDebug() {
  const router = useRouter();
  const [status, setStatus] = useState<WidgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [widgetElements, setWidgetElements] = useState({
    container: false,
    root: false,
    fab: false,
  });

  useEffect(() => {
    fetchStatus();
    checkWidgetElements();
    
    // Check elements every 2 seconds
    const interval = setInterval(checkWidgetElements, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/widget/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching widget status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWidgetElements = () => {
    setWidgetElements({
      container: !!document.getElementById('ai-chat-widget'),
      root: !!document.getElementById('ai-w-root'),
      fab: !!document.getElementById('ai-fab'),
    });
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            🔍 Widget Debug Console
          </h1>
          <p className="text-gray-400 mb-6">
            Current Path: <code className="bg-gray-700 px-2 py-1 rounded">{router.pathname}</code>
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Database Status */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📊 Database Configuration
                </h2>
                {status ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${status.configured ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span>Configured: {status.configured ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    {status.configured && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${status.embedActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Widget Active: {status.embedActive ? '✅ Yes' : '❌ No'}</span>
                        </div>
                        <div className="mt-4 p-4 bg-gray-600 rounded">
                          <p className="text-sm text-gray-300 mb-2">Settings:</p>
                          <ul className="text-sm space-y-1">
                            <li>Title: <code className="text-blue-400">{status.title}</code></li>
                            <li>Welcome: <code className="text-blue-400">{status.welcomeText}</code></li>
                            <li>Position: <code className="text-blue-400">{status.position}</code></li>
                            <li>Color: <code className="text-blue-400">{status.primaryColor}</code></li>
                          </ul>
                        </div>
                      </>
                    )}
                    <p className={`mt-4 p-3 rounded ${status.embedActive ? 'bg-green-900' : 'bg-red-900'}`}>
                      {status.message}
                    </p>
                  </div>
                ) : (
                  <p className="text-red-400">❌ Failed to fetch status</p>
                )}
              </div>

              {/* DOM Elements Status */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🌐 DOM Elements
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${widgetElements.container ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <code className="text-sm">#ai-chat-widget</code>
                    <span className="text-gray-400 text-sm">
                      {widgetElements.container ? '✅ Found' : '❌ Not Found'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${widgetElements.root ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <code className="text-sm">#ai-w-root</code>
                    <span className="text-gray-400 text-sm">
                      {widgetElements.root ? '✅ Found' : '❌ Not Found'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${widgetElements.fab ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <code className="text-sm">#ai-fab</code>
                    <span className="text-gray-400 text-sm">
                      {widgetElements.fab ? '✅ Found (Widget Loaded!)' : '❌ Not Found'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Browser Console Logs */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  🖥️ Console Check
                </h2>
                <p className="text-sm text-gray-300 mb-2">
                  Open browser DevTools (F12) and check the Console tab for:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-400">
                  <li><code>Current path: /widget-debug</code></li>
                  <li><code>Should load widget: true</code></li>
                  <li>Any errors related to widget loading</li>
                </ul>
              </div>

              {/* Network Check */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  📡 Network Requests
                </h2>
                <p className="text-sm text-gray-300 mb-2">
                  Check Network tab in DevTools for these requests:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-gray-400">
                  <li><code>/api/widget/embed.js</code> - Should return JavaScript code</li>
                  <li><code>/api/widget/config</code> - Should return widget configuration</li>
                </ul>
                <div className="mt-4 flex gap-2">
                  <a 
                    href="/api/widget/embed.js" 
                    target="_blank"
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                  >
                    Test embed.js
                  </a>
                  <a 
                    href="/api/widget/config" 
                    target="_blank"
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                  >
                    Test config
                  </a>
                </div>
              </div>

              {/* Troubleshooting Steps */}
              <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">⚠️ Troubleshooting Steps</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Verify widget is enabled in <a href="/admin/widget" className="text-blue-400 underline">/admin/widget</a></li>
                  <li>Check if <code className="bg-gray-700 px-1 rounded">embedActive</code> is true above</li>
                  <li>Open browser DevTools (F12) → Console tab</li>
                  <li>Look for "Should load widget: true"</li>
                  <li>Check Network tab for failed requests</li>
                  <li>Try refreshing the page</li>
                  <li>Clear browser cache if needed</li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <button 
                  onClick={refreshPage}
                  className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  🔄 Refresh Page
                </button>
                <a 
                  href="/admin/widget"
                  className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700 transition inline-block"
                >
                  ⚙️ Widget Settings
                </a>
                <a 
                  href="/test-widget"
                  className="px-6 py-3 bg-green-600 rounded-lg hover:bg-green-700 transition inline-block"
                >
                  ✨ Test Widget Page
                </a>
                <a 
                  href="/admin"
                  className="px-6 py-3 bg-gray-600 rounded-lg hover:bg-gray-700 transition inline-block"
                >
                  🏠 Admin Dashboard
                </a>
              </div>

              {/* Expected Behavior */}
              <div className="mt-6 bg-green-900 border border-green-600 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">✅ Expected Behavior</h2>
                <p className="text-sm mb-2">When everything is working correctly:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>All database status indicators should be green</li>
                  <li>All DOM elements should be found</li>
                  <li>You should see a circular chat button in the bottom {status?.position || 'right'} corner</li>
                  <li>Clicking the button opens the chat interface</li>
                  <li>Widget does NOT appear on /admin/* pages</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
