# Web Content Extraction Examples

This directory contains examples and tests for the web content extraction system.

## Files

### 1. `web-content-extraction-example.ts`
Basic example showing how to use the `extractWebContent` function with a sample HTML page.

**Run it:**
```bash
npx ts-node examples/web-content-extraction-example.ts
```

### 2. `api-web-extraction-endpoint.ts`
Example Next.js API endpoint that accepts HTML content via POST request and returns structured JSON.

**Usage:**
```bash
# Copy to pages/api/extract-web-content.ts
cp examples/api-web-extraction-endpoint.ts pages/api/extract-web-content.ts

# Start your Next.js server
npm run dev

# Test with cURL
curl -X POST http://localhost:3000/api/extract-web-content \
  -H "Content-Type: application/json" \
  -d '{"html": "<html><body><h1>Test</h1><p>Content</p></body></html>"}'
```

### 3. `test-extraction-cases.ts`
Comprehensive test suite with multiple real-world scenarios:
- E-commerce product page
- Blog article
- Documentation page

**Run it:**
```bash
npx ts-node examples/test-extraction-cases.ts
```

## What Gets Extracted

✅ **Meaningful Content:**
- Page titles and headings
- Text content and descriptions
- Product features and benefits
- Technical specifications (from tables)
- FAQs and documentation
- Product/content images with alt text

❌ **Removed Noise:**
- Navigation menus
- Breadcrumbs
- Headers and footers
- Sidebars
- Forms and buttons
- CTAs (Call-to-actions)
- Privacy policies
- Social media links
- Duplicate content

## Output Format

All examples return data in this structure:

```typescript
{
  title: string;                    // Page title
  content: string;                  // Full cleaned text
  sections: Array<{
    heading: string;
    text: string;
  }>;
  specifications: Record<string, any>; // Key-value pairs from tables
  images: Array<{
    url: string;
    alt: string;
    caption: string;
  }>;
}
```

## Integration Examples

### With Knowledge Base

```typescript
import { extractWebContent, processPage } from '../lib/knowledge-processing';

// Extract content
const extracted = extractWebContent(htmlContent);

// Process for embeddings
const chunks = await processPage(extracted.content);

// Store in database
await storeInKnowledgeBase(extracted, chunks);
```

### With Web Crawler

```typescript
import { extractWebContent } from '../lib/knowledge-processing';
import fetch from 'node-fetch';

// Fetch webpage
const response = await fetch('https://example.com/page');
const html = await response.text();

// Extract content
const structured = extractWebContent(html);

// Use the structured data
console.log(structured.title);
console.log(structured.sections);
```

## Documentation

For complete documentation, see:
- [docs/WEB-CONTENT-EXTRACTION.md](../docs/WEB-CONTENT-EXTRACTION.md)

## Testing Your Own HTML

Create a new file and test with your HTML:

```typescript
import { extractWebContent } from '../lib/knowledge-processing';
import fs from 'fs';

// Load your HTML file
const html = fs.readFileSync('your-page.html', 'utf-8');

// Extract
const result = extractWebContent(html);

// View results
console.log(JSON.stringify(result, null, 2));
```

## Tips

1. **Validate Output**: Always check that important content wasn't removed
2. **Test Different Pages**: Different sites have different structures
3. **Adjust Filters**: If valid content is removed, adjust the filtering logic
4. **Check Images**: Ensure meaningful images aren't filtered as icons
5. **Review Specs**: Verify table data extraction is correct

## Support

For issues or questions:
1. Check the [documentation](../docs/WEB-CONTENT-EXTRACTION.md)
2. Review the existing examples
3. Test with the provided test cases
