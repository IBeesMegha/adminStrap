# Phase X Migration & Deployment Guide

## Pre-Migration Checklist

- [ ] Backup production database
- [ ] Test in staging environment first
- [ ] Review code changes in all modified files
- [ ] Verify Node.js and npm versions compatibility
- [ ] Check database connection and permissions
- [ ] Review disk space for new table

---

## Step-by-Step Migration

### Step 1: Update Code

Pull the latest changes containing:
- Updated Prisma schema (`prisma/schema.prisma`)
- Enhanced web crawler (`lib/web-crawler.ts`)
- New media service (`lib/media-service.ts`)
- Updated RAG service (`lib/rag-service.ts`)
- API endpoint updates
- New frontend component

### Step 2: Install Dependencies

```bash
cd /path/to/project
npm install
```

### Step 3: Create Database Migration

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_knowledge_media

# Or use this command for production
npx prisma migrate deploy
```

This will:
1. Create the `knowledge_media` table
2. Add relationships to existing tables
3. Generate database indexes
4. Update Prisma client

### Step 4: Verify Migration

```bash
# Connect to database and check table
psql $DATABASE_URL -c "\d knowledge_media"

# Should show:
# - id (TEXT PRIMARY KEY)
# - page_id (TEXT, FK to knowledge_pages)
# - chunk_id (TEXT, FK to knowledge_chunks, nullable)
# - type (TEXT, default 'image')
# - mediaUrl (TEXT)
# - altText (TEXT, nullable)
# - caption (TEXT, nullable)
# - title (TEXT, nullable)
# - mimeType (TEXT, nullable)
# - width (INT, nullable)
# - height (INT, nullable)
# - metadata (JSONB, nullable)
# - embedding (FLOAT8[], nullable)
# - createdAt (TIMESTAMP)
# - updatedAt (TIMESTAMP)
```

### Step 5: Rebuild Prisma Client

```bash
npx prisma generate
```

### Step 6: Start Application

```bash
npm run dev
# or
npm start
```

### Step 7: Verify API Endpoints

Test the search endpoint returns images:

```bash
curl -X POST http://localhost:3000/api/knowledge-base/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "your test query",
    "sourceId": "source_id_if_available"
  }'
```

Expected response should include `images` array (if images were found):
```json
{
  "success": true,
  "source": "rag",
  "answer": "...",
  "images": [
    {
      "url": "...",
      "alt": "...",
      "caption": "...",
      "type": "image"
    }
  ]
}
```

---

## Re-Crawl Existing Knowledge Sources

After migration, to enable image extraction for existing sources:

### Option A: Full Re-Crawl

```bash
# Make API call to re-crawl
curl -X POST http://localhost:3000/api/knowledge-base/[sourceId]/crawl \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

**Advantages:**
- Extracts all media from all pages
- Fresh data
- Cleans up old data

**Disadvantages:**
- Takes time (depending on site size)
- May take bandwidth

### Option B: Selective Re-Crawl

Re-crawl only specific pages:

```sql
-- Update pages to pending status for re-processing
UPDATE knowledge_pages
SET crawl_status = 'discovered', processing_status = 'pending'
WHERE source_id = 'your_source_id'
LIMIT 50;

-- Then trigger processing
curl -X POST http://localhost:3000/api/knowledge-base/process?sourceId=your_source_id \
  -H "Content-Type: application/json"
```

### Option C: Progressive Crawl

Let new crawls automatically extract media for new pages, then gradually update old pages.

---

## Rollback Plan

If issues occur:

### Step 1: Stop Application

```bash
# If using process manager
npm stop

# Or manually kill the process
```

### Step 2: Restore Database Backup

```bash
# Restore from backup (example for PostgreSQL)
psql $DATABASE_URL < backup.sql

# Or use Prisma migration rollback
npx prisma migrate resolve --rolled-back add_knowledge_media
```

### Step 3: Revert Code

```bash
git revert HEAD~1  # Revert to previous commit
npm install
npx prisma generate
```

### Step 4: Restart Application

```bash
npm start
```

---

## Monitoring Post-Migration

### Check Media Extraction

```sql
-- Count media per source
SELECT 
  ks.name,
  COUNT(km.id) as total_media,
  COUNT(DISTINCT km.page_id) as pages_with_media,
  COUNT(DISTINCT CASE WHEN km.type = 'image' THEN km.id END) as images,
  COUNT(DISTINCT CASE WHEN km.type = 'pdf' THEN km.id END) as pdfs
FROM knowledge_sources ks
LEFT JOIN knowledge_pages kp ON ks.id = kp.source_id
LEFT JOIN knowledge_media km ON kp.id = km.page_id
GROUP BY ks.id, ks.name
ORDER BY total_media DESC;
```

### Check Media Linking

```sql
-- Linking statistics
SELECT 
  COUNT(*) as total_media,
  COUNT(CASE WHEN chunk_id IS NOT NULL THEN 1 END) as linked,
  ROUND(100.0 * COUNT(CASE WHEN chunk_id IS NOT NULL THEN 1 END) / COUNT(*), 2) as linked_percentage
FROM knowledge_media;
```

### Monitor Performance

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('knowledge_media', 'knowledge_pages', 'knowledge_chunks')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### API Response Monitoring

Monitor these metrics after deployment:
- Search response time (should be +50ms max)
- Images per response (target: 0-5)
- Image extraction success rate (target: >80%)
- Media linking success rate (target: >60%)

---

## Troubleshooting Common Issues

### Issue 1: "Relation knowledge_media does not exist"

**Cause**: Migration not applied

**Solution**:
```bash
npx prisma migrate deploy
npx prisma generate
npm start
```

### Issue 2: Foreign key constraint errors

**Cause**: Cascading delete issues

**Solution**:
```sql
-- Check for orphaned records
SELECT * FROM knowledge_media WHERE page_id NOT IN (SELECT id FROM knowledge_pages);

-- Delete orphaned records
DELETE FROM knowledge_media WHERE page_id NOT IN (SELECT id FROM knowledge_pages);
```

### Issue 3: "Cannot find module media-service"

**Cause**: TypeScript not compiled or import path wrong

**Solution**:
```bash
# Rebuild TypeScript
npm run build

# Or restart dev server
npm run dev
```

### Issue 4: Images not appearing in search results

**Cause**: No media linked to chunks

**Diagnoses**:
```bash
# Check if media exists
psql $DATABASE_URL -c "SELECT COUNT(*) FROM knowledge_media;"

# Check if linking ran
psql $DATABASE_URL -c "SELECT COUNT(*) FROM knowledge_media WHERE chunk_id IS NOT NULL;"

# Check linking function logs
# Look for "[MEDIA LINKING]" messages in application logs
```

**Solution**: Re-run media linking:
```bash
# Re-process pages to link media
curl -X POST http://localhost:3000/api/knowledge-base/process?sourceId=xxx
```

---

## Configuration Tweaks

### Adjust Media Linking Threshold

In `lib/media-service.ts`, change similarity threshold:

```typescript
// Line ~100
if (score > bestScore && score > 0.2) {  // Change 0.2 to desired threshold
  bestScore = score;
  bestChunkId = chunk.id;
}
```

Lower threshold = more aggressive linking
Higher threshold = more conservative

### Limit Images per Response

In `lib/rag-service.ts`, change image limit:

```typescript
// Line ~120
.slice(0, 5)  // Change 5 to desired limit
```

### Filter Image Types

In `components/ai/ImageGallery.tsx`:

```typescript
const displayImages = images
  .filter(img => img.type === 'image')  // Add type filter
  .slice(0, maxImages);
```

---

## Performance Optimization

### Database Optimization

```sql
-- Analyze and vacuum
ANALYZE knowledge_media;
VACUUM knowledge_media;

-- Create additional indexes if needed
CREATE INDEX idx_knowledge_media_url ON knowledge_media(media_url);
```

### Caching Strategy

Add caching for frequently accessed media:

```typescript
// Cache media by chunk ID for 1 hour
const cache = new Map<string, MediaWithMetadata[]>();
const CACHE_TTL = 60 * 60 * 1000;

export async function getMediaForChunksWithCache(chunkIds: string[]) {
  const cacheKey = chunkIds.join(',');
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  
  const media = await getMediaForChunks(chunkIds);
  cache.set(cacheKey, media);
  
  // Auto-expire after TTL
  setTimeout(() => cache.delete(cacheKey), CACHE_TTL);
  
  return media;
}
```

---

## Deployment Checklist

- [ ] Code changes reviewed and tested
- [ ] Database migration created and tested in staging
- [ ] Backup taken
- [ ] Environment variables configured
- [ ] API endpoints tested
- [ ] Frontend component integrated
- [ ] Performance tested
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Deployment window scheduled

---

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review application logs for errors
3. Check database connectivity and schema
4. Verify API endpoint responses
5. Contact development team with:
   - Error message
   - Steps to reproduce
   - Database query results
   - Application logs

---

## Post-Deployment Verification (Day 1)

- [ ] Search endpoint returns images
- [ ] Image gallery displays correctly
- [ ] Performance is acceptable (<2s response time)
- [ ] No database errors in logs
- [ ] Images are properly linked to chunks
- [ ] Frontend renders images without errors
- [ ] Mobile view works correctly
- [ ] Image modal opens and closes properly

---

**Deployment Date**: _______________  
**Deployed By**: _______________  
**Verified By**: _______________  
**Notes**: ________________________________________________________________

