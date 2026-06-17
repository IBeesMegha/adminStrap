# AI Agent Workflow Documentation

## Overview
The AI Agent system processes web content and answers user queries using a Retrieval-Augmented Generation (RAG) pipeline combined with Language Models.

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| **KnowledgeSource** | Stores website URLs and metadata (status, crawl count, last crawl date) |
| **KnowledgePage** | Stores individual crawled pages with HTML and text content |
| **KnowledgeChunk** | Stores text chunks with embeddings for vector search |
| **KnowledgeSettings** | Configuration for chunking, embedding model, LLM model, and reranker |
| **FAQ** | Pre-made Q&A pairs for quick responses |

---

## Workflow Steps

### 1. **Web Crawling** (`web-crawler.ts`)
- Crawl website URLs added to `KnowledgeSource`
- Extract page content and normalize URLs
- Store pages in `KnowledgePage` table
- Set status: `pending` → `discovered` → `crawled`

### 2. **Content Processing** (`knowledge-processing.ts`)
- Extract meaningful content from HTML (remove noise: nav, headers, footers, scripts)
- Split content into chunks based on `chunkSize` and `chunkOverlap` from `KnowledgeSettings`
- Count tokens for each chunk
- Extract sections and metadata

### 3. **Embedding Generation**
- Generate vector embeddings for each chunk using configured embedding model (default: `BAAI/bge-base-en-v1.5`)
- Store embeddings in `KnowledgeChunk.embedding` field
- Store chunk text, index, and section heading

### 4. **Query Processing** (`rag-service.ts`)
**Step 4a - Vector Search:**
- Convert user query to vector embedding
- Search `KnowledgeChunk` table using similarity threshold (`KnowledgeSettings.similarityThreshold`)
- Retrieve top K results (`KnowledgeSettings.maxSearchResults`)

**Step 4b - Reranking:**
- Rerank retrieved chunks using reranker model (default: `BAAI/bge-reranker-base`)
- Filter based on relevance score
- Keep top chunks after reranking

### 5. **Answer Generation** (`llm-service.ts`)
- Pass reranked chunks as context to LLM
- Use configured LLM model (default: `Qwen/Qwen3-8B-Instruct`)
- Support fallback: HuggingFace API → Groq API
- Generate coherent answer using only provided context

### 6. **Response**
- Return answer with supporting chunks
- Track usage statistics
- Cache if applicable

---

## Configuration Storage (KnowledgeSettings)
```
- chunkSize: 500 (words per chunk)
- chunkOverlap: 50 (overlap between chunks)
- similarityThreshold: 0.7 (minimum relevance score)
- maxSearchResults: 10 (initial retrieval count)
- embeddingModel: "BAAI/bge-base-en-v1.5"
- llmModel: "Qwen/Qwen3-8B-Instruct"
- rerankerModel: "BAAI/bge-reranker-base"
```

---

## Data Flow Diagram
```
Website URL
    ↓
[Web Crawler] → KnowledgePage (raw HTML & text)
    ↓
[Content Processor] → Split & Extract sections
    ↓
[Embedding Generator] → KnowledgeChunk (with vectors)
    ↓
User Query
    ↓
[Vector Search] → Find similar chunks
    ↓
[Reranker] → Sort by relevance
    ↓
[LLM Service] → Generate Answer
    ↓
Response with Supporting Chunks
```

---

## Key Services

| Service | File | Function |
|---------|------|----------|
| Web Crawler | `web-crawler.ts` | Crawl websites and extract content |
| Content Processor | `knowledge-processing.ts` | Extract, chunk, and process content |
| RAG Search | `rag-service.ts` | Retrieve relevant chunks for query |
| LLM | `llm-service.ts` | Generate answers using AI models |
| Reranker | `reranker.ts` | Re-score and filter chunks by relevance |

---

## API Keys Required
- `HUGGINGFACE_API_KEY` - For embeddings and LLM (primary)
- `GROQ_API_KEY` - For LLM fallback (if HuggingFace fails)

---

## Status States

**KnowledgeSource Status:**
- `pending` → `crawling` → `completed` / `error`

**KnowledgePage Status:**
- `discovered` → `crawled` / `error`
- Processing: `pending` → `processed` / `error`

**FAQ Status:**
- `active` / `inactive`
