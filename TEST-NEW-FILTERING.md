# Test New Smart Filtering

## Quick Test Steps

### Step 1: Restart Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Go to Search Page
```
http://localhost:3000/admin/knowledge-base/search-test
```

---

## Test 1: Perfect Match (100%)

**Search for:** `4703 STATUTARIO LIGHT`

### Expected Results:

✅ **Green banner appears:**
```
🎯 Perfect Match Found!
Showing only exact matches (98%+ similarity). Other results filtered out.
```

✅ **Only 1 result shown:**
- #1 - 100.0% match (4703 STATUTARIO LIGHT)

✅ **Footer shows filtering:**
```
Showing 1 of 278 matches
```

✅ **Toast notification:**
```
🎯 Perfect match found!
```

---

## Test 2: Multiple High-Quality Matches

**Search for:** `white laminate`

### Expected Results:

❌ **No green banner** (no perfect match)

✅ **Only top results shown:**
- #1 - 68.5% match ✅
- #2 - 65.2% match ✅
- #3 - 62.1% match ✅
- #4 - 58.7% match ✅

❌ **Low matches NOT shown:**
- 40%, 35%, 32% - all filtered out

✅ **Footer shows filtering:**
```
Showing 4 of 95 matches (filtered to high-quality results)
```

---

## Test 3: Product Code (High Match)

**Search for:** `27552755`

### Expected Results:

✅ **If exact match found:**
- Green banner
- Only 1-2 results (98%+)

✅ **If no exact match:**
- Top 3-5 results
- All within 15% of best score
- Low matches filtered

---

## Test 4: Generic Query

**Search for:** `laminates`

### Expected Results:

✅ **Multiple results** (5-10 shown)

✅ **All high quality:**
- Best: ~60%
- Shown: 60%, 58%, 55%, 52%, 48%
- NOT shown: 35%, 30%, 25%

✅ **Quality threshold visible:**
```
Showing 8 of 180 matches (filtered to high-quality results)
```

---

## What Changed vs. Before

### Before (Your Previous Search):
```
Query: 4703 STATUTARIO LIGHT

#1 - 100.0% match ✅
#2 - 57.5% match ❌ (should be filtered)
#3 - 45.2% match ❌ (should be filtered)
...
Showing 10 of 278 matches
```

### After (New Smart Filtering):
```
Query: 4703 STATUTARIO LIGHT

🎯 Perfect Match Found!
#1 - 100.0% match ✅
Showing 1 of 278 matches
```

---

## Filtering Logic Summary

### Scenario 1: Perfect Match Found (≥98%)
```
Return ONLY perfect matches
Ignore everything else
```

### Scenario 2: No Perfect Match
```
Best score: 72%
Quality threshold: 72% - 15% = 57%

Results shown:
✅ 72% (above 57%)
✅ 68% (above 57%)
✅ 65% (above 57%)
✅ 60% (above 57%)
❌ 45% (below 57% - filtered)
❌ 32% (below 57% - filtered)
```

---

## Troubleshooting

### If you still see low-quality results:

**Check 1:** Server restarted?
```bash
# Make sure you stopped and started npm run dev
```

**Check 2:** Check browser console
```javascript
// Open DevTools (F12)
// Look for console logs like:
[SEARCH] Found X perfect match(es)
[SEARCH] Best score: Y%, quality threshold: Z%
```

**Check 3:** Hard refresh browser
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## Visual Indicators

### Perfect Match Mode:
- 🎯 Green banner at top
- "Perfect Match Found!" message
- Only 1-2 results shown
- High match percentages (98-100%)

### Quality Filtered Mode:
- No green banner
- Multiple results (3-10)
- All within ~15% of each other
- Message: "(filtered to high-quality results)"

### No Results:
- "No Results Found" message
- Suggestions to adjust query

---

## Quick Verification Checklist

Test the following searches and check results:

- [ ] `4703 STATUTARIO LIGHT` → Only 1 result (100%)
- [ ] `statutario` → Multiple results, all high %
- [ ] `white finish` → Multiple results, all high %
- [ ] `27552755` → 1-3 results, all high %
- [ ] `laminates` → 5-10 results, no 30-40% matches

If all pass: ✅ Smart filtering is working correctly!

---

## Next Steps

After confirming the filtering works:

1. **Test with various queries** to ensure quality
2. **Reprocess all pages** (from Documents page) for best results
3. **Adjust threshold if needed** (in Settings page: currently 0.25)

---

**Start testing now!** Follow Test 1 above with "4703 STATUTARIO LIGHT"
