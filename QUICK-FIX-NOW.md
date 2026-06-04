# Quick Fix - Test Right Now

## Your Problem
Searched **"4703 STATUTARIO LIGHT"** → Got wrong products (OCCER LIGHT, CHESTNUT, MARBLE, etc.)

## What I Just Fixed
✅ Added **text match boosting** to search - exact product codes now rank at the top
✅ Increased **similarity threshold** from 0.15 → 0.25 to reduce false matches

## Test It Right Now

### Step 1: Restart Your Server
```bash
# In your terminal, press Ctrl+C to stop server
# Then restart:
npm run dev
```

### Step 2: Go to Search Test Page
```
http://localhost:3000/admin/knowledge-base/search-test
```

### Step 3: Search Again
Type in search box: **4703 STATUTARIO LIGHT**

Click "Search"

### Step 4: Check Results

**What you should see NOW:**

✅ **Fewer total matches** (maybe 50-150 instead of 302)
✅ **Higher match % for correct product** (60-90% instead of 34%)
✅ **Correct product in top 5 results** (even if not #1)

The exact match will get a **+40% boost** to its score, pushing it higher than products that only have vague similarity.

---

## After Testing

If the hybrid search works better, then proceed with **reprocessing all pages** for even better results:

1. Go to `/admin/knowledge-base/documents`
2. Select all (checkbox in table header)
3. Click "Process Selected"
4. Wait 5-10 minutes
5. Test search again

Reprocessing will remove the repeated headers, making the semantic part of the search work better too.

---

## Quick Diagnosis

**If it still doesn't work after restarting:**

Check if product exists in database:
```bash
$env:PGPASSWORD='root'; psql -h localhost -p 5433 -U postgres -d testthree -c "SELECT COUNT(*) FROM knowledge_chunks WHERE \"chunkText\" ILIKE '%4703%STATUTARIO%';"
```

- If **COUNT = 0**: Product not in your crawled pages (need to crawl that page)
- If **COUNT > 0**: Should work with hybrid search

---

## What Changed in the Code

**File:** `pages/api/knowledge-base/search.ts`

**New logic:**
1. Detects if query has numbers (product code detection)
2. For each chunk, checks if chunk text contains the exact search phrase
3. If exact match: adds +0.4 to similarity score
4. If partial match: adds +0.3 proportional boost
5. Sorts by boosted similarity

**Result:** Exact matches always rank higher than vague matches.

---

## Expected Behavior Examples

| Query | Expected Top Result | Why |
|-------|-------------------|-----|
| `4703 STATUTARIO LIGHT` | 4703 STATUTARIO LIGHT | Exact product code match (+0.4 boost) |
| `statutario` | Products with "statutario" | Partial text match (+0.2-0.3 boost) |
| `light marble` | Marble products with "light" | Semantic + text match |
| `white finish` | White products | Semantic similarity |

---

**ACTION:** Restart server NOW and test the search!
