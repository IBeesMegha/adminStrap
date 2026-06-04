# Knowledge Base - Semantic Search Pipeline

Complete documentation for the semantic search implementation in the Knowledge Base module.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Content Processing Pipeline](#content-processing-pipeline)
5. [API Endpoints](#api-endpoints)
6. [Frontend Pages](#frontend-pages)
7. [Configuration](#configuration)
8. [Usage Guide](#usage-guide)
9. [Future Enhancements](#future-enhancements)

---

## Overview

The Knowledge Base module provides a complete semantic search pipeline for crawling websites, processing content, generating embeddings, and performing similarity-based retrieval.

### Key Features

- ✅ Website crawling with sitemap support
- ✅ Intelligent content chunking with overlap
- ✅ AI-powered embedding generation (Groq API)
- ✅ Semantic search with cosine similarity
- ✅ Processing job monitoring
- ✅ Search quality testing interface
- ✅ Configurable settings
- ✅ Multi-source support
- ✅ Future-ready for multiple file types (PDF, DOCX, TXT, CSV)

---

## Architecture

### High-Level Flow

```
Website URL
    ↓
[1] Crawling (web-crawler.ts)
    ↓
knowledge_pages (textContent stored)
    ↓
[2] Content Processing (knowledge-processing.ts)
    ↓
Clean Text → Chunk Text → Generate Embeddings
    ↓
knowledge_chunks (with embeddings)
    ↓
[3] Semantic Search
    ↓
Query → Generate Query Embedding → Compare with Chunks → Return Top Matches
```

### Key Components

1. **Web Crawler** (`lib/web-crawler.ts`)
   - Fetches sitemap.xml if available
   - Performs BFS crawling
   - Extracts text and HTML content

2. **Content Processor** (`lib/knowledge-processing.ts`)
   - Cleans text (removes HTML, scripts, excess whitespace)
   - Chunks text with configurable size and overlap
   - Generates embeddings via Groq API

3. **Search Engine** (`pages/api/knowledge-base/search.ts`)
   - Generates query embedding
   - Calculates cosine similarity
   - Returns ranked results above threshold

---

## Database Schema

### `knowledge_sources`

Stores knowledge sources (websites, future: documents).

| Field          | Type     | Description                           |
|----------------|----------|---------------------------------------|
| id             | String   | Unique identifier                     |
| name           | String   | Display name                          |
| websiteUrl     | String   | Source URL (unique)                   |
| status         | String   | pending, crawling, completed, failed  |
| totalPages     | Int      | Number of crawled pages               |
| totalChunks    | Int      | Total chunks generated                |
| lastCrawlAt    | DateTime | Last crawl timestamp                  |
| errorMessage   | String   | Error details if failed               |

### `knowledge_pages`

Stores individual crawled pages.

| Field            | Type     | Description                                |
|------------------|----------|--------------------------------------------|
| id               | String   | Unique identifier                          |
| sourceId         | String   | Foreign key to knowledge_sources           |
| url              | String   | Page URL                                   |
| pageTitle        | String   | Extracted page title                       |
| textContent      | Text     | Cleaned text content                       |
| htmlContent      | Text     | Raw HTML content                           |
| contentLength    | Int      | Character count                            |
| crawlStatus      | String   | discovered, crawled, failed                |
| processingStatus | String   | pending, processing, completed, failed     |
| errorMessage     | String   | Processing error details                   |
| lastCrawledAt    | DateTime | Crawl timestamp                            |
| lastProcessedAt  | DateTime | Processing timestamp                       |

### `knowledge_chunks`

Stores text chunks with embeddings.

| Field       | Type     | Description                           |
|-------------|----------|---------------------------------------|
| id          | String   | Unique identifier                     |
| sourceId    | String   | Foreign key to knowledge_sources      |
| pageId      | String   | Foreign key to knowledge_pages        |
| chunkText   | Text     | Chunk content                         |
| chunkIndex  | Int      | Position in page (0, 1, 2, ...)       |
| tokenCount  | Int      | Estimated tokens                      |
| embedding   | Float[]  | Vector embedding (768 or 1536 dims)   |

**Important**: Embeddings are stored as PostgreSQL arrays. Each chunk has its own embedding for independent retrieval.

### `knowledge_settings`

Stores configuration parameters.

| Field               | Type   | Default             | Description                           |
|---------------------|--------|---------------------|---------------------------------------|
| chunkSize           | Int    | 800                 | Words per chunk                       |
| chunkOverlap        | Int    | 100                 | Overlapping words                     |
| similarityThreshold | Float  | 0.7                 | Minimum similarity score (0-1)        |
| maxSearchResults    | Int    | 10                  | Max results to return                 |
| embeddingModel      | String | nomic-embed-text    | Groq embedding model                  |

---

## Content Processing Pipeline

### Step 1: Text Cleaning

```typescript
cleanTextContent(text: string): string
```

**Operations:**
- Remove HTML tags
- Remove scripts and styles
- Decode HTML entities
- Remove URLs and emails
- Normalize whitespace
- Remove duplicate line breaks

**Example:**
```
Input:  "<p>Hello   World</p><script>alert('x')</script>"
Output: "Hello World"
```

### Step 2: Text Chunking

```typescript
chunkText(text: string, options: ProcessingOptions): ChunkResult[]
```

**Algorithm:**
1. Split text into words
2. Create chunks of N words (default: 800)
3. Add overlap between chunks (default: 100 words)
4. Estimate token count (0.75 tokens per word)

**Example:**
```
Text: 1500 words
Chunk Size: 800
Overlap: 100

Chunk 0: Words 0-799
Chunk 1: Words 700-1499 (100 word overlap)
```

**Why Overlap?**
- Maintains context across boundaries
- Improves retrieval for queries at chunk edges
- Prevents semantic information loss

### Step 3: Embedding Generation

```typescript
generateEmbedding(text: string, model: string): Promise<number[]>
```

**Process:**
1. Call Groq Embeddings API
2. Model: `nomic-embed-text` (default)
3. Returns vector (typically 768 dimensions)
4. Rate limiting: 100ms delay between requests

**API Call:**
```typescript
const response = await groq.embeddings.create({
  model: 'nomic-embed-text',
  input: text,
});
```

### Step 4: Storage

Each chunk is stored with:
- `chunkText`: The actual text
- `chunkIndex`: Position in page
- `tokenCount`: For tracking
- `embedding`: Vector for similarity search

---

## API Endpoints

### POST `/api/knowledge-base/process`

Process pages to generate chunks and embeddings.

**Query Parameters:**
- `sourceId` (optional): Process specific source
- `pageId` (optional): Process specific page

**Response:**
```json
{
  "success": true,
  "message": "Processed 5 pages successfully, 0 failed",
  "processed": 5,
  "failed": 0
}
```

**Process:**
1. Fetch pages with status "pending" or "failed"
2. For each page:
   - Clean text content
   - Generate chunks
   - Generate embeddings
   - Store in `knowledge_chunks`
   - Update page status to "completed"
3. Update source chunk count

---

### POST `/api/knowledge-base/search`

Perform semantic search across knowledge base.

**Request Body:**
```json
{
  "query": "What products do you offer?",
  "sourceId": "optional-source-id",
  "limit": 10
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "chunkId": "clxx123",
      "chunkText": "We offer a wide range of products...",
      "similarity": 0.89,
      "pageTitle": "Products",
      "pageUrl": "https://example.com/products",
      "sourceName": "Company Website",
      "sourceId": "clxx456",
      "pageId": "clxx789"
    }
  ],
  "totalMatches": 15,
  "returned": 10
}
```

**Algorithm:**
1. Generate embedding for query
2. Fetch all chunks (optionally filtered by source)
3. Calculate cosine similarity for each chunk
4. Filter by similarity threshold
5. Sort by similarity (descending)
6. Return top N results

---

### GET `/api/knowledge-base/settings`

Get current settings.

### PUT `/api/knowledge-base/settings`

Update settings.

**Request Body:**
```json
{
  "chunkSize": 800,
  "chunkOverlap": 100,
  "similarityThreshold": 0.7,
  "maxSearchResults": 10,
  "embeddingModel": "nomic-embed-text"
}
```

---

### GET `/api/knowledge-base/stats`

Get processing statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "pages": {
      "pending": 5,
      "processing": 2,
      "completed": 45,
      "failed": 3,
      "total": 55
    },
    "chunks": {
      "total": 342
    },
    "sources": [...],
    "recentActivity": [...]
  }
}
```

---

### GET `/api/knowledge-base/documents`

Get all documents (pages) with chunk information.

**Query Parameters:**
- `sourceId` (optional): Filter by source

---

## Frontend Pages

### 1. Sources (`/admin/knowledge-base`)

**Features:**
- List all knowledge sources
- Add new sources
- Re-crawl existing sources
- Delete sources
- View crawl status

**Navigation:**
- Links to Documents, Search Testing, Processing Jobs, Settings

---

### 2. Documents (`/admin/knowledge-base/documents`)

**Features:**
- View all crawled pages
- Filter by source
- See processing status
- View chunk counts
- Reprocess individual pages
- Link to original URLs

**Status Indicators:**
- ✅ Completed (green)
- ⏳ Pending (gray)
- 🔄 Processing (blue, animated)
- ❌ Failed (red, with error message)

---

### 3. Search Testing (`/admin/knowledge-base/search-test`)

**Purpose:**
Test semantic search quality before production use.

**Features:**
- Enter natural language queries
- View top matching chunks
- See similarity scores
- Color-coded relevance (green: 90%+, blue: 80%+, yellow: 70%+)
- Links to source pages
- Chunk preview with truncation

**Use Cases:**
- Validate embedding quality
- Test retrieval accuracy
- Fine-tune similarity threshold
- Identify content gaps

---

### 4. Processing Jobs (`/admin/knowledge-base/processing`)

**Features:**
- Real-time processing statistics
- Status cards (Total, Pending, Completed, Failed)
- Total embeddings counter
- Visual pipeline progress bars
- Recent activity log
- "Process All Pending" button

**Pipeline Stages:**
1. Website Crawling
2. Chunk Generation
3. Embedding Generation

**Auto-refresh:** Updates every 5 seconds

---

### 5. Settings (`/admin/knowledge-base/settings`)

**Configuration Categories:**

1. **Content Chunking**
   - Chunk Size (100-5000 words)
   - Chunk Overlap (0-500 words)

2. **Search Configuration**
   - Similarity Threshold (0-1, visual slider)
   - Maximum Search Results (1-100)

3. **Embedding Model**
   - Model selection dropdown
   - API configuration notes

**Validation:**
- Real-time input validation
- Range checking
- Warning notes for setting changes

---

## Configuration

### Environment Variables

```bash
# Required for embeddings
GROQ_API_KEY="your-groq-api-key-here"

# Database connection
DATABASE_URL="postgresql://user:pass@host:port/db"
```

### Get Groq API Key

1. Visit https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new API key
5. Add to `.env` file

### Default Settings

```typescript
{
  chunkSize: 800,           // Words per chunk
  chunkOverlap: 100,        // Overlapping words
  similarityThreshold: 0.7, // 0-1 scale
  maxSearchResults: 10,     // Results to return
  embeddingModel: 'nomic-embed-text'
}
```

### Recommended Settings by Use Case

**High Precision (Legal, Medical):**
```typescript
{
  chunkSize: 600,
  chunkOverlap: 150,
  similarityThreshold: 0.85,
  maxSearchResults: 5
}
```

**Broad Search (General Knowledge):**
```typescript
{
  chunkSize: 1000,
  chunkOverlap: 100,
  similarityThreshold: 0.65,
  maxSearchResults: 20
}
```

**Balanced (Default):**
```typescript
{
  chunkSize: 800,
  chunkOverlap: 100,
  similarityThreshold: 0.7,
  maxSearchResults: 10
}
```

---

## Usage Guide

### Adding a Knowledge Source

1. Navigate to `/admin/knowledge-base`
2. Click "Add Knowledge Source"
3. Enter:
   - Name: "Company Website"
   - URL: "https://example.com"
   - Check "Start crawling immediately"
4. Click "Create"

**What Happens:**
- System fetches sitemap.xml (if available)
- Crawls up to 100 pages (configurable)
- Extracts text and HTML content
- Stores in `knowledge_pages`
- Auto-triggers processing

### Processing Content

**Automatic:**
Processing starts automatically after crawling completes.

**Manual:**
1. Go to `/admin/knowledge-base/processing`
2. Click "Process All Pending"
3. Monitor progress in real-time

**Per-Page:**
1. Go to `/admin/knowledge-base/documents`
2. Find the page
3. Click the reprocess icon

### Testing Search

1. Navigate to `/admin/knowledge-base/search-test`
2. Enter a query: "What are your business hours?"
3. Review results:
   - Check similarity scores (aim for 70%+)
   - Read chunk content for relevance
   - Verify source attribution
4. Adjust settings if needed

### Adjusting Settings

1. Go to `/admin/knowledge-base/settings`
2. Modify parameters:
   - **Low similarity scores?** Lower threshold (e.g., 0.65)
   - **Too many results?** Increase threshold or reduce max results
   - **Context breaks?** Increase chunk overlap
3. Click "Save Settings"
4. Reprocess pages to apply new chunking settings

---

## Future Enhancements

### Phase 2: Document Upload Support

**File Types:**
- PDF documents
- DOCX files
- TXT files
- CSV files

**Implementation:**
```typescript
// lib/document-parser.ts
export async function parsePDF(file: Buffer): Promise<string>;
export async function parseDOCX(file: Buffer): Promise<string>;
export async function parseCSV(file: Buffer): Promise<string>;
```

**Database:**
Add `sourceType` field to `knowledge_sources`:
- `website`
- `pdf`
- `docx`
- `txt`
- `csv`

### Phase 3: AI Chat Integration

**Goal:** Use retrieved chunks for RAG (Retrieval-Augmented Generation)

**Flow:**
```
User Query
    ↓
Semantic Search (retrieve top chunks)
    ↓
Context Assembly
    ↓
LLM Prompt (query + context)
    ↓
AI Response with Citations
```

**API Endpoint:**
```typescript
POST /api/knowledge-base/chat
{
  "query": "What are your business hours?",
  "sourceId": "optional",
  "conversationId": "optional"
}

Response:
{
  "answer": "Our business hours are...",
  "sources": [
    { "pageTitle": "...", "url": "...", "snippet": "..." }
  ]
}
```

### Phase 4: Advanced Features

- **Filters:** By date, source type, tags
- **Hybrid Search:** Combine semantic + keyword search
- **Re-ranking:** Use cross-encoder for better results
- **Analytics:** Track popular queries, click-through rates
- **Multi-language:** Support for non-English content
- **Scheduled Crawling:** Auto-refresh sources daily/weekly
- **Webhooks:** Notify on processing completion

---

## Troubleshooting

### Issue: No embeddings generated

**Cause:** Missing or invalid `GROQ_API_KEY`

**Solution:**
1. Check `.env` file
2. Verify API key is valid
3. Test with: `curl https://api.groq.com/...`

### Issue: Low similarity scores

**Cause:** Threshold too high or content mismatch

**Solution:**
1. Go to Settings
2. Lower `similarityThreshold` to 0.6-0.65
3. Test search again

### Issue: Processing stuck

**Cause:** Rate limiting or API errors

**Solution:**
1. Check Processing Jobs page for error logs
2. Increase delay between API calls (edit `knowledge-processing.ts`)
3. Reprocess failed pages

### Issue: Search returns no results

**Checklist:**
- ✅ Pages processed? (Check Documents page)
- ✅ Chunks generated? (Check Processing Jobs)
- ✅ Embeddings stored? (Check database)
- ✅ Threshold too high? (Lower in Settings)

---

## Performance Considerations

### Database Indexes

Already included:
```sql
@@index([sourceId])
@@index([pageId])
@@index([processingStatus])
```

### Optimization Tips

1. **Batch Processing:**
   - Process 10 pages at a time
   - Prevents memory issues

2. **Rate Limiting:**
   - 100ms delay between embedding requests
   - Prevents API throttling

3. **Chunking Strategy:**
   - Smaller chunks = More precise, more storage
   - Larger chunks = Better context, less storage
   - Overlap = Better coverage, more redundancy

4. **Vector Search:**
   - Current: In-memory cosine similarity (fine for <10K chunks)
   - Future: pgvector extension for efficient similarity search at scale

---

## Summary

The Knowledge Base Semantic Search pipeline is now complete:

✅ **Database:** 3 new tables (`knowledge_chunks`, `knowledge_settings`, updated `knowledge_pages`)  
✅ **Processing:** Clean → Chunk → Embed pipeline  
✅ **Search:** Semantic similarity with cosine distance  
✅ **APIs:** 6 endpoints for full CRUD operations  
✅ **UI:** 5 pages for management and testing  
✅ **Settings:** Fully configurable  
✅ **Future-Ready:** Extensible for multiple source types  

**Next Steps:**
1. Add your `GROQ_API_KEY` to `.env`
2. Crawl a website
3. Test search quality
4. Integrate with chat/AI features (Phase 3)

---

**Documentation Version:** 1.0  
**Last Updated:** 2026-06-04  
**Author:** CMS Development Team
