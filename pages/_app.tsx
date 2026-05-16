import '@/styles/globals.css';
import 'ckeditor5/ckeditor5.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
