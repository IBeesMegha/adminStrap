# Search Quality Fix Guide

## Problem Identified

Your semantic search is returning the same 10 results for every query because **all 121 chunks start with identical header text**:

```
LaminatesCrafted for Creativity. Engineered for Endurance.Hanepellalaminatescolor...
```

When chunks have identical beginnings, their embeddings become very similar, making it impossible for the search to distinguish between different content.

## Solution Applied

### 1. Enhanced Text Cleaning (`lib/knowledge-processing.ts`)

**New aggressive cleaning features:**
- Removes the specific repeated header: "LaminatesCrafted for Creativity...Engineered for Endurance"
- Removes repetitive "Design Name" patterns
- Removes long sequences of product codes and numbers
- Uses fingerprinting to detect and remove duplicate lines more effectively
- Removes repeated words (e.g., "Name Name Name" → "Name")

### 2. Updated Similarity Threshold

Changed from **0.05** to **0.15** for better results with local TF-IDF embeddings.

The optimal threshold for local embeddings is typically:
- **0.15-0.25** = Good balance
- Below 0.15 = Too many irrelevant results
- Above 0.30 = Too strict, may miss relevant results

### 3. Search Returns Pure Top Matches

The search API now defaults to **`diversify: false`**, meaning results are sorted purely by similarity score (highest first), not by page diversity.

## CRITICAL NEXT STEPS

**You MUST reprocess all 121 pages** to apply the new cleaning algorithm.

### How to Reprocess All Pages:

1. **Restart your Next.js development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Start it again
   npm run dev
   ```

2. **Go to the Documents page:**
   - Navigate to: `/admin/knowledge-base/documents`

3. **Select all pages:**
   - Click the checkbox in the table header to select all 121 pages

4. **Click "Process Selected":**
   - This will reprocess all pages with the new cleaning algorithm
   - Watch the progress - it will take approximately **5-10 minutes**

5. **Wait for completion:**
   - Status will change from "Processing" → "Completed"
   - You can monitor progress on the Processing Jobs page

6. **Test the search:**
   - Go to: `/admin/knowledge-base/search-test`
   - Try different product-related queries:
     - "brown emilia walnut"
     - "white laminates"
     - "textured finish"
     - "glossy surface"
   - Results should now be different for each query

## How to Verify It's Working

### Before Reprocessing (Current State):
- ❌ Same 10 results for every query
- ❌ All chunks start with identical text
- ❌ Similarity scores very close together (e.g., 35%, 34%, 33%)

### After Reprocessing (Expected State):
- ✅ Different results for different queries
- ✅ Chunks have unique content (no repeated header)
- ✅ Similarity scores vary more significantly
- ✅ Top results actually match your query terms

## Example Test Queries

After reprocessing, test with these queries to verify diversity:

1. **"brown walnut laminate"** - Should return brown/walnut products
2. **"white finish"** - Should return white products
3. **"textured surface"** - Should return textured laminates
4. **"glossy design"** - Should return glossy products
5. **"oak wood"** - Should return oak-related products

Each query should return **different** top results.

## Troubleshooting

### If results are still the same after reprocessing:

1. **Check chunk content in database:**
   ```sql
   SELECT LEFT("chunkText", 200) FROM knowledge_chunks LIMIT 5;
   ```
   - The text should NOT start with "LaminatesCrafted for Creativity"
   - Each chunk should have unique content

2. **Verify embeddings are different:**
   ```sql
   SELECT id, embedding[1:5] FROM knowledge_chunks LIMIT 5;
   ```
   - The first 5 dimensions should be different for each chunk

3. **Check if pages have diverse content:**
   - If all 121 pages from virgo.com have nearly identical text (just product names changed)
   - Consider crawling additional sources with more diverse content
   - Or crawl detailed product pages instead of listing pages

### If similarity threshold needs adjustment:

You can adjust in the Settings page or via SQL:

```sql
-- For more results (lower bar)
UPDATE knowledge_settings SET "similarityThreshold" = 0.10;

-- For stricter results (higher bar)
UPDATE knowledge_settings SET "similarityThreshold" = 0.25;
```

## Technical Details

### Local TF-IDF Embedding Features:
- 384 dimensions (matches Hugging Face model)
- Uses 8 hash functions for better word differentiation
- Character trigrams for specificity
- Word bigrams and trigrams for context
- Position-based weighting (beginning words weighted higher)
- Content-specific noise for uniqueness
- TF-IDF weighting (rare words matter more)

### Why Local Embeddings?
- You encountered network errors with Hugging Face API
- Local embeddings work completely offline
- With proper text cleaning, they provide decent search quality
- Fast generation (no API calls)

## Future Improvements

If you want even better search quality:

1. **Fix network issues and use Hugging Face API:**
   - The API produces better semantic embeddings
   - Set `HUGGINGFACE_API_KEY` in `.env`
   - System will automatically try API first, fallback to local

2. **Crawl more diverse content:**
   - Product specification pages
   - Technical documentation
   - Installation guides
   - Different manufacturer websites

3. **Adjust chunk size:**
   - Current: 800 words with 100 word overlap
   - Larger chunks (1000-1500 words) = More context per chunk
   - Smaller chunks (400-600 words) = More precise matching

## Summary

✅ **Completed:**
- Enhanced text cleaning with aggressive header removal
- Updated similarity threshold to 0.15
- Search now returns pure top matches (not diversified)

⚠️ **Required Action:**
1. Restart Next.js server
2. Go to Documents page
3. Select All → Process Selected
4. Wait 5-10 minutes
5. Test search with different queries

🎯 **Expected Outcome:**
Different queries return different results, sorted by relevance.
