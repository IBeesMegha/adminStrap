import '@/styles/globals.css';
import 'ckeditor5/ckeditor5.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Don't load widget on admin pages or widget configuration page
  const shouldLoadWidget = !router.pathname.startsWith('/admin');

  // Debug logging (remove in production)
  if (typeof window !== 'undefined') {
    console.log('Current path:', router.pathname);
    console.log('Should load widget:', shouldLoadWidget);
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        <Component {...pageProps} />
        {shouldLoadWidget && (
          <>
            <div id="ai-chat-widget"></div>
            <Script 
              src={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/widget/embed.js`} 
              strategy="afterInteractive" 
            />
          </>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}
