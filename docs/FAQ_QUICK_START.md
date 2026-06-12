# FAQ Module - Quick Start Guide

## ✅ What Was Implemented

The FAQ Management module is now **fully integrated** with your AI Chatbot system.

### 🎯 Key Features

1. **FAQ Management Interface** (`/admin/ai-chatbot` → FAQ Management)
   - Create, Edit, Delete FAQs
   - Enable/Disable FAQs
   - Search and filter FAQs
   - Bulk import from CSV/JSON
   - Usage statistics tracking

2. **Hybrid Search System** (`/admin/knowledge-base/search-test`)
   - **Step 1:** Checks FAQs first (⚡ instant, < 100ms)
   - **Step 2:** Falls back to RAG if no FAQ match (2-3 seconds)
   - Automatic relevance scoring
   - Usage tracking for analytics

3. **Complete API Endpoints**
   - `GET /api/faq` - List all FAQs
   - `POST /api/faq` - Create FAQ
   - `PUT /api/faq/:id` - Update FAQ
   - `DELETE /api/faq/:id` - Delete FAQ
   - `POST /api/faq/bulk-import` - Bulk import
   - `POST /api/faq/search` - Search FAQs (chatbot)
   - `GET /api/faq/stats` - Get statistics

## 🚀 How to Use

### Step 1: Add Your First FAQ

1. Go to **AI Chatbot** → **FAQ Management**
2. Click **"+ Add FAQ"**
3. Fill in:
   - **Question:** "what is your name"
   - **Answer:** "my name is testu"
   - **Keywords:** "your name", "who are you" (optional but recommended)
   - **Status:** Active
   - **Priority:** 5 (higher = more important)
4. Click **"Create FAQ"**

### Step 2: Test the FAQ

1. Go to **AI Chatbot** → **Search Testing** (or visit `/admin/knowledge-base/search-test`)
2. Enter the query: **"what is your name"**
3. Click **"Search"**
4. You should see:
   - ✅ **Green "Instant Answer from FAQ" badge**
   - The answer: "my name is testu"
   - Response time: < 100ms
   - Relevance score displayed

### Step 3: Try a Non-FAQ Query

1. In the same search page, enter: **"tell me about quantum physics"**
2. Click **"Search"**
3. You should see:
   - ⚙️ Falls back to RAG search
   - Blue "AI Generated Answer" badge
   - Answer generated from knowledge base
   - Supporting sources shown

## 📊 Understanding the Results

### FAQ Match (Green Badge)
```
⚡ Instant Answer from FAQ
Relevance: 23

Matched Question: what is your name
This answer was retrieved instantly from your FAQ database...
```

**When you see this:**
- Response came from FAQ database
- No AI generation was used
- Response time: < 100ms
- Token cost: $0
- Relevance score shows match quality

### RAG Answer (Blue Badge)
```
AI Generated Answer
Retrieved from 10 chunks (searched 50 total)
```

**When you see this:**
- No FAQ matched the query
- AI generated answer from knowledge base
- Response time: 2-3 seconds
- Token cost: ~$0.001-0.01
- Supporting sources shown below

## 🎯 Relevance Score Explained

The FAQ relevance score determines if an FAQ is a good match:

| Score | Match Quality | Example |
|-------|--------------|---------|
| **20+** | Exact match | Query matches FAQ question exactly |
| **15-19** | Strong match | Query contains most of FAQ question |
| **10-14** | Good match | Several keywords match |
| **5-9** | Weak match | Few keywords match |
| **< 5** | No match | Falls back to RAG |

**Default Threshold:** 10 (adjustable in `search.ts`)

## 💡 Best Practices

### 1. Writing Effective FAQs

**✅ Good Question:**
```
"What is your refund policy?"
```
- Clear and direct
- Natural language
- How users would actually ask

**❌ Poor Question:**
```
"Refund"
```
- Too vague
- Not a complete question
- Hard to match

### 2. Adding Keywords

**For Question:** "What is your refund policy?"

**Good Keywords:**
- "refund"
- "money back"
- "return policy"
- "get refund"
- "cancel order"

**Why:** Captures different ways users might ask the same thing

### 3. Setting Priority

- **Priority 10:** Critical FAQs (company name, contact info)
- **Priority 5:** Important FAQs (pricing, refunds)
- **Priority 0:** General FAQs (less critical)

Higher priority FAQs get preference when multiple FAQs match.

### 4. Organizing with Categories

Examples:
- **Billing:** Payment, refunds, invoices
- **Account:** Login, password, profile
- **Technical:** Installation, errors, bugs
- **General:** Company info, hours, location

## 📈 Monitoring Performance

### View FAQ Statistics

**Location:** AI Chatbot → FAQ Management

**Metrics shown:**
- Total FAQs
- Active/Inactive count
- Total usage (how many times FAQs were matched)
- Individual FAQ usage counts

### What to Track

1. **FAQs with zero usage** → Consider removing or improving
2. **High usage FAQs** → Keep updated and prominent
3. **Failed searches** → Add new FAQs to cover gaps

## 🔧 Advanced Configuration

### Adjusting FAQ Threshold

**File:** `pages/api/knowledge-base/search.ts`

```typescript
const FAQ_THRESHOLD = 10; // Current default

// More aggressive FAQ matching
const FAQ_THRESHOLD = 5;  // More FAQs will match

// Conservative FAQ matching  
const FAQ_THRESHOLD = 15; // Only strong matches
```

### Skipping FAQ Search

To force RAG search (bypass FAQs):

```typescript
const response = await fetch('/api/knowledge-base/search', {
  method: 'POST',
  body: JSON.stringify({ 
    query: "your question",
    skipFAQ: true  // Skip FAQ search
  }),
});
```

## 🐛 Troubleshooting

### FAQ Not Matching

**Problem:** You search for "what is your name" but it goes to RAG

**Solutions:**
1. Check FAQ status is "Active"
2. Try exact question from FAQ
3. Add more keywords
4. Increase priority
5. Lower FAQ_THRESHOLD in code

### Wrong FAQ Matching

**Problem:** FAQ matches queries it shouldn't

**Solutions:**
1. Make question more specific
2. Remove broad keywords
3. Increase FAQ_THRESHOLD in code
4. Disable over-general FAQs

## 📦 Bulk Import Example

### CSV Format

Create `faqs.csv`:
```csv
question,answer,status,keywords,category,priority
"What is your refund policy?","We offer 30-day money-back guarantee",active,"refund|policy|money",Billing,5
"How do I reset password?","Click Forgot Password on login page",active,"password|reset|login",Account,3
```

### JSON Format

Create `faqs.json`:
```json
[
  {
    "question": "What is your refund policy?",
    "answer": "We offer 30-day money-back guarantee",
    "status": "active",
    "keywords": ["refund", "policy", "money"],
    "category": "Billing",
    "priority": 5
  }
]
```

### Import Steps

1. Go to FAQ Management
2. Click **"Bulk Import"**
3. Choose **"Upload File"** or **"Paste JSON"**
4. Click **"Import FAQs"**
5. Review import results

## 🎉 Success Indicators

You'll know the FAQ module is working when:

1. ✅ FAQ appears in FAQ Management table
2. ✅ Green "Instant Answer from FAQ" badge appears in search
3. ✅ Response time < 100ms for FAQ answers
4. ✅ Usage count increments when FAQ is matched
5. ✅ Falls back to RAG for non-FAQ queries

## 📚 Additional Resources

- **Full Documentation:** `docs/FAQ_MODULE.md`
- **Integration Guide:** `docs/FAQ_INTEGRATION_GUIDE.md`
- **API Reference:** See individual endpoint files in `pages/api/faq/`

## 🆘 Need Help?

1. Check browser console for errors
2. Check server logs for [FAQ] and [SEARCH] messages
3. Verify database migration ran successfully
4. Ensure Prisma client generated correctly

---

**Status:** ✅ Ready to Use  
**Version:** 1.0.0  
**Last Updated:** June 12, 2026
