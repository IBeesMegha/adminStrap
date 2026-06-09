# Knowledge Base RAG System — Complete Flow

## Database Tables (4)

| Table | Model Name | Purpose |
|-------|-----------|---------|
| `knowledge_sources` | `KnowledgeSource` | Stores website sources (name, URL, crawl status, page/chunk counts) |
| `knowledge_pages` | `KnowledgePage` | Stores individual crawled pages (URL, title, cleaned text, status) |
| `knowledge_chunks` | `KnowledgeChunk` | Stores text chunks with 384-dim TF-IDF embeddings + section heading |
| `knowledge_settings` | `KnowledgeSettings` | Singleton config row (chunk size, overlap, model names, etc.) |

### Table Details

#### `knowledge_sources`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `name` | String | Display name for the source |
| `websiteUrl` | String (unique) | Root URL of the website |
| `status` | Enum | `pending` / `crawling` / `completed` / `failed` |
| `totalPages` | Int | Number of pages crawled |
| `totalChunks` | Int | Number of chunks after processing |
| `lastCrawlAt` | DateTime? | Last crawl timestamp |
| `errorMessage` | String? | Error details if failed |

#### `knowledge_pages`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `sourceId` | String (FK) | References `knowledge_sources.id` |
| `url` | String | Page URL (unique per source) |
| `pageTitle` | String? | Page title extracted from HTML |
| `textContent` | Text | Cleaned page text |
| `htmlContent` | Text | Raw HTML (kept for reprocessing) |
| `contentLength` | Int | Character count of textContent |
| `crawlStatus` | Enum | `discovered` / `crawled` / `failed` |
| `processingStatus` | Enum | `pending` / `processing` / `completed` / `failed` |

#### `knowledge_chunks`
| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `sourceId` | String (FK) | References `knowledge_sources.id` |
| `pageId` | String (FK) | References `knowledge_pages.id` |
| `chunkText` | Text | The actual text content |
| `chunkIndex` | Int | Position within the page (0-based) |
| `tokenCount` | Int | Word count of the chunk |
| `sectionHeading` | String? | Detected heading this chunk belongs to |
| `embedding` | Float[] | 384-dim TF-IDF vector (nomic-embed-text compatible) |

#### `knowledge_settings`
| Field | Default | Actually Used? |
|-------|---------|----------------|
| `chunkSize` | 500 words | Yes — controls chunk splitting |
| `chunkOverlap` | 50 words | Yes — overlap between chunks |
| `similarityThreshold` | 0.7 | No — dead field |
| `maxSearchResults` | 10 | No — dead field |
| `embeddingModel` | BAAI/bge-base-en-v1.5 | No — always uses local TF-IDF |
| `rerankerModel` | BAAI/bge-reranker-base | No — reranker is a stub |
| `llmModel` | Qwen/Qwen3-4B-Instruct-2507 | Yes — passed to HF Chat API / Groq |

---

## Processing Pipeline (Crawl → Chunk → Embed → Store)

```
Website URL
    ↓
[1] Sitemap Discovery
    │   ├── Try: {domain}/sitemap.xml
    │   └── Parse <url><loc> and <sitemap><loc> via cheerio
    ↓
[2] BFS Crawl (web-crawler.ts)
    │   ├── Start from discovered/root URLs
    │   ├── Max depth: 3, Max pages: 10,000
    │   ├── Filters: same domain, text/html, no binaries, no admin/login
    │   ├── 500ms delay between requests
    │   └── Extract text via cheerio (remove script/style/nav/header/footer)
    ↓
[3] Store Pages (KnowledgePage records, batch of 10)
    ↓
[4] Clean Text (cleanTextContent in knowledge-processing.ts)
    │   ├── Remove HTML tags, scripts, styles, URLs, emails
    │   ├── Remove navigation patterns (sidebars, menus, footers)
    │   ├── Deduplicate lines (exact + fuzzy via Jaccard > 90%)
    │   ├── Remove repeated words
    │   └── Minimum: 100 characters (otherwise skip)
    ↓
[5] Semantic Chunking (semanticChunkText)
    │   ├── Split lines, detect headings (3-120 chars, no sentence-ending punctuation)
    │   ├── Group content under each heading
    │   ├── If section > chunkSize (default 500 words), split further with overlap (50 words)
    │   └── Fallback: simple word-count chunking (85% similarity dedup) if no headings
    ↓
[6] Generate Embedding (generateLocalEmbedding — always local)
    │   ├── 384-dimension vector (nomic-embed-text compatible)
    │   ├── TF-IDF weighting with 8 hash functions per word
    │   ├── Character n-grams (bi- + tri-grams) for subword info
    │   ├── Position-based weighting (beginning words boosted)
    │   ├── Document-level features (word count, unique word ratio)
    │   ├── L2-normalized to unit length
    │   └── 100ms delay between chunks
    ↓
[7] Store Chunks (KnowledgeChunk records)
    ├── chunkText, chunkIndex, sectionHeading, embedding
    └── Update knowledge_sources.totalChunks count
```

---

## RAG Search Pipeline (runtime)

```
User Query (e.g. "What is the fee for BTech?")
    ↓
[1] Load All Chunks from DB (filtered by sourceId if provided)
    ↓
[2] BM25 Keyword Scoring (rag-service.ts)
    │   ├── Tokenize query (lowercase, remove non-alphanumeric, min 2 chars)
    │   ├── For EVERY chunk, compute BM25 score:
    │   │   ├── k1 = 1.5, b = 0.75
    │   │   ├── TF: term frequency in chunk / (1 - b + b * chunkLen/avgDocLen)
    │   │   ├── IDF: log(1 + (N - df + 0.5) / (df + 0.5))
    │   │   └── Bonus: exact query phrase match → score × 1.5
    │   └── Sort by descending score
    ↓
[3] Take Top vectorTopK (default 50) chunks
    ↓
[4] "Rerank" — actually just slice to rerankTopK (default 10)
    │   └── Real reranker (lib/reranker.ts) is a stub (pass-through)
    ↓
[5] Build Structured Context (buildContext)
    │   ├── Group chunks by pageId
    │   ├── Within each page, group by sectionHeading
    │   └── Format:
    │       Page: {pageTitle} ({url})
    │       Section: {heading}
    │       {chunk text}
    ↓
[6] LLM Answer Generation (llm-service.ts)
    │   ├── System prompt: strict context-only, no hallucination
    │   ├── User prompt: "Context:\n{context}\n\nQuestion:\n{query}"
    │   ├── Primary: HuggingFace Chat API (router.huggingface.co/v1/chat/completions)
    │   │   ├── Model: Qwen/Qwen3-4B-Instruct-2507 (from settings)
    │   │   ├── Temperature: 0.1, maxTokens: 1024
    │   │   └── Timeout: 60s
    │   ├── Fallback: Groq API (api.groq.com/openai/v1/chat/completions)
    │   │   ├── Model: llama-3.3-70b-versatile (mapped from HF name)
    │   │   └── Timeout: 25s
    │   └── If no info in context → "The requested information was not found in the knowledge base."
    ↓
[7] API Response
    {
      success: true,
      answer: "The BTech fee is...",
      supportingChunks: [...],   // source chunks for transparency
      totalRetrieved: 50,
      totalAfterRerank: 10
    }
```

---

## AI Models Used

| # | Model | What It Does | How It's Called | Status |
|---|-------|-------------|-----------------|--------|
| 1 | **Local TF-IDF** (384-dim) | Converts text to vector embedding for retrieval | `generateLocalEmbedding()` — hash-based TF-IDF with n-grams, position weighting, L2 normalization | Active |
| 2 | **Qwen/Qwen3-4B-Instruct-2507** | Generates natural language answer from retrieved context | `router.huggingface.co/v1/chat/completions` (OpenAI-compatible) with HUGGINGFACE_API_KEY | Active (primary) |
| 3 | **llama-3.3-70b-versatile** (via Groq) | Fallback LLM if HuggingFace times out | `api.groq.com/openai/v1/chat/completions` with GROQ_API_KEY | Active (fallback) |
| — | ~~BAAI/bge-base-en-v1.5~~ | Was supposed to be embedding model | Never called — local TF-IDF used instead | Dead |
| — | ~~BAAI/bge-reranker-base~~ | Was supposed to rerank chunks | Stub — returns top K with score 0 | Dead |

### Why Local TF-IDF Instead of Transformer Embeddings?

The HuggingFace Inference API's pipeline/feature-extraction endpoint is **not supported** on the new `router.huggingface.co` endpoint. The old `api-inference.huggingface.co` domain was decommissioned. Since we cannot call an external embedding model, we use a local hash-based TF-IDF vectorizer that produces 384-dim vectors (matching the dimension of the `nomic-embed-text` vectors already stored in the database).

### Why BM25 Instead of Cosine Similarity?

The database contains embeddings from `nomic-embed-text` (768-dim → later normalized to 384-dim), while query embeddings are produced by local TF-IDF. These come from **different models** with different vector spaces — cosine similarity between them is meaningless. BM25 is a pure text-based scoring algorithm that ignores embeddings entirely and works by direct keyword matching.

---

## Relationship Diagram

```
knowledge_sources (1)
    ├── knowledge_pages (many)
    │       └── knowledge_chunks (many) — stores 384-dim embedding
    └── referenced by knowledge_chunks.sourceId
                            
knowledge_settings (1) — singleton, controls chunkSize/chunkOverlap/llmModel
```

---

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/knowledge-base` | Create source (optionally start crawl) |
| `GET` | `/api/knowledge-base` | List all sources |
| `DELETE` | `/api/knowledge-base/:id` | Delete source and all its data |
| `POST` | `/api/knowledge-base/:id/crawl` | Crawl website |
| `POST` | `/api/knowledge-base/process` | Process pending pages → chunk + embed |
| `POST` | `/api/knowledge-base/search` | RAG search (query → BM25 → LLM → answer) |
| `GET/PUT` | `/api/knowledge-base/settings` | Read/update settings |
| `POST` | `/api/knowledge-base/:id/chat` | Simple keyword chat (no AI, no LLM) |

---

## Key Design Decisions

1. **Embedding is entirely local** — No external API call for embeddings. Uses a hash-based TF-IDF approach (384-dim). Semantic quality is limited compared to transformer models.

2. **No real reranking** — The reranker module is a pass-through stub. All ranking is done by BM25 in rag-service.ts.

3. **BM25 is the only retrieval algorithm** — Despite embeddings being stored in the DB, they are never used for retrieval. All scoring is keyword-based.

4. **All chunks loaded into memory** — The search loads every chunk for the selected source before scoring. Limits scalability for very large knowledge bases.

5. **Several settings are dead** — `similarityThreshold`, `maxSearchResults`, `embeddingModel`, and `rerankerModel` exist in DB/settings UI but are never referenced by code.

6. **HuggingFace → Groq fallback** — If HF router cold-starts slowly (60s timeout), Groq provides a fast alternative using `llama-3.3-70b-versatile`.

---

## Environment Variables Required

| Variable | Used For |
|----------|----------|
| `HUGGINGFACE_API_KEY` | Primary LLM chat (router.huggingface.co) |
| `GROQ_API_KEY` | Fallback LLM (api.groq.com) |
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Auth tokens |
| `JWT_REFRESH_SECRET` | Refresh tokens |
