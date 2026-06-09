/**
 * Example API Endpoint: Web Content Extraction
 * 
 * POST /api/extract-web-content
 * 
 * Accepts HTML content and returns structured JSON
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { extractWebContent } from '../lib/knowledge-processing';

interface ExtractionRequest {
  html: string;
  url?: string; // Optional, for context/logging
}

interface ExtractionResponse {
  success: boolean;
  data?: ReturnType<typeof extractWebContent>;
  error?: string;
}

/**
 * API Handler Example
 * 
 * Usage:
 * POST /api/extract-web-content
 * Body: { "html": "<html>...</html>", "url": "https://example.com/page" }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExtractionResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { html, url } = req.body as ExtractionRequest;

    // Validate input
    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid "html" field in request body'
      });
    }

    if (html.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'HTML content cannot be empty'
      });
    }

    if (html.length > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({
        success: false,
        error: 'HTML content too large (max 10MB)'
      });
    }

    // Log the extraction (optional)
    console.log(`[WEB EXTRACTION] Processing${url ? ` from ${url}` : ''}`);
    console.log(`[WEB EXTRACTION] Input size: ${(html.length / 1024).toFixed(2)}KB`);

    // Extract content
    const extracted = extractWebContent(html);

    // Validate output
    if (!extracted.title && !extracted.content) {
      return res.status(422).json({
        success: false,
        error: 'No meaningful content could be extracted from the HTML'
      });
    }

    // Log results
    console.log(`[WEB EXTRACTION] Success - Title: "${extracted.title}"`);
    console.log(`[WEB EXTRACTION] Extracted: ${extracted.sections.length} sections, ${extracted.images.length} images, ${Object.keys(extracted.specifications).length} specs`);

    // Return structured data
    return res.status(200).json({
      success: true,
      data: extracted
    });

  } catch (error: any) {
    console.error('[WEB EXTRACTION] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during content extraction'
    });
  }
}

/**
 * Example cURL usage:
 * 
 * curl -X POST http://localhost:3000/api/extract-web-content \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "html": "<html><head><title>Test Page</title></head><body><h1>Hello</h1><p>Content here</p></body></html>",
 *     "url": "https://example.com/test"
 *   }'
 */

/**
 * Example JavaScript fetch usage:
 * 
 * const response = await fetch('/api/extract-web-content', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     html: htmlContent,
 *     url: 'https://example.com/page'
 *   })
 * });
 * 
 * const result = await response.json();
 * 
 * if (result.success) {
 *   console.log('Title:', result.data.title);
 *   console.log('Sections:', result.data.sections);
 *   console.log('Images:', result.data.images);
 *   console.log('Specs:', result.data.specifications);
 * }
 */

/**
 * Example with URL fetching (requires additional library like 'node-fetch' or 'axios'):
 * 
 * import fetch from 'node-fetch';
 * 
 * // Fetch HTML from URL
 * const htmlResponse = await fetch('https://example.com/page');
 * const html = await htmlResponse.text();
 * 
 * // Extract content
 * const response = await fetch('/api/extract-web-content', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ html, url: 'https://example.com/page' })
 * });
 * 
 * const extracted = await response.json();
 */
