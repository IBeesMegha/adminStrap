# AI Chatbot — Complete Workflow

## Database Tables Used

| Table | Model | Purpose |
|---|---|---|
| `knowledge_sources` | `KnowledgeSource` | Website/doc source being indexed |
| `knowledge_pages` | `KnowledgePage` | Individual crawled pages |
| `knowledge_chunks` | `KnowledgeChunk` | Text chunks with embeddings |
| `knowledge_media` | `KnowledgeMedia` | Images/media extracted from pages |
| `knowledge_settings` | `KnowledgeSettings` | Chunk size, model config |
| `faqs` | `FAQ` | Curated Q&A for instant matching |

---

## End-to-End Flow

### Phase 1: Data Ingestion

```
Admin adds a Website URL
        │
        ▼
[POST /api/knowledge-base] — creates KnowledgeSource record
        │
        ▼
[Web Crawler] lib/web-crawler.ts
  • Fetches sitemap.xml or starts BFS from homepage
  • Max 10,000 pages, depth 3
  • Removes boilerplate (nav, footer, scripts)
  • Extracts text, headings, tables, images
  • Stores KnowledgePage + KnowledgeMedia records
        │
        ▼
[Processing Pipeline] pages/api/knowledge-base/process.ts
  • Cleans text (dedup, noise removal)
  • Semantic chunking (heading-aware, 500 words/chunk, 50 overlap)
  • Generates local TF-IDF embeddings (384-dim)
  • Creates KnowledgeChunk records with embeddings
  • Links media to best-matching chunk (Jaccard > 0.2)
```

### Phase 2: Answering a Question

```
User asks: "What are the admission requirements?"
        │
        ▼
[POST /api/knowledge-base/search] — authMiddleware verifies JWT
        │
        ├── STEP 1: FAQ MATCHING (fast path)
        │   • Fetches all active FAQs from DB
        │   • Scores each against query:
        │     - Exact question match        +30
        │     - Query in question           +15
        │     - Keyword exact match         +25
        │     - Word overlap                +2/word
        │     - Priority bonus              +priority
        │   • If score ≥ 10 → return FAQ answer immediately
        │
        └── STEP 2: RAG PIPELINE (if no FAQ match)
                │
                ▼
        [BM25 Search] lib/rag-service.ts
          • Loads ALL chunks from DB (optionally filtered by sourceId)
          • BM25 scoring per chunk (k1=1.5, b=0.75)
          • 1.5x bonus if query appears verbatim
          • Takes top 50 chunks
                │
                ▼
        [Reranker] lib/reranker.ts
          • Currently a stub — just takes top 10
                │
                ▼
        [Media Retrieval] lib/media-service.ts
          • Path 1: Chunk-linked media (via chunkId FK)
          • Path 2: Text metadata search (title/alt/caption)
          • Merge, deduplicate, rank by relevance
                │
                ▼
        [Context Building]
          • Groups chunks by page → section heading
          • Format: "Page: <title>\nSection: <heading>\n\n<text>"
          • Appends image metadata to prompt
                │
                ▼
        [LLM Answer Generation] lib/llm-service.ts
          • System: "Use ONLY the provided context. Be concise."
          • User: Context + Question
          • Model: Qwen/Qwen3-4B-Instruct-2507 (HuggingFace)
          • Fallback: llama-3.3-70b-versatile (Groq)
          • Temperature: 0.1, Max tokens: 1024, Timeout: 70s
                │
                ▼
        Response: { answer, supportingChunks[], images[] }
```

---

## Models Used

| Stage | Model | Provider | Purpose |
|---|---|---|---|
| Embeddings | Local TF-IDF (384-dim) | Custom algorithm | Chunk vectorization |
| LLM (primary) | `Qwen/Qwen3-4B-Instruct-2507` | HuggingFace Inference API | Answer generation |
| LLM (fallback) | `llama-3.3-70b-versatile` | Groq API | Answer generation |
| Reranker | Stub (no-op) | — | Not yet implemented |

---

## Key Observations

1. **FAQ is checked first** — threshold ≥ 10 points. A single keyword match = 25 pts, so FAQs frequently short-circuit RAG.
2. **No vector similarity search at query time** — BM25 is computed live against ALL chunks. Stored embeddings are not used for cosine similarity retrieval.
3. **Reranker is a stub** — always returns score 0; top 10 from BM25 are used as-is.
4. **HuggingFace is primary** — falls back to Groq only if HuggingFace fails or env var is missing.
5. **Temperature 0.1** — very low, optimized for factual answers from provided context.
