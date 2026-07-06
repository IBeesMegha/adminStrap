# Redis Caching Implementation Guide

This document explains how to add Redis caching to this Next.js CMS project for performance optimization.

---

## 1. Install Redis & Dependencies

```bash
# Install ioredis (Redis client for Node.js)
npm install ioredis

# (Optional) Install express-rate-limit if using rate limiting with Redis
# npm install express-rate-limit rate-limit-redis
```

You also need a running Redis server:
- **Locally**: Install Redis via `choco install redis` (Windows) or use WSL.
- **Docker**: `docker run -d -p 6379:6379 --name redis redis:7`
- **Production**: Use Redis Cloud / Upstash / AWS ElastiCache.

---

## 2. Create Redis Client (`lib/redis.ts`)

```typescript
import Redis from 'ioredis';

declare global {
  var redis: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis =
  global.redis ||
  new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,  // Don't fail if Redis is not available at startup
    enableOfflineQueue: false,
  });

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

// Helper: Try connecting (won't crash if Redis is down)
export async function ensureRedis(): Promise<Redis | null> {
  try {
    if (redis.status !== 'ready') {
      await redis.connect();
    }
    return redis;
  } catch {
    console.warn('[Redis] Not available — caching disabled');
    return null;
  }
}

// Generic cache wrapper
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  // Try Redis first
  if (redis.status === 'ready') {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in Redis (fire-and-forget)
  if (redis.status === 'ready') {
    redis.setex(key, ttlSeconds, JSON.stringify(data)).catch(() => {});
  }

  return data;
}
```

Add `REDIS_URL` to `.env`:
```
REDIS_URL=redis://localhost:6379
```

---

## 3. Where to Add Redis — Backend

### 3a. Cache Prisma Queries (Highest Impact)

**File: `pages/api/collections/[name]/index.ts`** — Cache GET collection entries:

```typescript
import { getOrSet } from '@/lib/redis';

// Inside GET handler (~line 37)
if (req.method === 'GET') {
  const cacheKey = `collections:${name}:${lang}:${populate || 'false'}`;

  let entries = await getOrSet(cacheKey, async () => {
    const data = await findManyDynamic(name, { where: { lang } });
    const converted = data.map((entry: any) => ({ ...entry }));
    let resolved = await resolveMultipleRelations(converted, name, fields);
    if (populate === 'true') {
      resolved = await populateMultipleEntries(resolved, fields);
    }
    return resolved;
  }, 30); // 30 second TTL for collections

  return res.status(200).json({ data: entries });
}
```

**Invalidate cache on POST/PUT/DELETE** — Add inside the write handlers:

```typescript
import { redis } from '@/lib/redis';

if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
  // Flush collection cache (scan + delete)
  if (redis.status === 'ready') {
    const keys = await redis.keys(`collections:${name}:*`);
    if (keys.length > 0) await redis.del(...keys);
  }
}
```

### 3b. Cache API Routes — Add to individual route files

Apply `getOrSet` wrapper to these API endpoints:

| Route | Cache Key Pattern | TTL | Notes |
|-------|------------------|-----|-------|
| `pages/api/collection-types/` | `collection-types:list` | 60s | Schema rarely changes |
| `pages/api/single-types/` | `single-types:list` | 60s | |
| `pages/api/components/` | `components:list` | 60s | |
| `pages/api/dashboard/*` | `dashboard:*` | 30s | Aggregated stats |
| `pages/api/roles/` | `roles:list` | 120s | |
| `pages/api/permissions/` | `permissions:list` | 120s | |
| `pages/api/languages/` | `languages:list` | 300s | Very stable data |

### 3c. Cache LLM Responses (`lib/llm-service.ts`)

LLM calls are slow & expensive — cache identical queries:

```typescript
// In generateAnswer function, before making the API call
import { redis } from '@/lib/redis';

// Generate cache key from prompt + model
const cacheKey = `llm:${hashString(systemPrompt + userPrompt + config.model)}`;

if (redis.status === 'ready') {
  const cached = await redis.get(cacheKey);
  if (cached) return cached;
}

// ... existing API call logic ...

// After getting response, cache it
if (redis.status === 'ready') {
  redis.setex(cacheKey, 3600, text); // 1 hour TTL
}
```

Add a helper hash function:
```typescript
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
```

### 3d. Cache RAG / Embedding Results (`lib/rag-service.ts`)

The `ragSearch` function does BM25 + vector search which can be cached:

```typescript
// At the start of ragSearch (~line 61)
const cacheKey = `rag:${hashString(query)}:${sourceId || 'all'}:${llmModel}`;

const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached) as RAGResponse;

// ... existing logic ...

// Before return, cache the result
redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 min TTL
```

### 3e. Cache Embeddings (`lib/knowledge-processing.ts`)

Embedding generation is expensive — cache by text:

```typescript
// Inside generateEmbedding function
const cacheKey = `embedding:${hashString(text)}`;

const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... existing embedding logic ...
redis.setex(cacheKey, 86400, JSON.stringify(embedding)); // 24h TTL
```

### 3f. Cache Media Queries (`lib/media-service.ts`)

```typescript
// Cache media lookups
const cacheKey = `media:chunks:${chunkIds.sort().join(',')}`;
return getOrSet(cacheKey, () => getMediaForChunks(chunkIds), 60);
```

---

## 4. Where to Add Redis — Frontend

Redis runs on the **server only**. On the frontend, you add a **Service Worker** or use **React Query / SWR** to leverage the cached API responses.

### 4a. Client-side caching with SWR (Recommended)

Install:
```bash
npm install swr
```

**File: `lib/api.ts`** — Replace direct fetch with SWR:

```typescript
import useSWR from 'swr';

// Transform ApiClient to use SWR
export function useCollectionEntries(collectionName: string) {
  return useSWR(
    `/api/collections/${collectionName}`,
    { revalidateOnFocus: false, dedupingInterval: 30000 } // 30s dedup
  );
}
```

Apply to high-traffic pages in `pages/admin/`:

```typescript
// Instead of: const data = await api.getCollectionEntries('blogs');
// Use:
const { data, error, isLoading } = useCollectionEntries('blogs');
```

### 4b. Static Generation with Redis-backed revalidation

For public pages (`pages/index.tsx`):

```typescript
export async function getStaticProps() {
  // This runs server-side where Redis is available
  const { getOrSet } = await import('@/lib/redis');
  const { prisma } = await import('@/lib/prisma'); // Adjust path as needed

  const data = await getOrSet('homepage:data', () => prisma.collectionType.findMany(), 60);

  return { props: { data }, revalidate: 60 };
}
```

---

## 5. Redis for Sessions (Alternative to JWT-only)

```typescript
// lib/session.ts
import { redis } from './redis';

export async function createSession(userId: string, ttl = 86400): Promise<string> {
  const sessionId = crypto.randomUUID();
  await redis.setex(`session:${sessionId}`, ttl, userId);
  return sessionId;
}

export async function getUserIdFromSession(sessionId: string): Promise<string | null> {
  return redis.get(`session:${sessionId}`);
}

export async function destroySession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}
```

---

## 6. Rate Limiting with Redis

**File: `lib/rate-limit.ts`**
```typescript
import { redis } from './redis';

export async function rateLimit(
  identifier: string,
  maxRequests: number = 30,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
  };
}
```

Use in API routes:
```typescript
// In any API handler
const { allowed } = await rateLimit(req.socket.remoteAddress || 'unknown');
if (!allowed) return res.status(429).json({ error: 'Too many requests' });
```

---

## 7. Summary — Implementation Priority

| Priority | Where | What to Cache | Expected Speedup |
|----------|-------|---------------|------------------|
| 🔴 P0 | `lib/rag-service.ts` | RAG search results | 10-50x |
| 🔴 P0 | `lib/knowledge-processing.ts` | Embeddings (24h) | 10-100x |
| 🔴 P0 | `lib/llm-service.ts` | Identical LLM prompts (1h) | Eliminates redundant API calls |
| 🟡 P1 | `pages/api/collections/` | GET collection entries (30s) | 5-20x |
| 🟡 P1 | `pages/api/dashboard/` | Dashboard stats (30s) | 5-10x |
| 🟢 P2 | `pages/api/collection-types/` | Schema data (60s) | 2-5x |
| 🟢 P2 | `pages/api/media/` | Media lookups (60s) | 2-5x |
| 🔵 P3 | Frontend SWR | API response dedup | Better UX |

---

## 8. Cache Invalidation Strategy

| Data Type | TTL | Invalidate On |
|-----------|-----|---------------|
| Collection entries | 30s | POST/PUT/DELETE on that collection |
| Collection types | 60s | Schema changes (manual) |
| RAG results | 5 min | Knowledge base updates |
| Embeddings | 24h | Re-scrape / re-process |
| LLM responses | 1h | None (model output is deterministic) |
| Dashboard stats | 30s | Any data mutation |
| Media queries | 60s | Media upload/delete |
| Languages | 5 min | Language add/remove |
