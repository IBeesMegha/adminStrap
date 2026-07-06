/**
 * AI Chat Widget Component (Next.js App Router with 'use client')
 * 
 * This component is for Next.js 13+ App Router projects.
 * It uses the 'use client' directive to work with client-side only features.
 * 
 * Usage:
 * import AIWidget from '@/components/AIWidget.client';
 * 
 * <AIWidget apiUrl="http://localhost:3000" />
 */

'use client';

import { useEffect, useState } from 'react';

interface AIWidgetProps {
  /**
   * The base URL of your widget API server
   * @example 'http://localhost:3000'
   * @example 'https://api.yourdomain.com'
   */
  apiUrl?: string;
  
  /**
   * Enable debug logging in console
   */
  debug?: boolean;

  /**
   * Callback when widget loads successfully
   */
  onLoad?: () => void;

  /**
   * Callback when widget fails to load
   */
  onError?: (error: Error) => void;
}

export default function AIWidget({ 
  apiUrl = 'http://localhost:3000',
  debug = false,
  onLoad,
  onError,
}: AIWidgetProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const log = (...args: any[]) => {
      if (debug) console.log('[AIWidget]', ...args);
    };

    log('Initializing widget with API URL:', apiUrl);

    // Create container if it doesn't exist
    let container = document.getElementById('ai-chat-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ai-chat-widget';
      document.body.appendChild(container);
      log('Created container element');
    } else {
      log('Container element already exists');
    }

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${apiUrl}/api/widget/embed.js"]`);
    if (existingScript) {
      log('Script already loaded');
      setLoaded(true);
      onLoad?.();
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `${apiUrl}/api/widget/embed.js`;
    script.defer = true;
    
    script.onload = () => {
      log('Script loaded successfully');
      setLoaded(true);
      onLoad?.();
    };

    script.onerror = (e) => {
      const errorMsg = 'Failed to load AI Widget script';
      log('Error:', errorMsg);
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    };

    document.body.appendChild(script);
    log('Script element added to body');

    // Cleanup function
    return () => {
      log('Cleaning up widget');
      
      // Remove widget UI elements
      const root = document.getElementById('ai-w-root');
      if (root) {
        root.remove();
        log('Removed widget root');
      }
      
      // Clear container
      if (container) {
        container.innerHTML = '';
        log('Cleared container');
      }
      
      // Remove script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
        log('Removed script element');
      }
    };
  }, [apiUrl, debug, onLoad, onError]);

  // This component doesn't render anything visible
  // The widget is injected via JavaScript
  return null;
}

/**
 * Example Usage in Next.js App Router:
 * 
 * // app/layout.tsx:
 * import AIWidget from '@/components/AIWidget.client';
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <AIWidget 
 *           apiUrl={process.env.NEXT_PUBLIC_WIDGET_API_URL || 'http://localhost:3000'}
 *           debug={process.env.NODE_ENV === 'development'}
 *         />
 *       </body>
 *     </html>
 *   );
 * }
 */
