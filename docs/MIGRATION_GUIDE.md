# Migration Guide: Using the New API Client

This guide helps you update your existing code to use the new API client with automatic token refresh.

## Why Migrate?

The new `fetchWithAuth` API client provides:
- ✅ Automatic token refresh on 401 errors
- ✅ Automatic request retry after token refresh
- ✅ Built-in error handling
- ✅ Convenience methods for common HTTP verbs

## Quick Start

### Before (old way)
```typescript
const response = await fetch('/api/collections/posts', {
  credentials: 'include',
});
const data = await response.json();
```

### After (new way)
```typescript
import { fetchWithAuth, apiGet } from '@/lib/api-client';

// Option 1: Using fetchWithAuth
const response = await fetchWithAuth('/api/collections/posts');
const data = await response.json();

// Option 2: Using convenience method (recommended)
const data = await apiGet('/api/collections/posts');
```

## Detailed Migration Examples

### GET Requests

**Before:**
```typescript
const response = await fetch('/api/auth/me', {
  credentials: 'include',
});

if (!response.ok) {
  throw new Error('Failed to fetch user');
}

const data = await response.json();
```

**After:**
```typescript
import { apiGet } from '@/lib/api-client';

const data = await apiGet('/api/auth/me');
// Automatically handles errors and token refresh
```

### POST Requests

**Before:**
```typescript
const response = await fetch('/api/collections/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({ title: 'New Post' }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}

const data = await response.json();
```

**After:**
```typescript
import { apiPost } from '@/lib/api-client';

const data = await apiPost('/api/collections/posts', {
  title: 'New Post'
});
// Automatically handles JSON serialization, errors, and token refresh
```

### PUT Requests

**Before:**
```typescript
const response = await fetch(`/api/collections/posts/${id}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(updateData),
});

if (!response.ok) {
  throw new Error('Update failed');
}

const data = await response.json();
```

**After:**
```typescript
import { apiPut } from '@/lib/api-client';

const data = await apiPut(`/api/collections/posts/${id}`, updateData);
```

### DELETE Requests

**Before:**
```typescript
const response = await fetch(`/api/collections/posts/${id}`, {
  method: 'DELETE',
  credentials: 'include',
});

if (!response.ok) {
  throw new Error('Delete failed');
}
```

**After:**
```typescript
import { apiDelete } from '@/lib/api-client';

await apiDelete(`/api/collections/posts/${id}`);
```

## Using Existing API Client

If you're already using the `ApiClient` class from `lib/api.ts`, **no changes needed**! It has been automatically updated to use the new token refresh mechanism.

```typescript
import { api } from '@/lib/api';

// All these methods now have automatic token refresh
const collections = await api.getCollectionTypes();
await api.createCollectionEntry('posts', postData);
await api.updateMedia(mediaId, { title: 'New Title' });
```

## Special Cases

### Custom Headers

**Before:**
```typescript
const response = await fetch('/api/data', {
  headers: {
    'X-Custom-Header': 'value',
  },
  credentials: 'include',
});
```

**After:**
```typescript
import { fetchWithAuth } from '@/lib/api-client';

const response = await fetchWithAuth('/api/data', {
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Skip Token Refresh

If you need to skip the automatic token refresh (e.g., for the refresh endpoint itself):

```typescript
import { fetchWithAuth } from '@/lib/api-client';

const response = await fetchWithAuth('/api/auth/refresh', {
  method: 'POST',
  skipRefresh: true, // Prevents infinite loop
});
```

### Error Handling

The new API client throws errors with meaningful messages:

```typescript
import { apiGet } from '@/lib/api-client';

try {
  const data = await apiGet('/api/data');
  // Success
} catch (error) {
  console.error('API Error:', error.message);
  // Error message from server or network error
}
```

## Component Examples

### Before: Component with manual fetch

```typescript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/collections/posts', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* Render data */}</div>;
}
```

### After: Component with new API client

```typescript
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';

function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await apiGet('/api/collections/posts');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return <div>{/* Render data */}</div>;
}
```

## Benefits Summary

| Feature | Old Fetch | New API Client |
|---------|-----------|----------------|
| Automatic token refresh | ❌ | ✅ |
| Request retry on 401 | ❌ | ✅ |
| JSON handling | Manual | Automatic |
| Error handling | Manual | Built-in |
| Credentials | Manual | Automatic |
| Type safety | Limited | Better |

## Checklist for Migration

- [ ] Identify all `fetch()` calls in your codebase
- [ ] Replace with `fetchWithAuth()` or convenience methods
- [ ] Remove manual credential includes (`credentials: 'include'`)
- [ ] Remove manual JSON parsing where using convenience methods
- [ ] Test authentication flows
- [ ] Test error handling
- [ ] Verify token refresh works correctly

## Do You Need to Migrate?

**Required:** No - existing code works fine

**Recommended:** Yes, for new code and critical paths

**Priority Migration Targets:**
1. Authentication-related API calls
2. High-frequency API calls (user data, permissions)
3. Critical user flows (checkout, form submission)
4. Components that handle sensitive data

## Need Help?

- Read full documentation: `docs/AUTO_TOKEN_REFRESH.md`
- Test the implementation: Navigate to `/admin/token-refresh-test`
- Check browser console for automatic refresh logs

## Summary

The new API client provides automatic token refresh and retry, making your app more resilient and user-friendly. While migration is optional, it's recommended for better error handling and user experience.
