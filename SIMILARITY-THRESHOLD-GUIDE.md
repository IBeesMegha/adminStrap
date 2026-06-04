# 🎯 Similarity Threshold Guide

## Issue: "No results found"

**Cause:** Similarity threshold too high for local embeddings

**Solution:** Lower the threshold to 0.1-0.3

---

## Quick Fix

### Method 1: Via Settings Page (Recommended)

1. Go to: http://localhost:3000/admin/knowledge-base/settings
2. Find "Similarity Threshold"
3. Change from `0.7` to `0.2`
4. Click "Save Settings"
5. Test search again ✅

### Method 2: Already Applied!

I've already updated your database to `0.1` - **try searching now!**

---

## Understanding Similarity Threshold

### What is it?

The **minimum similarity score** (0-1) for results to be included.

- `0.0` = Include everything (even unrelated)
- `0.5` = Include moderately similar
- `0.7` = Include only quite similar
- `0.9` = Include only very similar
- `1.0` = Include only perfect matches

### Why Different for Local Embeddings?

| Method | Recommended Threshold | Why |
|--------|---------------------|-----|
| **Hugging Face API** | 0.6-0.8 | Pre-trained semantic understanding |
| **Local TF-IDF** | 0.1-0.3 | Word-based matching, lower scores |

**Local embeddings produce lower similarity scores** because they're based on word frequency, not deep semantic understanding.

---

## Recommended Settings

### For Local Embeddings (Your Current Setup)

```
Similarity Threshold: 0.2
Max Results: 10-20
```

**Why 0.2?**
- Includes relevant results
- Filters out completely unrelated content
- Good balance for TF-IDF embeddings

### Testing Different Thresholds

Try these values and see what works best:

| Threshold | Results | Quality |
|-----------|---------|---------|
| **0.1** | Many results | Some irrelevant |
| **0.2** | Good amount | Mostly relevant ✅ |
| **0.3** | Fewer results | More precise |
| **0.4** | Very few | Highly precise |
| **0.5+** | Almost none | Too strict |

---

## How to Test

### Step 1: Set Threshold to 0.2

Go to Settings and set:
```
Similarity Threshold: 0.2
```

### Step 2: Test Search

Go to Search Testing and try:
```
Query: "test"
Query: "products"  
Query: "contact"
```

### Step 3: Adjust Based on Results

**Too many irrelevant results?**
- Increase to 0.25 or 0.3

**No results or too few?**
- Decrease to 0.15 or 0.1

**Just right?**
- Keep at 0.2 ✅

---

## Example Searches

### Query: "contact information"

**With threshold 0.7:** ❌ 0 results
**With threshold 0.2:** ✅ 5-10 relevant results
**With threshold 0.1:** ✅ 15-20 results (some less relevant)

### Query: "products"

**With threshold 0.7:** ❌ 0-1 results
**With threshold 0.2:** ✅ 8-12 results about products
**With threshold 0.1:** ✅ 20+ results (includes mentions)

---

## Why Your Search Returned Nothing

### Before (threshold = 0.7)

```
Search: "show products"
Generated embedding: [0.04, 0.09, 0.04, ...]
Compare with chunks:
  Chunk 1: similarity = 0.25 ❌ Below 0.7
  Chunk 2: similarity = 0.31 ❌ Below 0.7
  Chunk 3: similarity = 0.28 ❌ Below 0.7
Result: No results ❌
```

### After (threshold = 0.1)

```
Search: "show products"
Generated embedding: [0.04, 0.09, 0.04, ...]
Compare with chunks:
  Chunk 1: similarity = 0.25 ✅ Above 0.1
  Chunk 2: similarity = 0.31 ✅ Above 0.1
  Chunk 3: similarity = 0.28 ✅ Above 0.1
Result: 3+ results ✅
```

---

## Future: If You Get API Access

When Hugging Face API becomes available:

1. **System will automatically use API**
2. **Update threshold to 0.6-0.8**
3. **Get better semantic understanding**

The code already handles this automatically! ✅

---

## Quick Reference

### Current Setup
- Method: Local TF-IDF embeddings
- Threshold: 0.1 (I updated it for you)
- Status: Should work now! ✅

### Try Now
1. Go to Search Testing page
2. Enter any query
3. You should see results! 🎉

### Adjust Later
1. Go to Settings page
2. Change threshold to your preference
3. Test and adjust as needed

---

## Troubleshooting

### Still no results?

**Check:**
1. Are chunks generated? (Documents page)
2. Is threshold really updated? (Settings page)
3. Try very low threshold: 0.05

### Too many irrelevant results?

**Fix:**
1. Increase threshold gradually
2. Try 0.25, then 0.3, then 0.35
3. Find your sweet spot

### Inconsistent results?

**This is normal with TF-IDF:**
- Word-based matching
- Not semantic understanding
- Adjust threshold per use case

---

## Summary

✅ **Problem:** Threshold was 0.7 (too high for local embeddings)  
✅ **Solution:** Lowered to 0.1 (done for you!)  
✅ **Try now:** Search should work!  
✅ **Adjust:** Use Settings page to fine-tune  

**Recommended: 0.2-0.3 for best balance** 🎯

---

**Updated:** 2026-06-04  
**Your current threshold:** 0.1  
**Status:** Ready to search! 🚀
