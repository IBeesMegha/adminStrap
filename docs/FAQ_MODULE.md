# FAQ Management Module

## Overview

The FAQ Management module provides a complete system for managing frequently asked questions for the AI Chatbot. FAQs serve as the first layer of response before the chatbot searches the knowledge base, providing faster and more accurate responses for common questions.

## Features

### ✅ Complete CRUD Operations
- **Add FAQ** - Create new FAQs with rich details
- **Edit FAQ** - Update existing FAQs
- **Delete FAQ** - Remove FAQs with confirmation
- **Enable/Disable FAQ** - Toggle FAQ status without deleting

### 🔍 Advanced Search & Filtering
- **Full-text search** - Search across questions, answers, and keywords
- **Status filter** - Filter by Active/Inactive status
- **Category filter** - Organize FAQs by categories
- **Pagination** - Efficiently browse large FAQ collections

### 📊 Statistics & Analytics
- **Total FAQs** - Track the number of FAQs
- **Active/Inactive count** - Monitor FAQ status distribution
- **Usage tracking** - See which FAQs are matched most often
- **Category breakdown** - Understand FAQ organization

### 📥 Bulk Import
- **CSV Import** - Upload FAQs via CSV file
- **JSON Import** - Paste or upload JSON data
- **Template Download** - Get CSV and JSON templates
- **Validation** - Automatic validation with error reporting

## Database Schema

```prisma
model FAQ {
  id          String   @id @default(cuid())
  question    String   @db.Text
  answer      String   @db.Text
  status      String   @default("active") // active, inactive
  usageCount  Int      @default(0) // Track how many times this FAQ was matched
  keywords    String[] // Keywords for better matching
  category    String?  // Optional category for organization
  priority    Int      @default(0) // Higher priority FAQs shown first
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([category])
  @@index([priority])
  @@map("faqs")
}
```

## API Endpoints

### 1. List FAQs with Search & Filtering
```
GET /api/faq?page=1&limit=10&search=refund&status=active&category=Billing
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for questions, answers, and keywords
- `status` - Filter by status (active/inactive)
- `category` - Filter by category
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "stats": {
    "totalFaqs": 45,
    "totalUsage": 234
  },
  "categories": ["Billing", "Account", "Technical"]
}
```

### 2. Create FAQ
```
POST /api/faq
```

**Request Body:**
```json
{
  "question": "What is your refund policy?",
  "answer": "We offer a 30-day money-back guarantee",
  "status": "active",
  "keywords": ["refund", "policy", "money"],
  "category": "Billing",
  "priority": 5
}
```

### 3. Update FAQ
```
PUT /api/faq/:id
```

**Request Body:** (all fields optional)
```json
{
  "question": "Updated question?",
  "answer": "Updated answer",
  "status": "inactive",
  "keywords": ["new", "keywords"],
  "category": "Account",
  "priority": 3
}
```

### 4. Delete FAQ
```
DELETE /api/faq/:id
```

### 5. Get FAQ by ID
```
GET /api/faq/:id
```

### 6. Bulk Import FAQs
```
POST /api/faq/bulk-import
```

**Request Body:**
```json
{
  "faqs": [
    {
      "question": "Question 1?",
      "answer": "Answer 1",
      "status": "active",
      "keywords": ["keyword1", "keyword2"],
      "category": "Category1",
      "priority": 5
    },
    ...
  ]
}
```

### 7. Search FAQs (Chatbot Endpoint)
```
POST /api/faq/search
```

**Request Body:**
```json
{
  "query": "How do I reset my password?",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "question": "How do I reset my password?",
      "answer": "Click on Forgot Password on the login page",
      "relevanceScore": 23,
      ...
    }
  ],
  "matched": true
}
```

### 8. Get FAQ Statistics
```
GET /api/faq/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalFaqs": 50,
      "activeFaqs": 45,
      "inactiveFaqs": 5,
      "totalUsage": 234
    },
    "topFaqs": [...],
    "faqsByCategory": [...],
    "recentFaqs": [...]
  }
}
```

## UI Components

### 1. AddFAQModal
Location: `components/admin/AddFAQModal.tsx`

**Features:**
- Create and edit FAQs
- Rich text editing for questions and answers
- Keyword management with tag interface
- Category and priority configuration
- Status selection (Active/Inactive)
- Form validation

### 2. BulkImportFAQModal
Location: `components/admin/BulkImportFAQModal.tsx`

**Features:**
- File upload (CSV/JSON)
- Direct JSON paste
- Template downloads
- Import validation
- Error reporting

### 3. FAQ Management Page
Location: `pages/admin/ai-chatbot/index.tsx`

**Features:**
- Comprehensive table view
- Search and filtering
- Status toggle buttons
- Edit/Delete actions
- Pagination
- Statistics dashboard

## FAQ Search Algorithm

The FAQ search endpoint uses a multi-factor relevance scoring system:

1. **Question Exact Match** (+10 points)
   - Searches for the query within the question text

2. **Answer Match** (+5 points)
   - Searches for the query within the answer text

3. **Keyword Matches** (+3 points each)
   - Matches against stored keywords

4. **Priority Bonus** (+priority value)
   - Higher priority FAQs get a score boost

5. **Usage Tracking**
   - Automatically increments usage count for matched FAQs

## CSV Import Format

```csv
question,answer,status,keywords,category,priority
"What is your refund policy?","We offer a 30-day money-back guarantee",active,"refund|policy|money",Billing,5
"How do I reset my password?","Click on Forgot Password on the login page",active,"password|reset|login",Account,3
```

**Notes:**
- Use pipe (`|`) to separate multiple keywords
- Wrap text with quotes if it contains commas
- Status must be either "active" or "inactive"
- Priority must be a number

## JSON Import Format

```json
[
  {
    "question": "What is your refund policy?",
    "answer": "We offer a 30-day money-back guarantee",
    "status": "active",
    "keywords": ["refund", "policy", "money"],
    "category": "Billing",
    "priority": 5
  },
  {
    "question": "How do I reset my password?",
    "answer": "Click on Forgot Password on the login page",
    "status": "active",
    "keywords": ["password", "reset", "login"],
    "category": "Account",
    "priority": 3
  }
]
```

## Integration with AI Chatbot

The FAQ module is designed to work as the **first layer** in the chatbot response flow:

```
User Query
    ↓
FAQ Search (Fast keyword matching)
    ↓
Match Found? → Return FAQ Answer
    ↓
No Match? → RAG Search (Knowledge Base)
    ↓
Generate AI Response
```

This two-tier approach ensures:
- ✅ Fast responses for common questions
- ✅ Reduced load on AI models
- ✅ Consistent answers for FAQs
- ✅ Better user experience

## Best Practices

### 1. Writing Good FAQs
- Keep questions clear and concise
- Use natural language that users would type
- Provide complete, helpful answers
- Add relevant keywords for better matching

### 2. Organizing FAQs
- Use categories to group related FAQs
- Set appropriate priorities (5-10 for critical FAQs)
- Keep active FAQs up-to-date
- Archive outdated FAQs instead of deleting

### 3. Keyword Strategy
- Include variations of terms (e.g., "refund", "money back", "return")
- Add common misspellings
- Use synonyms
- Keep keywords focused and relevant

### 4. Monitoring Usage
- Review usage statistics regularly
- Update or expand popular FAQs
- Investigate FAQs with zero usage
- Adjust priorities based on usage patterns

## Future Enhancements

Planned features for future releases:

- [ ] **AI-Powered FAQ Generation** - Automatically generate FAQs from knowledge base
- [ ] **Multi-language Support** - Translate FAQs to multiple languages
- [ ] **FAQ Groups** - Organize FAQs into expandable groups
- [ ] **Rich Text Editor** - Support formatting in answers
- [ ] **Attachments** - Add images and files to FAQ answers
- [ ] **Version History** - Track changes to FAQs over time
- [ ] **A/B Testing** - Test different answers for the same question
- [ ] **Smart Suggestions** - Suggest FAQs based on failed searches

## Troubleshooting

### FAQs not appearing in search results
1. Check FAQ status is "active"
2. Verify keywords are relevant
3. Ensure no typos in question/answer
4. Check priority is set appropriately

### Bulk import failing
1. Verify file format (CSV or JSON)
2. Check all required fields are present
3. Ensure status values are "active" or "inactive"
4. Check for special characters in CSV

### Search returning wrong FAQs
1. Review keyword assignments
2. Adjust FAQ priorities
3. Refine question phrasing
4. Add more specific keywords

## Support

For issues or questions about the FAQ module:
1. Check this documentation
2. Review the API endpoints
3. Check the browser console for errors
4. Contact the development team

---

**Version:** 1.0.0  
**Last Updated:** June 12, 2026  
**Module Status:** ✅ Production Ready
