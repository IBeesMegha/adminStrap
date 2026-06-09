# Automatic Token Refresh

This document explains how the automatic token refresh mechanism works to keep users logged in without interruption.

## Overview

The authentication system now includes automatic token refresh to prevent users from being logged out when their access token expires. This provides a seamless user experience where the authentication happens in the background.

## How It Works

### Token Lifecycle

1. **Access Token**: Short-lived (15 minutes) - used for API authentication
2. **Refresh Token**: Long-lived (7 days) - used to obtain new access tokens

### Automatic Refresh Strategies

The system implements multiple strategies to ensure tokens are always fresh:

#### 1. Periodic Refresh (Every 10 Minutes)

The `useTokenRefresh` hook automatically refreshes the access token every 10 minutes (before the 15-minute expiry). This happens in the background while the user is actively using the application.

**Implementation**: `hooks/useTokenRefresh.ts`

#### 2. Visibility-Based Refresh

When a user returns to the tab after being away for 5+ minutes, the system automatically refreshes the token. This ensures that if the user left the tab open and comes back, their session remains active.

**Implementation**: `hooks/useVisibilityRefresh.ts`

#### 3. API Request Retry

If an API request fails with a 401 (Unauthorized) error, the system automatically:
1. Attempts to refresh the token
2. Retries the original request with the new token
3. Returns the result seamlessly

This provides a fallback mechanism if the periodic refresh fails or the token expires unexpectedly.

**Implementation**: `lib/api-client.ts` - `fetchWithAuth` function

## Architecture

### Client-Side Components

#### AuthContext (`context/AuthContext.tsx`)
- Manages user authentication state
- Integrates token refresh hooks
- Handles logout on refresh failure

#### API Client (`lib/api-client.ts`)
- Provides `fetchWithAuth` wrapper around native fetch
- Automatically refreshes tokens on 401 errors
- Retries failed requests after token refresh
- Includes convenience methods: `apiGet`, `apiPost`, `apiPut`, `apiDelete`

#### Token Refresh Hook (`hooks/useTokenRefresh.ts`)
- Schedules periodic token refreshes
- Prevents concurrent refresh attempts
- Handles refresh errors gracefully

#### Visibility Refresh Hook (`hooks/useVisibilityRefresh.ts`)
- Monitors tab visibility changes
- Refreshes tokens when user returns after inactivity
- Configurable minimum away time threshold

### Server-Side Components

#### Refresh Token Endpoint (`pages/api/auth/refresh.ts`)
- Validates refresh token from cookies
- Generates new access and refresh tokens (token rotation)
- Updates session in database
- Sets new tokens in HTTP-only cookies

#### Auth Middleware (`lib/middlewares/api/auth-middleware.ts`)
- Verifies access tokens on protected routes
- Returns specific error codes for better client handling
- Checks user status and permissions

## Configuration

### Token Expiry Times

Configured in `lib/auth/jwt.ts`:
```typescript
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
```

### Refresh Intervals

Configured in `context/AuthContext.tsx`:
```typescript
useTokenRefresh({
  enabled: !!user,
  refreshIntervalMs: 10 * 60 * 1000, // 10 minutes
});

useVisibilityRefresh({
  enabled: !!user,
  minAwayTimeMs: 5 * 60 * 1000, // 5 minutes
});
```

## Usage

### Using the API Client

Instead of using `fetch` directly, use the API client for automatic token refresh:

```typescript
import { fetchWithAuth, apiGet, apiPost } from '@/lib/api-client';

// Using fetchWithAuth
const response = await fetchWithAuth('/api/collections/posts');
const data = await response.json();

// Using convenience methods
const data = await apiGet('/api/collections/posts');
const result = await apiPost('/api/collections/posts', { title: 'New Post' });
```

### Existing API Client

The existing `ApiClient` class in `lib/api.ts` has been updated to use `fetchWithAuth` internally, so all existing code continues to work with automatic token refresh:

```typescript
import { api } from '@/lib/api';

// All these methods now have automatic token refresh
const collections = await api.getCollectionTypes();
await api.createCollectionEntry('posts', postData);
```

## Benefits

1. **Seamless User Experience**: Users never see the login page unless they're truly logged out
2. **Background Refresh**: Tokens refresh automatically without user interaction
3. **Multiple Safety Nets**: Multiple strategies ensure tokens are always fresh
4. **Automatic Retry**: Failed requests due to expired tokens are automatically retried
5. **Secure**: All tokens stored in HTTP-only cookies, protected from XSS attacks

## Security Considerations

1. **Token Rotation**: Each refresh generates new refresh tokens, invalidating old ones
2. **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies, preventing JavaScript access
3. **Secure Flag**: In production, cookies are only sent over HTTPS
4. **Session Tracking**: Each refresh token tied to a database session for revocation
5. **Expiry Validation**: Server validates token expiry and session validity

## Troubleshooting

### User Still Getting Logged Out

1. Check browser console for refresh errors
2. Verify the refresh token endpoint is accessible
3. Check database session table for expired sessions
4. Verify JWT secrets are configured in environment variables

### Token Refresh Loops

If you see repeated refresh attempts, check:
1. Server is correctly setting cookie headers
2. Cookies are not being blocked by browser settings
3. API endpoint CORS configuration allows credentials

### Debug Logging

The system includes console logging for debugging:
- `[Token Refresh]`: Periodic refresh attempts
- `[Visibility Refresh]`: Visibility-based refresh attempts
- `[Auth]`: Authentication state changes

## Future Enhancements

Potential improvements:
1. Add token refresh on network reconnection
2. Implement refresh token blacklisting for enhanced security
3. Add metrics for token refresh success/failure rates
4. Support multiple concurrent sessions per user
