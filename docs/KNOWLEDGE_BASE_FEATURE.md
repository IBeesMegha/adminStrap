# Knowledge Base Feature Documentation

## Overview

The Knowledge Base is an AI-powered feature that allows administrators to crawl websites, store their content, and use that data for intelligent Q&A interactions. This is Phase 1 of a comprehensive knowledge management system.

## Architecture

### Database Schema

```prisma
model KnowledgeSource {
  id           String          @id @default(cuid())
  name         String
  websiteUrl   String          @unique
  status       String          @default("pending")
  totalPages   Int             @default(0)
  lastCrawlAt  DateTime?
  errorMessage String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  pages        KnowledgePage[]
}

model KnowledgePage {
  id               String          @id @default(cuid())
  sourceId         String
  source           KnowledgeSource @relation(...)
  url              String
  pageTitle        String?
  textContent      String          @db.Text
  htmlContent      String          @db.Text
  contentLength    Int             @default(0)
  crawlStatus      String          @default("discovered")
  errorMessage     String?
  lastCrawledAt    DateTime?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
}
```

## Features

### 1. Website Crawling

**Intelligent Crawling Strategy:**
- Primary: Attempts to fetch `sitemap.xml` for comprehensive URL discovery
- Fallback: Homepage-based breadth-first crawling
- Limits: 100 pages max, 3 levels deep
- Same-domain restriction for security

**Content Extraction:**
- Page URL and title
- Visible text content (scripts, styles removed)
- Raw HTML content
- Content length tracking

**Crawling Configuration:**
```typescript
{
  maxPages: 100,     // Maximum pages to crawl
  maxDepth: 3,       // Maximum depth from starting page
  timeout: 30000,    // 30 second timeout per page
  delay: 500         // 500ms delay between requests
}
```

### 2. Knowledge Source Management

**CRUD Operations:**
- Create knowledge sources with name and URL
- Update source name
- Delete sources (cascades to pages)
- View detailed source information

**Status Tracking:**
- `pending` - Source created, not crawled yet
- `crawling` - Currently crawling
- `completed` - Crawling finished successfully
- `failed` - Crawling encountered errors

**Real-time Updates:**
- Status polling every 5 seconds
- Live crawl progress tracking
- Automatic UI updates

### 3. Chat Interface (Phase 1)

**Simple Keyword Search:**
```typescript
// Extract keywords from question
const keywords = question
  .toLowerCase()
  .replace(/[^\w\s]/g, '')
  .split(/\s+/)
  .filter(word => word.length > 3);

// Score each page
for (const page of pages) {
  let score = 0;
  for (const keyword of keywords) {
    score += countOccurrences(page.textContent, keyword);
  }
}

// Return top-ranked pages
```

**Response Format:**
```typescript
{
  answer: string;        // Formatted answer with snippets
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
    relevanceScore: number;
  }>;
}
```

## API Endpoints

### List Knowledge Sources
```http
GET /api/knowledge-base
Authorization: Required

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Company Docs",
      "websiteUrl": "https://example.com",
      "status": "completed",
      "totalPages": 42,
      "lastCrawlAt": "2024-01-15T10:30:00Z",
      "_count": { "pages": 42 }
    }
  ]
}
```

### Create Knowledge Source
```http
POST /api/knowledge-base
Authorization: Required
Content-Type: application/json

Body:
{
  "name": "Company Documentation",
  "websiteUrl": "https://example.com",
  "startCrawl": true  // Optional, triggers immediate crawl
}

Response:
{
  "success": true,
  "data": { ... },
  "message": "Knowledge source created and crawling started"
}
```

### Get Knowledge Source Details
```http
GET /api/knowledge-base/:id
Authorization: Required

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "name": "...",
    "websiteUrl": "...",
    "status": "completed",
    "pages": [
      {
        "id": "...",
        "url": "https://example.com/page1",
        "pageTitle": "Page 1",
        "textContent": "...",
        "contentLength": 1500,
        "crawlStatus": "crawled"
      }
    ]
  }
}
```

### Start/Re-Crawl
```http
POST /api/knowledge-base/:id/crawl
Authorization: Required

Response:
{
  "success": true,
  "message": "Crawling started"
}

Note: Returns 202 Accepted, crawling happens in background
```

### Chat with Knowledge Source
```http
POST /api/knowledge-base/:id/chat
Authorization: Required
Content-Type: application/json

Body:
{
  "question": "What services do you offer?"
}

Response:
{
  "success": true,
  "data": {
    "answer": "Based on the crawled content...",
    "sources": [...]
  }
}
```

### Update Knowledge Source
```http
PUT /api/knowledge-base/:id
Authorization: Required
Content-Type: application/json

Body:
{
  "name": "Updated Name"
}
```

### Delete Knowledge Source
```http
DELETE /api/knowledge-base/:id
Authorization: Required

Response:
{
  "success": true,
  "message": "Knowledge source deleted successfully"
}
```

## User Interface

### Navigation
```
Admin Panel
└── AI Agents (New Section)
    └── Knowledge Base
```

### Pages

**1. Knowledge Base List (`/admin/knowledge-base`)**
- Table view of all sources
- Columns: Name, URL, Status, Total Pages, Last Crawl, Actions
- Quick actions: View, Re-crawl, Delete
- Add button for new sources
- Status badges with icons
- Real-time status updates

**2. Add Knowledge Source (`/admin/knowledge-base/new`)**
- Form fields: Name, Website URL
- Two submit options:
  - "Save" - Create without crawling
  - "Save & Crawl" - Create and start crawling immediately
- URL validation
- Duplicate prevention
- Informational help text

**3. Knowledge Source Details (`/admin/knowledge-base/:id`)**
- Two tabs: Pages and Chat
- Header with:
  - Editable name
  - Website URL link
  - Re-crawl button
- Stats cards showing status, total pages, last crawl, crawled pages
- Error messages if applicable

**Pages Tab:**
- Search functionality
- Table of all crawled pages
- Columns: URL, Page Title, Content Length, Status, Last Updated
- Clickable URLs to visit pages
- Real-time search filtering

**Chat Tab:**
- Conversation interface
- Message history
- User and assistant messages
- Source citations with snippets
- Input field with send button
- Enter key support
- Loading states
- Empty state prompts

## Web Crawler Implementation

### File: `lib/web-crawler.ts`

**Key Functions:**

```typescript
// Main crawl function
export async function crawlWebsite(
  websiteUrl: string,
  options?: {
    maxPages?: number;
    maxDepth?: number;
  }
): Promise<CrawlResult>

// Fetch sitemap.xml
async function fetchSitemap(websiteUrl: string): Promise<string[]>

// Extract links from HTML
function extractLinks(html: string, baseUrl: string, baseDomain: string): string[]

// Crawl individual page
async function crawlPage(url: string, baseDomain: string): Promise<CrawledPage | null>

// URL utilities
function getBaseDomain(url: string): string
function normalizeUrl(url: string): string
function isSameDomain(url: string, baseDomain: string): boolean
```

**Crawler Features:**
- BFS (Breadth-First Search) traversal
- Duplicate URL prevention
- URL normalization (removes fragments, sorts params)
- Content-type validation (only HTML)
- Timeout handling (30s per page)
- User-Agent identification
- Binary file exclusion (images, PDFs, etc.)
- Admin/login path exclusion
- Error logging

**Sitemap Support:**
- Parses standard `<url><loc>` format
- Handles sitemap index files
- XML parsing with Cheerio
- Fallback to manual crawling

## Search Algorithm (Phase 1)

### Keyword Extraction
```typescript
const keywords = question
  .toLowerCase()
  .replace(/[^\w\s]/g, '')  // Remove special chars
  .split(/\s+/)              // Split on whitespace
  .filter(word => word.length > 3);  // Min 3 chars
```

### Relevance Scoring
```typescript
for (const page of pages) {
  const textContent = page.textContent.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    const occurrences = countOccurrences(textContent, keyword);
    score += occurrences;
  }
  
  if (score > 0) {
    results.push({ page, score });
  }
}

// Sort by score (highest first)
results.sort((a, b) => b.score - a.score);
```

### Snippet Extraction
```typescript
function extractSnippet(content: string, keywords: string[]): string {
  const sentences = content.split(/[.!?]+/);
  
  // Find sentence with most keyword matches
  let bestSentence = '';
  let maxMatches = 0;
  
  for (const sentence of sentences) {
    const matches = countKeywordMatches(sentence, keywords);
    if (matches > maxMatches) {
      maxMatches = matches;
      bestSentence = sentence;
    }
  }
  
  // Truncate if needed
  return bestSentence.length > 300
    ? bestSentence.substring(0, 297) + '...'
    : bestSentence;
}
```

### Answer Building
```typescript
function buildAnswer(results: SearchResult[], question: string): string {
  const topResults = results.slice(0, 3);
  
  let answer = `Based on the crawled content, I found the following relevant information:\n\n`;
  
  topResults.forEach((result, index) => {
    answer += `${index + 1}. From "${result.pageTitle}":\n`;
    answer += `   ${result.snippet}\n\n`;
  });
  
  answer += `\nFound ${results.length} relevant page(s) in total.`;
  
  return answer;
}
```

## Future Enhancements

### Phase 2: Document Support
- PDF parsing and indexing
- DOCX file processing
- File upload interface
- Document metadata extraction

### Phase 3: Advanced Search
- Vector embeddings (OpenAI, Sentence Transformers)
- Semantic search
- Hybrid search (keyword + semantic)
- PostgreSQL pgvector extension

### Phase 4: AI Integration
- LLM-powered answer generation
- Context-aware responses
- Multi-document synthesis
- Citation tracking

### Phase 5: Knowledge Management
- FAQ management interface
- Manual content curation
- Knowledge graph visualization
- Content versioning

### Phase 6: Multi-Source
- Aggregate multiple sources
- Cross-source search
- Source prioritization
- Conflict resolution

## Security Considerations

### Authentication & Authorization
- All endpoints require authentication via `verifyAuth` middleware
- JWT-based session management
- Permission checks for knowledge base access

### Input Validation
- URL format validation
- Duplicate URL prevention
- SQL injection prevention (Prisma ORM)
- XSS protection in UI

### Rate Limiting
- Crawl delay (500ms between requests)
- Page limit (100 pages max)
- Depth limit (3 levels max)
- Timeout protection (30s per page)

### Data Privacy
- No external API calls with content
- All data stored locally
- No user tracking in crawler
- Respect for robots.txt (future)

## Performance Optimization

### Database Indexes
```sql
CREATE INDEX idx_knowledge_pages_source_id ON knowledge_pages(source_id);
CREATE INDEX idx_knowledge_pages_url ON knowledge_pages(url);
CREATE INDEX idx_knowledge_sources_url ON knowledge_sources(website_url);
```

### Caching Strategy (Future)
- Redis for search results
- In-memory keyword cache
- CDN for static assets
- Query result caching

### Async Processing
- Background crawling (non-blocking)
- Batch page insertion
- Streaming responses
- Worker queues (future)

## Testing Recommendations

### Unit Tests
- URL normalization
- Keyword extraction
- Relevance scoring
- Snippet extraction

### Integration Tests
- API endpoint responses
- Database operations
- Authentication flow
- Error handling

### E2E Tests
- Complete crawl workflow
- Chat interaction
- Source management
- UI navigation

## Monitoring & Logging

### Metrics to Track
- Crawl success rate
- Average pages per source
- Chat response time
- Search accuracy
- Error frequency

### Logging Strategy
```typescript
console.log(`Starting crawl for source ${sourceId}: ${websiteUrl}`);
console.log(`Crawl completed: ${result.pages.length} pages`);
console.error('Error during crawl:', error);
```

## Troubleshooting Guide

### Common Issues

**1. Crawling Fails**
- Check website accessibility
- Verify HTTPS certificate
- Check for rate limiting
- Review error message in UI

**2. No Results in Chat**
- Ensure pages are crawled
- Check keyword extraction
- Verify search algorithm
- Review page content quality

**3. Slow Crawling**
- Check network speed
- Reduce maxPages limit
- Increase crawl delay
- Check target website speed

**4. Database Errors**
- Verify PostgreSQL connection
- Check schema migrations
- Review Prisma client generation
- Check disk space

## Best Practices

### For Administrators
1. Start with small websites for testing
2. Monitor crawl status regularly
3. Re-crawl periodically for updates
4. Use descriptive names for sources
5. Test chat before production use

### For Developers
1. Always handle errors gracefully
2. Log important events
3. Validate all user inputs
4. Use TypeScript types
5. Write comprehensive tests
6. Document code changes
7. Follow existing patterns

## Contributing

When extending this feature:
1. Follow existing code structure
2. Add TypeScript types
3. Update documentation
4. Write tests
5. Consider backward compatibility
6. Review security implications
