# Phase X – Multimodal RAG (Image Support) – Implementation Guide

## Overview
This document covers the complete implementation of multimodal RAG support, enabling the AI system to extract, store, retrieve, and return relevant images alongside text-based answers.

---

## Architecture Changes

### 1. Database Schema Updates

#### New Table: `KnowledgeMedia`
```sql
CREATE TABLE knowledge_media (
  id                TEXT PRIMARY KEY,
  page_id           TEXT NOT NULL,
  chunk_id          TEXT,
  type              TEXT DEFAULT 'image',
  media_url         TEXT NOT NULL,
  alt_text          TEXT,
  caption           TEXT,
  title             TEXT,
  mime_type         TEXT,
  width             INT,
  height            INT,
  metadata          JSONB,
  embedding         FLOAT8[],
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (page_id) REFERENCES knowledge_pages(id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id) REFERENCES knowledge_chunks(id) ON DELETE SET NULL
);

CREATE INDEX idx_knowledge_media_page_id ON knowledge_media(page_id);
CREATE INDEX idx_knowledge_media_chunk_id ON knowledge_media(chunk_id);
CREATE INDEX idx_knowledge_media_type ON knowledge_media(type);
```

#### Related Tables Updated
- **KnowledgePage**: Added `media` relationship
- **KnowledgeChunk**: Added `media` relationship

---

## Components Implemented

### 1. **Web Crawler (`lib/web-crawler.ts`)**
Enhanced to extract media during crawling.

**Features:**
- Extracts images from `<img>`, `<picture>`, `<figure>` tags
- Filters out decorative images (logos, icons, spacers)
- Extracts PDFs from links
- Extracts embedded videos (YouTube, Vimeo)
- Returns media metadata: alt text, title, caption, dimensions

**Output:**
```typescript
export interface CrawledMedia {
  type: 'image' | 'pdf' | 'video';
  mediaUrl: string;
  altText?: string;
  caption?: string;
  title?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}
```

### 2. **Media Service (`lib/media-service.ts`)**
Handles all media operations: storage, linking, retrieval.

**Key Functions:**
- `storeMediaFromPage()` - Saves extracted media to database
- `linkMediaToChunks()` - Associates media with text chunks based on similarity
- `getMediaForChunks()` - Retrieves media for specific chunks
- `deduplicateMedia()` - Removes duplicate media from results
- `rankMediaByRelevance()` - Sorts media by chunk relevance
- `getMediaStats()` - Returns media statistics

### 3. **RAG Service (`lib/rag-service.ts`)**
Enhanced to retrieve and return images.

**Changes:**
- Updated `RAGResponse` interface to include `images` field
- Retrieves media for all reranked chunks
- Deduplicates and ranks media by relevance
- Limits images to top 5 for response
- Updated system prompt to mention images
- Enhanced `buildUserPrompt()` to include image metadata

### 4. **API Endpoints**

#### `/api/knowledge-base/index.ts`
- Saves crawled media after creating pages
- Stores media in `KnowledgeMedia` table

#### `/api/knowledge-base/process.ts`
- Links media to chunks after chunk creation
- Calls `linkMediaToChunks()` after processing

#### `/api/knowledge-base/search.ts`
- Returns images in API response
- Response includes `images` array with metadata

### 5. **Frontend Component (`components/ai/ImageGallery.tsx`)**
React component for displaying retrieved images.

**Features:**
- Responsive grid layout (2-4 columns)
- Hover effects with title/caption overlay
- Click-to-expand modal viewer
- Previous/Next navigation
- Image type badges (PDF, Video)
- Relevance score display
- Error handling for broken images
- Alt text display

**Usage:**
```tsx
import ImageGallery from '@/components/ai/ImageGallery';

<ImageGallery
  images={searchResult.images}
  maxImages={6}
  onImageClick={(image) => console.log(image)}
/>
```

---

## Data Flow

```
Website Crawling
    ↓
[Web Crawler] → Extract Images + Alt Text + Metadata
    ↓
[Store Pages] → Save to KnowledgePage
    ↓
[Store Media] → Save to KnowledgeMedia (media-service)
    ↓
[Create Chunks] → Split text, save to KnowledgeChunk
    ↓
[Link Media] → Associate images with chunks (text similarity)
    ↓
User Query
    ↓
[RAG Search] → Retrieve chunks + calculate relevance
    ↓
[Retrieve Media] → Get all images linked to chunks
    ↓
[Deduplicate] → Remove duplicate URLs
    ↓
[Rank Media] → Sort by chunk relevance score
    ↓
[Build Response] → Include top 5 images
    ↓
[LLM Generation] → Generate answer with image metadata
    ↓
API Response → Answer + Images + Chunks
    ↓
Frontend Display → Show text answer + image gallery
```

---

## API Response Format

### Before (Text-only)
```json
{
  "success": true,
  "source": "rag",
  "answer": "...",
  "supportingChunks": [...],
  "totalRetrieved": 50,
  "totalAfterRerank": 10
}
```

### After (With Images)
```json
{
  "success": true,
  "source": "rag",
  "answer": "...",
  "supportingChunks": [...],
  "totalRetrieved": 50,
  "totalAfterRerank": 10,
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Product feature overview",
      "caption": "Main dashboard interface",
      "title": "Dashboard Screenshot",
      "type": "image",
      "mimeType": "image/jpeg",
      "width": 1200,
      "height": 800,
      "relevanceScore": 0.95
    }
  ]
}
```

---

## Media Linking Strategy

### Text Similarity Calculation
Media is linked to chunks using **Jaccard similarity** on words:

$$\text{Similarity} = \frac{\text{intersection of words}}{\text{union of words}}$$

**Process:**
1. Extract media text: alt + caption + title
2. For each chunk, calculate similarity score
3. Link media to chunk with highest similarity (if > 0.2 threshold)
4. If no good match, media remains unlinked

---

## Configuration

### Settings (KnowledgeSettings table)
No new settings required. Existing settings apply:
- `chunkSize` - Affects chunk-media associations
- `chunkOverlap` - Affects media linking
- `embeddingModel` - For future image embeddings

### Future Enhancements
The architecture supports adding:
- **Image embeddings** (CLIP/OpenCLIP)
- **Reverse image search**
- **Similar image retrieval**
- **PDF/Video previews**
- **Multi-modal embeddings** (text + image)

No database schema redesign needed.

---

## Database Migration Steps

### Step 1: Create KnowledgeMedia Table
```bash
npx prisma migrate dev --name add_knowledge_media
```

This will:
1. Create the `KnowledgeMedia` table
2. Add relationships to `KnowledgePage` and `KnowledgeChunk`
3. Generate Prisma client

### Step 2: Regenerate Prisma Client
```bash
npx prisma generate
```

### Step 3: (Optional) Seed Existing Data
If you have existing pages without media, you can:
1. Re-crawl pages to extract media
2. Or manually run media extraction for specific pages

---

## Integration Checklist

- [x] Update Prisma schema with `KnowledgeMedia` model
- [x] Enhance web crawler to extract media
- [x] Create media service for storage and linking
- [x] Update knowledge processing to link media to chunks
- [x] Update RAG service to retrieve media
- [x] Update LLM system prompt to mention images
- [x] Update API response format to include images
- [x] Create frontend ImageGallery component
- [x] Create integration example
- [x] Document architecture and data flow
- [ ] Deploy migration to production
- [ ] Test with real knowledge base
- [ ] Monitor media extraction quality
- [ ] Fine-tune similarity thresholds if needed

---

## Testing

### Unit Tests
```typescript
// Test media extraction
const media = await storeMediaFromPage(pageId, crawledMedia);
expect(media.length).toBeGreaterThan(0);

// Test media linking
const linked = await linkMediaToChunks(pageId);
expect(linked).toBeGreaterThan(0);

// Test RAG retrieval
const result = await ragSearch('query');
expect(result.images).toBeDefined();
expect(result.images.length).toBeLessThanOrEqual(5);
```

### Integration Tests
1. Crawl a test website with images
2. Verify media stored in database
3. Create chunks and verify linking
4. Search and verify images in response
5. Render images in frontend

### Manual Testing
1. Add a knowledge source with images
2. Crawl and process pages
3. Search with a query
4. Verify images appear in results
5. Test image gallery interactions
6. Test modal viewer

---

## Performance Considerations

### Media Extraction
- **Time**: ~500ms per page (added to crawl)
- **Limit**: max 50 images per page (configurable)
- **Storage**: metadata only (~1KB per image)

### Media Linking
- **Time**: ~200ms per page (BM25 similarity)
- **Complexity**: O(media_count × chunk_count)
- **Optimization**: Only link if text metadata > 5 chars

### RAG Retrieval
- **Time**: +50ms (retrieve media for chunks)
- **Limit**: max 5 images in response
- **Storage**: minimal (URLs and metadata)

### Frontend Rendering
- **Images**: Lazy loaded with Next/Image
- **Gallery**: Responsive grid (2-4 columns)
- **Modal**: Virtualized with keyboard navigation

---

## Troubleshooting

### No Images Appearing

**1. Check media extraction:**
```bash
# Query database
SELECT COUNT(*) FROM knowledge_media;

# Check for specific page
SELECT * FROM knowledge_media WHERE page_id = 'xxx';
```

**2. Check media linking:**
```bash
# Find unlinked media
SELECT * FROM knowledge_media WHERE chunk_id IS NULL;

# Check linking stats
SELECT 
  page_id, 
  COUNT(*) as total_media, 
  SUM(CASE WHEN chunk_id IS NOT NULL THEN 1 ELSE 0 END) as linked
FROM knowledge_media 
GROUP BY page_id;
```

**3. Check RAG retrieval:**
- Add logging to `getMediaForChunks()`
- Verify chunk IDs are being passed correctly
- Check similarity scores in `linkMediaToChunks()`

### Images Not Displaying (Frontend)
1. Check CORS headers on image URLs
2. Verify image URLs are accessible
3. Check browser console for errors
4. Test image loading with direct URL

### Performance Issues
1. Monitor `linkMediaToChunks()` execution time
2. Consider indexing frequently filtered columns
3. Cache media results if needed
4. Batch process large knowledge bases

---

## Future Roadmap

### Phase X.1 - Image Embeddings
- Generate CLIP embeddings for images
- Enable semantic image search
- Filter images by relevance threshold

### Phase X.2 - Advanced Media
- PDF preview extraction (first page)
- Video thumbnail extraction
- Multi-modal search (find images by text)

### Phase X.3 - User Interactions
- Image feedback (helpful/not helpful)
- Image rating system
- Popular images ranking

### Phase X.4 - Analytics
- Track image usage
- Monitor extraction success rate
- Analyze user interactions with images

---

## Support & Debugging

For issues or questions:
1. Check database structure: `\d knowledge_media` (PostgreSQL)
2. Verify relationships: `SELECT * FROM information_schema.key_column_usage`
3. Monitor logs for extraction errors
4. Test with sample images first
5. Incrementally enable for production

---

## References

- **Prisma Relations**: https://www.prisma.io/docs/concepts/relations
- **PostgreSQL Arrays**: https://www.postgresql.org/docs/current/arrays.html
- **Image Optimization**: https://nextjs.org/docs/basic-features/image-optimization
- **Jaccard Similarity**: https://en.wikipedia.org/wiki/Jaccard_index

---

**Version**: 1.0  
**Last Updated**: 2026-06-17  
**Status**: Ready for Implementation
