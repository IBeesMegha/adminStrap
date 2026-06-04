# Knowledge Base - Quick Start Guide

Get your semantic search pipeline up and running in 5 minutes.

## Prerequisites

- ✅ PostgreSQL database running
- ✅ Node.js and npm installed
- ✅ Groq API key (free at https://console.groq.com/)

## Step 1: Environment Setup

Add your Groq API key to `.env`:

```bash
# Copy from .env.example if needed
cp .env.example .env

# Edit .env and add:
GROQ_API_KEY="your-groq-api-key-here"
```

## Step 2: Database Migration

Run the migration to create the necessary tables:

```bash
npx prisma migrate dev
```

This creates:
- `knowledge_sources` - Stores website sources
- `knowledge_pages` - Stores crawled pages
- `knowledge_chunks` - Stores text chunks with embeddings
- `knowledge_settings` - Stores configuration

## Step 3: Start the Application

```bash
npm run dev
```

## Step 4: Add Your First Knowledge Source

1. Navigate to http://localhost:3000/admin/knowledge-base
2. Click **"Add Knowledge Source"**
3. Fill in:
   - **Name:** "My Company Website"
   - **Website URL:** "https://example.com"
   - **Check:** "Start crawling immediately"
4. Click **"Create"**

**What happens now:**
- ✅ System crawls the website (sitemap-first approach)
- ✅ Extracts text content from pages
- ✅ Stores in `knowledge_pages` table
- ✅ Auto-triggers content processing

## Step 5: Monitor Processing

Navigate to **Processing Jobs** page:
http://localhost:3000/admin/knowledge-base/processing

You'll see:
- 📊 Total pages crawled
- ⏳ Pages pending processing
- ✅ Completed processing
- 📈 Pipeline progress bars
- 🔄 Real-time activity log

**Processing includes:**
1. **Text Cleaning** - Remove HTML, scripts, whitespace
2. **Chunking** - Split into ~800-word chunks with 100-word overlap
3. **Embeddings** - Generate vector embeddings via Groq API

**Time estimate:** ~5-10 seconds per page

## Step 6: Test Semantic Search

Navigate to **Search Testing** page:
http://localhost:3000/admin/knowledge-base/search-test

1. Enter a natural language query:
   ```
   "What products do you offer?"
   ```

2. Click **"Search"**

3. Review results:
   - ✅ Similarity scores (70%+ is good)
   - ✅ Relevant content chunks
   - ✅ Source attribution
   - ✅ Direct links to pages

## Step 7: View Documents

Navigate to **Documents** page:
http://localhost:3000/admin/knowledge-base/documents

Here you can:
- ✅ View all crawled pages
- ✅ See processing status
- ✅ Check chunk counts
- ✅ Reprocess individual pages
- ✅ Filter by source

## Step 8: Adjust Settings (Optional)

Navigate to **Settings** page:
http://localhost:3000/admin/knowledge-base/settings

Customize:
- **Chunk Size:** 800 words (default)
- **Chunk Overlap:** 100 words (default)
- **Similarity Threshold:** 0.7 (default)
- **Max Search Results:** 10 (default)

**Note:** Changes to chunk size require reprocessing pages.

## Navigation Structure

```
Knowledge Base (Home)
├── Sources (Main page)
├── Documents (All crawled pages)
├── Search Testing (Test retrieval quality)
├── Processing Jobs (Monitor pipeline)
└── Settings (Configure parameters)
```

## Common Workflows

### Workflow 1: Add a New Website

1. Go to **Sources**
2. Click "Add Knowledge Source"
3. Enter website URL
4. Check "Start crawling immediately"
5. Monitor in **Processing Jobs**
6. Test in **Search Testing**

### Workflow 2: Reprocess Content

**Scenario:** You changed chunk size in settings

1. Go to **Documents**
2. Find pages to reprocess
3. Click reprocess icon (↻)
4. Monitor in **Processing Jobs**

### Workflow 3: Test Search Quality

1. Go to **Search Testing**
2. Try different queries
3. Check similarity scores
4. If scores too low:
   - Go to **Settings**
   - Lower similarity threshold
   - Save and test again

## API Usage (For Developers)

### Search API

```javascript
const response = await fetch('/api/knowledge-base/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What are your business hours?',
    limit: 10
  })
});

const { results } = await response.json();
// results = [{ chunkText, similarity, pageTitle, pageUrl, ... }]
```

### Process API

```javascript
// Process all pending pages
await fetch('/api/knowledge-base/process', {
  method: 'POST'
});

// Process specific source
await fetch('/api/knowledge-base/process?sourceId=clxx123', {
  method: 'POST'
});

// Process specific page
await fetch('/api/knowledge-base/process?pageId=clxx456', {
  method: 'POST'
});
```

## Troubleshooting

### ❌ No results in search

**Check:**
1. Are pages processed? → **Documents** page
2. Are embeddings generated? → **Processing Jobs** page
3. Is threshold too high? → **Settings** page (lower to 0.6-0.65)

### ❌ Processing failed

**Check:**
1. Is `GROQ_API_KEY` set in `.env`?
2. Is API key valid?
3. Check error message in **Documents** page

### ❌ Crawling failed

**Check:**
1. Is website URL accessible?
2. Does it have a sitemap.xml?
3. Check error message in **Sources** page

## Performance Tips

### For Small Knowledge Bases (<100 pages)

Use defaults:
```
Chunk Size: 800 words
Chunk Overlap: 100 words
Similarity Threshold: 0.7
```

### For Large Knowledge Bases (100-1000 pages)

Consider:
```
Chunk Size: 1000 words (fewer chunks)
Chunk Overlap: 50 words (less redundancy)
Similarity Threshold: 0.75 (more precise)
```

### For High-Precision Use Cases (Legal, Medical)

Use:
```
Chunk Size: 600 words (more granular)
Chunk Overlap: 150 words (better context)
Similarity Threshold: 0.85 (strict matching)
```

## Next Steps

Now that your semantic search is working:

1. **Integrate with Chat/AI:**
   - Use search results as context for LLM
   - Implement RAG (Retrieval-Augmented Generation)

2. **Add More Sources:**
   - Crawl documentation sites
   - Add blog content
   - Include support articles

3. **Monitor Quality:**
   - Track search queries
   - Analyze similarity distributions
   - Identify content gaps

4. **Scale Up:**
   - Add more websites
   - Implement scheduled re-crawling
   - Consider pgvector for larger deployments

## Getting Help

- **Full Documentation:** `docs/KNOWLEDGE-BASE-SEMANTIC-SEARCH.md`
- **API Reference:** See API endpoints in main docs
- **Issues:** Check error messages in Processing Jobs page

## Summary

You now have a complete semantic search pipeline:

✅ Website crawling  
✅ Content processing  
✅ Embedding generation  
✅ Semantic search  
✅ Quality testing interface  
✅ Processing monitoring  
✅ Configurable settings  

**Ready for production!** 🚀

---

**Guide Version:** 1.0  
**Last Updated:** 2026-06-04
