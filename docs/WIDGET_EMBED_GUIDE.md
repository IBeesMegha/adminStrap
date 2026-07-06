# AI Chat Widget - Embed Guide

## Overview
The AI Chat Widget is a customizable chat interface that can be embedded into any website. This guide explains how the widget works and how to properly integrate it into your projects.

## How It Works

### Architecture
1. **Widget Configuration API** (`/api/widget/config`) - Returns widget settings from database
2. **Embed Script** (`/api/widget/embed.js`) - Lightweight JavaScript that loads the widget
3. **Chat API** (`/api/widget/chat`) - Handles chat messages and AI responses

### Key Features
- ✅ Fully customizable appearance (colors, logo, position, size)
- ✅ Embeddable on any website (same project or external)
- ✅ Prevents duplicate widget loading
- ✅ Dynamic origin detection (works on any domain)
- ✅ Toggle widget on/off via admin panel
- ✅ Cross-origin support with proper CORS headers

## Fixed Issues

### Problem
When the embed script was added to `_app.tsx`, the widget appeared on ALL pages including admin pages, causing:
- Duplicate widget instances
- Widget appearing on widget configuration page
- Conflicts with admin interface

### Solution
Added conditional loading in `_app.tsx`:
```typescript
// Only load widget on non-admin pages
const shouldLoadWidget = !router.pathname.startsWith('/admin');
```

The widget now:
- ❌ Does NOT load on admin pages (`/admin/*`)
- ✅ Loads on all public pages
- ✅ Can be embedded on external websites

## Usage

### Option 1: Internal Usage (Same Project)
The widget is automatically loaded on all non-admin pages. No additional code needed!

**To disable on specific pages:**
```typescript
// In your page component
useEffect(() => {
  const widgetRoot = document.getElementById('ai-w-root');
  if (widgetRoot) widgetRoot.style.display = 'none';
  
  return () => {
    if (widgetRoot) widgetRoot.style.display = '';
  };
}, []);
```

### Option 2: External Website Embed
Copy the embed code from the admin panel (`/admin/widget` → Embed Script tab):

```html
<!-- AI Chat Widget -->
<div id="ai-chat-widget"></div>
<script src="https://yourdomain.com/api/widget/embed.js" defer></script>
```

**Important:**
- Place this code just before the closing `</body>` tag
- Replace `yourdomain.com` with your actual domain
- The `defer` attribute ensures the script loads after the page content

### Option 3: Programmatic Loading
```javascript
// Create container
const container = document.createElement('div');
container.id = 'ai-chat-widget';
document.body.appendChild(container);

// Load script
const script = document.createElement('script');
script.src = 'https://yourdomain.com/api/widget/embed.js';
script.defer = true;
document.body.appendChild(script);
```

## Configuration

### Enable/Disable Widget
1. Go to `/admin/widget`
2. Toggle "Widget Active" in the General Settings
3. Click Save
4. Widget will show/hide based on this setting

### Customize Appearance
Navigate through the tabs in `/admin/widget`:
- **General** - Title, welcome message, logo, avatar
- **Appearance** - Colors, position, size, custom CSS
- **Chat Settings** - Message colors, bubble styles, fonts
- **Embed Script** - Copy embed code for external use

## Technical Details

### Duplicate Prevention
The embed script checks if the widget is already loaded:
```javascript
if(R.hasAttribute("data-widget-loaded"))return;
R.setAttribute("data-widget-loaded","true");
```

### Dynamic Origin Detection
The widget automatically detects the correct origin:
```typescript
const proto = req.headers['x-forwarded-proto'] || 'https';
const host = req.headers.host || '';
const origin = `${proto}://${host}`;
```

### CORS Configuration
The widget APIs include proper CORS headers:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

## Testing

### Test Internal Widget
1. Make sure `embedActive` is `true` in widget settings
2. Visit any public page (not `/admin/*`)
3. You should see the chat bubble in the bottom corner

### Test External Embed
1. Create a simple HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Widget Test</title>
</head>
<body>
    <h1>Test Page</h1>
    
    <!-- Widget -->
    <div id="ai-chat-widget"></div>
    <script src="http://localhost:3000/api/widget/embed.js" defer></script>
</body>
</html>
```
2. Open the file in a browser
3. The widget should appear

## Troubleshooting

### Widget Not Appearing
- ✅ Check if `embedActive` is enabled in `/admin/widget`
- ✅ Verify the script URL is correct
- ✅ Check browser console for errors
- ✅ Ensure CORS is not blocking requests

### Widget Appearing Twice
- ✅ Ensure you're not including the embed script manually on admin pages
- ✅ Check for duplicate `<script>` tags in your HTML

### Widget Not Loading on External Site
- ✅ Verify the API endpoints are accessible from the external domain
- ✅ Check CORS configuration
- ✅ Ensure your domain is deployed (not just localhost)

### Style Conflicts
- ✅ Use the Custom CSS field in widget settings
- ✅ Increase z-index if widget is hidden behind elements
- ✅ Use `!important` flags in custom CSS if needed

## Best Practices

1. **Use Dynamic Origin**: Never hardcode `localhost:3000` in production embed codes
2. **Toggle Off When Needed**: Disable widget in settings rather than removing code
3. **Test Both Scenarios**: Test widget in same project AND on external site
4. **Custom CSS**: Use the Custom CSS field for advanced styling
5. **Performance**: The embed script is minified and loads asynchronously

## API Reference

### GET /api/widget/config
Returns widget configuration if `embedActive` is true.

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "AI Chat Assistant",
    "welcomeText": "Hi! How can I help you?",
    "primaryColor": "#2563eb",
    "embedActive": true,
    // ... other settings
  }
}
```

### POST /api/widget/chat
Sends a message to the AI.

**Request:**
```json
{
  "message": "Hello, how are you?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "I'm doing well, thank you! How can I assist you?"
  }
}
```

### GET /api/widget/embed.js
Returns the widget JavaScript code with dynamic configuration.

**Headers:**
- `Content-Type: application/javascript`
- `Access-Control-Allow-Origin: *`
- `Cache-Control: no-cache`

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Verify database configuration
4. Check API endpoints are responding
