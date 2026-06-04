# Quick Reprocessing Steps

## The Problem You're Experiencing

🔴 **Every search query returns the same 10 results**

**Root Cause:** All 121 chunks start with identical header text:
```
LaminatesCrafted for Creativity. Engineered for Endurance.Hanepellalaminatescolor...
```

This makes all embeddings similar, so search cannot distinguish between different content.

---

## The Solution (Follow These Steps)

### Step 1: Restart Your Server

```bash
# In your terminal, stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

**Why?** To load the new text cleaning algorithm that removes repeated headers.

---

### Step 2: Go to Documents Page

Open in browser:
```
http://localhost:3000/admin/knowledge-base/documents
```

You should see a table with all 121 pages.

---

### Step 3: Select All Pages

1. Look for the **checkbox in the table header** (top-left of the table)
2. Click it to select all 121 pages
3. All rows should now be highlighted/checked

---

### Step 4: Click "Process Selected"

1. Look for the **"Process Selected"** button (usually near the top)
2. Click it
3. You'll see a confirmation or progress indicator

**This will:**
- Clean the text using the new algorithm (removes repeated headers)
- Generate new chunks
- Create new embeddings
- Replace old chunks in the database

**Time:** ~5-10 minutes for 121 pages

---

### Step 5: Wait for Completion

Monitor the status column:
- ⏳ **"Processing"** - In progress
- ✅ **"Completed"** - Done

You can also check the **Processing Jobs** page to see progress:
```
http://localhost:3000/admin/knowledge-base/processing
```

---

### Step 6: Test Search

Go to Search Test page:
```
http://localhost:3000/admin/knowledge-base/search-test
```

**Try these different queries:**

1. Type: `brown walnut laminate` → Click Search
2. Type: `white finish` → Click Search  
3. Type: `textured surface` → Click Search
4. Type: `glossy design` → Click Search

**Expected Result:**
- ✅ Each query should return **DIFFERENT** top results
- ✅ Results should be sorted by similarity (highest % first)
- ✅ The content should actually match your search terms

---

## What Changed?

### ✅ Applied Fixes:

1. **Enhanced text cleaning** in `lib/knowledge-processing.ts`:
   - Removes "LaminatesCrafted for Creativity...Engineered for Endurance"
   - Removes repetitive "Design Name" patterns
   - Removes duplicate lines more aggressively
   - Each chunk will now start with unique content

2. **Updated similarity threshold**:
   - Changed from 0.05 → 0.15 (better for local embeddings)

3. **Search returns top matches**:
   - Results sorted by highest similarity first
   - No more diversity/round-robin logic

---

## Quick Checklist

- [ ] Restart Next.js server (`npm run dev`)
- [ ] Go to Documents page
- [ ] Click checkbox in table header (select all)
- [ ] Click "Process Selected" button
- [ ] Wait for all 121 pages to show "Completed" status
- [ ] Go to Search Test page
- [ ] Try 3-4 different queries
- [ ] Verify results are different for each query

---

## If It Still Doesn't Work

### Check chunk content in database:

```bash
# In PowerShell:
$env:PGPASSWORD='root'; psql -h localhost -p 5433 -U postgres -d testthree -c 'SELECT LEFT("chunkText", 200) FROM knowledge_chunks LIMIT 3;'
```

**What to look for:**
- ❌ Bad: Chunks still start with "LaminatesCrafted for Creativity"
  - → Server wasn't restarted properly
- ✅ Good: Chunks start with unique product-specific content
  - → Cleaning worked correctly

### Possible reasons for continued issues:

1. **Server not restarted** - Old code still running
2. **Pages not reprocessed** - Still using old chunks
3. **All pages have identical content** - Need more diverse sources
4. **Similarity threshold too low** - Adjust in Settings page

---

## Need Help?

See the full technical guide: **`SEARCH-QUALITY-FIX-GUIDE.md`**
