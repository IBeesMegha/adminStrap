# 🌐 External Website Embedding Guide

## For Embedding the Widget in Other Projects

This guide explains how to properly embed the AI Chat Widget in external websites and React/Next.js projects.

---

## 📋 Prerequisites

1. Your widget API server must be running (e.g., `http://localhost:3000` or your production domain)
2. Widget must be enabled in the admin panel (`/admin/widget`)
3. CORS is already configured to allow external embedding

---

## 🚀 Method 1: Plain HTML/JavaScript Website

For regular HTML websites, use this code in your HTML file:

### Example: index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>Your content here...</p>

    <!-- AI Chat Widget - Add before closing </body> tag -->
    <div id="ai-chat-widget"></div>
    <script src="http://localhost:3000/api/widget/embed.js" defer></script>
</body>
</html>
```

**For Production:**
Replace `http://localhost:3000` with your actual domain:
```html
<script src="https://yourdomain.com/api/widget/embed.js" defer></script>
```

---

## ⚛️ Method 2: React / Next.js Project (Recommended)

### Option A: Using Next.js `<Script>` Component

Create a widget component:

```typescript
// components/AIWidget.tsx
import Script from 'next/script';
import { useEffect } from 'react';

interface AIWidgetProps {
  apiUrl?: string; // e.g., 'http://localhost:3000' or 'https://yourdomain.com'
}

export default function AIWidget({ apiUrl = 'http://localhost:3000' }: AIWidgetProps) {
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      const container = document.getElementById('ai-chat-widget');
      const root = document.getElementById('ai-w-root');
      if (root) root.remove();
      if (container) container.innerHTML = '';
    };
  }, []);

  return (
    <>
      <div id="ai-chat-widget"></div>
      <Script 
        src={`${apiUrl}/api/widget/embed.js`}
        strategy="afterInteractive"
        onLoad={() => console.log('AI Widget loaded')}
        onError={() => console.error('Failed to load AI Widget')}
      />
    </>
  );
}
```

### Option B: Using `useEffect` Hook

```typescript
// components/AIWidget.tsx
import { useEffect } from 'react';

interface AIWidgetProps {
  apiUrl?: string;
}

export default function AIWidget({ apiUrl = 'http://localhost:3000' }: AIWidgetProps) {
  useEffect(() => {
    // Create container if it doesn't exist
    let container = document.getElementById('ai-chat-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ai-chat-widget';
      document.body.appendChild(container);
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `${apiUrl}/api/widget/embed.js`;
    script.defer = true;
    script.onload = () => console.log('AI Widget loaded successfully');
    script.onerror = () => console.error('Failed to load AI Widget');
    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      const root = document.getElementById('ai-w-root');
      if (root) root.remove();
      if (container) container.innerHTML = '';
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [apiUrl]);

  return null;
}
```

### Usage in Your App

#### In `_app.tsx` (Next.js):
```typescript
import AIWidget from '@/components/AIWidget';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <AIWidget apiUrl="http://localhost:3000" />
    </>
  );
}
```

#### In `layout.tsx` (Next.js App Router):
```typescript
import AIWidget from '@/components/AIWidget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AIWidget apiUrl="http://localhost:3000" />
      </body>
    </html>
  );
}
```

#### In specific page:
```typescript
import AIWidget from '@/components/AIWidget';

export default function HomePage() {
  return (
    <div>
      <h1>Welcome</h1>
      <AIWidget apiUrl="http://localhost:3000" />
    </div>
  );
}
```

---

## 🔧 Method 3: Direct Script in Next.js `_document.tsx`

**⚠️ Not Recommended for React** - but if you must:

```typescript
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        <div id="ai-chat-widget"></div>
        <script 
          src="http://localhost:3000/api/widget/embed.js" 
          defer
        />
      </body>
    </Html>
  );
}
```

---

## 🎯 Your Specific Case (localhost:3001 Project)

Based on your screenshot showing `localhost:3001/en`, here's what you need:

### Fix Your `layout.js` File:

**❌ WRONG - Don't do this:**
```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div id="ai-chat-widget"></div>
        <script src="http://localhost:3000/api/widget/embed.js" defer></script>
      </body>
    </html>
  );
}
```

**✅ CORRECT - Do this instead:**

```javascript
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div id="ai-chat-widget"></div>
        <Script 
          src="http://localhost:3000/api/widget/embed.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
```

Or even better, create a component:

```javascript
// app/AIWidget.jsx
'use client';

import { useEffect } from 'react';

export default function AIWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'http://localhost:3000/api/widget/embed.js';
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const root = document.getElementById('ai-w-root');
      if (root) root.remove();
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return <div id="ai-chat-widget"></div>;
}
```

Then use it in your layout:

```javascript
// app/layout.js
import AIWidget from './AIWidget';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AIWidget />
      </body>
    </html>
  );
}
```

---

## 🐛 Debugging External Embed

### 1. Check Browser Console
Open DevTools (F12) and look for:
- ✅ Script loaded successfully
- ✅ No CORS errors
- ✅ Widget configuration fetched
- ❌ Any JavaScript errors

### 2. Check Network Tab
Verify these requests:
1. `http://localhost:3000/api/widget/embed.js` → Should return JavaScript (200 OK)
2. `http://localhost:3000/api/widget/config` → Should return JSON (200 OK)

### 3. Check DOM Elements
In Elements tab, search for:
- `#ai-chat-widget` - Container
- `#ai-w-root` - Widget root
- `#ai-fab` - Chat button

### 4. Test Direct Access
Open in browser:
- `http://localhost:3000/api/widget/embed.js` - Should show JavaScript code
- `http://localhost:3000/api/widget/config` - Should show JSON config

---

## 🔒 Common Issues & Solutions

### Issue 1: Script Not Loading
**Symptoms:** No errors, but widget doesn't appear

**Solution:**
1. Check if widget server is running (`http://localhost:3000`)
2. Verify widget is enabled in admin panel
3. Use browser DevTools to check network requests

### Issue 2: CORS Errors
**Symptoms:** Console shows CORS policy errors

**Solution:**
CORS is already configured to allow all origins (`*`). If you still see errors:
1. Check if widget server is running
2. Verify the API endpoints are accessible
3. Check browser console for specific error

### Issue 3: Widget Not Appearing
**Symptoms:** Script loads but no widget visible

**Solution:**
1. Check `http://localhost:3000/api/widget/config`
2. Verify `embedActive: true` in response
3. Check console for JavaScript errors
4. Look for `#ai-fab` element in DOM

### Issue 4: React Hydration Errors
**Symptoms:** "Hydration failed" error in console

**Solution:**
Use the `useEffect` method or create a client component with `'use client'` directive.

---

## 📊 Production Checklist

Before deploying to production:

- [ ] Update API URL from `localhost:3000` to production domain
- [ ] Verify CORS is properly configured
- [ ] Test widget on staging environment
- [ ] Check widget loads on all pages
- [ ] Test on mobile devices
- [ ] Verify SSL certificate (HTTPS)
- [ ] Test cross-domain embedding
- [ ] Monitor API rate limits
- [ ] Set up error tracking

---

## 🌍 Production Example

```typescript
// components/AIWidget.tsx
import Script from 'next/script';

const WIDGET_API_URL = process.env.NEXT_PUBLIC_WIDGET_API_URL || 'https://api.yourdomain.com';

export default function AIWidget() {
  return (
    <>
      <div id="ai-chat-widget"></div>
      <Script 
        src={`${WIDGET_API_URL}/api/widget/embed.js`}
        strategy="afterInteractive"
      />
    </>
  );
}
```

**.env.local:**
```
NEXT_PUBLIC_WIDGET_API_URL=http://localhost:3000
```

**.env.production:**
```
NEXT_PUBLIC_WIDGET_API_URL=https://api.yourdomain.com
```

---

## 🎨 Customization

The widget automatically inherits settings from your admin panel:
- Colors, fonts, position
- Logo and avatar
- Welcome message
- Custom CSS

No additional configuration needed on the embed side!

---

## 📞 Support

If the widget still doesn't work:

1. Check widget is enabled at `http://localhost:3000/admin/widget`
2. Visit `http://localhost:3000/widget-debug` for diagnostics
3. Open browser console for errors
4. Check network tab for failed requests
5. Verify the API server is accessible from external domain

---

**Remember:** The widget script must be loaded from the running API server, not from the embedded website!
