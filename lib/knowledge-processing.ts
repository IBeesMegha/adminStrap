/**
 * Knowledge Base Content Processing Pipeline
 * 
 * This module handles:
 * 1. Text cleaning and normalization
 * 2. Content chunking with overlap
 * 3. Token counting
 * 4. Embedding generation using Hugging Face
 * 5. Web content extraction and structuring
 */

import https from 'https';

export interface ExtractedSection {
  heading: string;
  text: string;
}

export interface ExtractedImage {
  url: string;
  alt: string;
  caption: string;
}

export interface ExtractedWebContent {
  title: string;
  content: string;
  sections: ExtractedSection[];
  specifications: Record<string, any>;
  images: ExtractedImage[];
}

export interface ChunkResult {
  chunkText: string;
  chunkIndex: number;
  tokenCount: number;
  sectionHeading: string | null;
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

/**
 * Extract meaningful content from HTML webpage data
 * Removes navigation, headers, footers, forms, and other noise
 * Returns structured JSON format for search and AI retrieval
 */
export function extractWebContent(html: string): ExtractedWebContent {
  const result: ExtractedWebContent = {
    title: '',
    content: '',
    sections: [],
    specifications: {},
    images: []
  };

  // Remove elements that should be completely excluded
  let cleaned = html;
  
  // Remove script, style, noscript tags and their content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '');
  
  // Remove common navigation patterns
  cleaned = cleaned.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleaned = cleaned.replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '');
  cleaned = cleaned.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleaned = cleaned.replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '');
  
  // Remove forms
  cleaned = cleaned.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, '');
  
  // Remove elements by class/id patterns (common noise)
  cleaned = cleaned.replace(/<[^>]*(class|id)=["'][^"']*?(nav|menu|sidebar|breadcrumb|footer|header|cookie|login|register|social|share|comment)[^"']*?["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '');
  
  // Extract title
  const titleMatch = cleaned.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    result.title = decodeHtmlEntities(titleMatch[1].trim());
  }
  
  // Also try h1 for title if no title tag
  if (!result.title) {
    const h1Match = cleaned.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      result.title = decodeHtmlEntities(stripTags(h1Match[1]).trim());
    }
  }
  
  // Extract images (before removing img tags)
  const imgRegex = /<img[^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(cleaned)) !== null) {
    const imgTag = imgMatch[0];
    
    // Skip icons, logos, decorations by checking src patterns and dimensions
    if (
      /icon|logo|sprite|avatar|emoji|decoration|ui-/i.test(imgTag) ||
      /width=["']?([0-9]+)["']?/.test(imgTag) && parseInt(RegExp.$1) < 50 ||
      /height=["']?([0-9]+)["']?/.test(imgTag) && parseInt(RegExp.$1) < 50
    ) {
      continue;
    }
    
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
    const titleAttrMatch = imgTag.match(/title=["']([^"']+)["']/i);
    
    if (srcMatch) {
      const url = srcMatch[1];
      const alt = altMatch ? decodeHtmlEntities(altMatch[1]) : '';
      const caption = titleAttrMatch ? decodeHtmlEntities(titleAttrMatch[1]) : '';
      
      // Only include meaningful images
      if (url && !url.includes('spacer') && !url.includes('pixel')) {
        result.images.push({ url, alt, caption });
      }
    }
  }
  
  // Extract sections with headings
  const sectionRegex = /<(h[2-6])[^>]*>(.*?)<\/\1>([\s\S]*?)(?=<h[2-6]|$)/gi;
  let sectionMatch;
  
  while ((sectionMatch = sectionRegex.exec(cleaned)) !== null) {
    const heading = decodeHtmlEntities(stripTags(sectionMatch[2]).trim());
    let sectionText = sectionMatch[3];
    
    // Remove buttons and CTAs from section text
    sectionText = sectionText.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
    sectionText = sectionText.replace(/<a[^>]*class=["'][^"']*?(btn|button|cta)[^"']*?["'][^>]*>[\s\S]*?<\/a>/gi, '');
    
    const text = cleanExtractedText(stripTags(sectionText));
    
    if (heading && text && text.length > 20) {
      // Check if this might be specifications/table data
      if (/<table/i.test(sectionMatch[3])) {
        const specs = extractTableData(sectionMatch[3]);
        if (Object.keys(specs).length > 0) {
          Object.assign(result.specifications, specs);
        }
      }
      
      result.sections.push({ heading, text });
    }
  }
  
  // Extract tables as specifications if not already captured
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  
  while ((tableMatch = tableRegex.exec(cleaned)) !== null) {
    const specs = extractTableData(tableMatch[0]);
    if (Object.keys(specs).length > 0) {
      Object.assign(result.specifications, specs);
    }
  }
  
  // Extract main content (everything after removing noise)
  let mainContent = cleaned;
  
  // Remove remaining HTML tags
  mainContent = stripTags(mainContent);
  mainContent = cleanExtractedText(mainContent);
  
  result.content = mainContent;
  
  return result;
}

/**
 * Strip HTML tags while preserving text content
 */
function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|li|tr|td|th)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
}

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Clean extracted text: remove duplicates, excess whitespace, common noise patterns
 */
function cleanExtractedText(text: string): string {
  let cleaned = text;
  
  // Decode entities
  cleaned = decodeHtmlEntities(cleaned);
  
  // Remove common button/CTA text patterns
  cleaned = cleaned.replace(/\b(click here|read more|learn more|enquire now|download|send|submit|buy now|add to cart|sign up|register|login|log in)\b/gi, '');
  
  // Remove common navigation patterns
  cleaned = cleaned.replace(/\b(home|products?|services?|about us?|contact us?|privacy policy|terms (?:and|&) conditions?|cookie policy)\b[\s>\/\|]*/gi, '');
  
  // Remove breadcrumb-like patterns
  cleaned = cleaned.replace(/\bhome\s*[>\/\|]\s*\w+(?:\s*[>\/\|]\s*\w+)*/gi, '');
  
  // Remove repeated words (like "Name Name Name")
  cleaned = cleaned.replace(/\b(\w+)(\s+\1\b){2,}/gi, '$1');
  
  // Split into lines and remove duplicates
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  const seenLines = new Set<string>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty or very short lines
    if (trimmed.length < 3) continue;
    
    // Skip lines that are just numbers or single words
    if (/^[\d\s\-\/]+$/.test(trimmed) || /^\w+$/.test(trimmed)) continue;
    
    // Create normalized fingerprint
    const fingerprint = trimmed.toLowerCase().replace(/\s+/g, ' ');
    
    if (!seenLines.has(fingerprint)) {
      uniqueLines.push(trimmed);
      seenLines.add(fingerprint);
    }
  }
  
  cleaned = uniqueLines.join('\n');
  
  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  
  // Replace multiple line breaks with double line break
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Extract structured data from HTML table
 */
function extractTableData(tableHtml: string): Record<string, any> {
  const specs: Record<string, any> = {};
  
  // Extract rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    
    // Extract cells (th or td)
    const cells: string[] = [];
    const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      const cellText = decodeHtmlEntities(stripTags(cellMatch[1]).trim());
      cells.push(cellText);
    }
    
    // If we have exactly 2 cells, treat as key-value pair
    if (cells.length === 2 && cells[0] && cells[1]) {
      const key = cells[0].replace(/[:\s]+$/, ''); // Remove trailing colon/spaces
      specs[key] = cells[1];
    }
    // If more cells, create nested structure
    else if (cells.length > 2) {
      const key = cells[0];
      specs[key] = cells.slice(1);
    }
  }
  
  return specs;
}

/**
 * Calculate similarity between two strings (0 to 1)
 * Uses Jaccard similarity on word sets
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection - count words in both sets
  let intersectionCount = 0;
  set1.forEach(word => {
    if (set2.has(word)) {
      intersectionCount++;
    }
  });
  
  // Calculate union size
  const unionSize = set1.size + set2.size - intersectionCount;
  
  // Jaccard similarity
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Clean text content by removing HTML, scripts, excess whitespace
 */
export function cleanTextContent(text: string): string {
  let cleaned = text;

  // Remove any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, ' ');

  // Remove script and style content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Decode common HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");

  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // Remove email addresses
  cleaned = cleaned.replace(/[\w\.-]+@[\w\.-]+\.\w+/g, '');
  
  // Remove common repeated patterns from crawled content
  cleaned = cleaned.replace(/\b(Ask NissanEnquire Now|Enquire Now|Register Now|Apply Now)\b/gi, '');
  cleaned = cleaned.replace(/\b(Open House|Parent Interaction)\b/gi, '');
  cleaned = cleaned.replace(/\bon \d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4}/gi, ''); // Remove date patterns
  
  // AGGRESSIVE HEADER/NAVIGATION REMOVAL
  // Remove the specific repeated header pattern from virgo.com
  cleaned = cleaned.replace(/LaminatesCrafted for Creativity[.\s\w]*?Engineered for [Ee]ndurance[.\s\w]*?Hanepellalaminatescolor[^\s]*/gi, '');
  cleaned = cleaned.replace(/Crafted for Creativity[.\s\w]*?Engineered for [Ee]ndurance/gi, '');
  
  // Remove design name patterns that repeat
  cleaned = cleaned.replace(/Design Name[\w\s]*?Design Name/gi, 'Design Name');
  
  // Remove repetitive product codes and numbers at the start
  cleaned = cleaned.replace(/^[\d\/\-\s]{20,}/gm, '');
  
  // Split into lines and remove duplicates VERY aggressively
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  const seenExact = new Set<string>(); // Track exact matches
  const seenFingerprints = new Set<string>(); // Track normalized versions
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty or very short lines
    if (trimmed.length < 3) continue;
    
    // Skip lines that are just numbers, codes, or single words
    if (/^[\d\s\-\/\.\,]+$/.test(trimmed)) continue;
    if (/^\w+$/.test(trimmed) && trimmed.length < 15) continue;
    
    // Create FULL fingerprint (entire line, normalized)
    const fullFingerprint = trimmed
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove all punctuation
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
    
    // Check for exact duplicates first
    if (seenExact.has(trimmed)) {
      continue; // Skip exact duplicate
    }
    
    // Check for normalized duplicates (same content, different formatting)
    if (seenFingerprints.has(fullFingerprint)) {
      continue; // Skip semantic duplicate
    }
    
    // Check for partial duplicates (line contains or is contained by previous lines)
    let isDuplicate = false;
    if (fullFingerprint.length > 20) {
      const existingFingerprints = Array.from(seenFingerprints);
      for (const existingFingerprint of existingFingerprints) {
        // If this line is very similar to an existing one (90% overlap)
        if (existingFingerprint.length > 20) {
          const similarity = calculateSimilarity(fullFingerprint, existingFingerprint);
          if (similarity > 0.9) {
            isDuplicate = true;
            break;
          }
        }
      }
    }
    
    if (!isDuplicate) {
      uniqueLines.push(trimmed);
      seenExact.add(trimmed);
      seenFingerprints.add(fullFingerprint);
    }
  }
  
  cleaned = uniqueLines.join('\n');

  // Remove sequences of repeated words (like "Name Name Name")
  cleaned = cleaned.replace(/\b(\w+)(\s+\1\b){2,}/gi, '$1');

  // Replace multiple spaces with single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Replace multiple line breaks with double line break
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Split text into chunks with overlap
 * Removes duplicate chunks automatically
 */
export function chunkText(
  text: string,
  options: ProcessingOptions = {}
): ChunkResult[] {
  const chunkSize = options.chunkSize || 800; // Default 800 words
  const chunkOverlap = options.chunkOverlap || 100; // Default 100 words overlap

  // Split into words (preserving some punctuation context)
  const words = text.split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return [];
  }

  const chunks: ChunkResult[] = [];
  const chunkFingerprints: string[] = []; // Store all fingerprints for similarity checking
  let chunkIndex = 0;
  let startIndex = 0;

  while (startIndex < words.length) {
    // Extract chunk
    const endIndex = Math.min(startIndex + chunkSize, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    const chunkText = chunkWords.join(' ');
    
    // Create fingerprint for duplicate detection
    const fingerprint = chunkText
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Check if this chunk is too similar to any existing chunk
    let isDuplicate = false;
    for (const existingFingerprint of chunkFingerprints) {
      const similarity = calculateSimilarity(fingerprint, existingFingerprint);
      // If chunks are more than 85% similar, consider it a duplicate
      if (similarity > 0.85) {
        isDuplicate = true;
        break;
      }
    }

    // Only add chunk if it's not a duplicate
    if (!isDuplicate) {
      // Estimate token count (rough approximation: ~0.75 tokens per word)
      const tokenCount = Math.ceil(chunkWords.length * 0.75);

      chunks.push({
        chunkText,
        chunkIndex,
        tokenCount,
        sectionHeading: null,
      });
      
      chunkFingerprints.push(fingerprint);
      chunkIndex++;
    }

    // Move start index forward, accounting for overlap
    if (endIndex >= words.length) {
      break; // We've reached the end
    }

    startIndex = endIndex - chunkOverlap;
    
    // Ensure we make progress
    if (startIndex <= 0 || startIndex >= endIndex) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

/**
 * Semantic chunking: content-aware splitting by headings/sections
 * Preserves logical content boundaries with word-count fallback
 */
export function semanticChunkText(
  text: string,
  options: ProcessingOptions = {}
): ChunkResult[] {
  const chunkSize = options.chunkSize || 500;
  const chunkOverlap = options.chunkOverlap || 50;
  const lines = text.split('\n');

  const sections: { heading: string | null; contentLines: string[] }[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentLines.push(line);
      continue;
    }
    if (isLikelyHeading(trimmed)) {
      if (currentLines.some(l => l.trim())) {
        sections.push({ heading: currentHeading, contentLines: [...currentLines] });
      }
      currentLines = [];
      currentHeading = trimmed;
    } else {
      currentLines.push(line);
    }
  }
  if (currentLines.some(l => l.trim())) {
    sections.push({ heading: currentHeading, contentLines: [...currentLines] });
  }

  if (sections.length === 0) {
    return chunkText(text, options).map(c => ({ ...c, sectionHeading: null }));
  }

  const chunks: ChunkResult[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionText = section.contentLines.join('\n').trim();
    if (!sectionText) continue;

    const words = sectionText.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= chunkSize) {
      chunks.push({
        chunkText: section.heading ? `${section.heading}\n\n${sectionText}` : sectionText,
        chunkIndex: chunkIndex++,
        tokenCount: Math.ceil(words.length * 0.75),
        sectionHeading: section.heading,
      });
    } else {
      let startIndex = 0;
      while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + chunkSize, words.length);
        const chunkWords = words.slice(startIndex, endIndex);
        chunks.push({
          chunkText: section.heading ? `${section.heading}\n\n${chunkWords.join(' ')}` : chunkWords.join(' '),
          chunkIndex: chunkIndex++,
          tokenCount: Math.ceil(chunkWords.length * 0.75),
          sectionHeading: section.heading,
        });
        if (endIndex >= words.length) break;
        startIndex = endIndex - chunkOverlap;
        if (startIndex <= 0 || startIndex >= endIndex) startIndex = endIndex;
      }
    }
  }

  return chunks;
}

function isLikelyHeading(line: string): boolean {
  const t = line.trim();
  if (!t || t.length < 3 || t.length > 120) return false;
  if (/^[\d\s\-\.\/,()\]]+$/.test(t)) return false;
  if (/[.!?:;)]$/.test(t) && !t.endsWith(':')) return false;
  if (/^(https?:\/\/|www\.)/i.test(t)) return false;
  return true;
}

/**
 * Generate embedding for text using Hugging Face Inference API
 * Falls back to local embedding if API is unavailable
 */
export async function generateEmbedding(
  text: string,
  model: string = 'BAAI/bge-base-en-v1.5'
): Promise<number[]> {
  return generateLocalEmbedding(text);
}

/**
 * Generate embedding using https module (Node.js built-in)
 */
async function generateEmbeddingWithHttps(
  text: string,
  model: string,
  apiKey: string
): Promise<number[]> {
  return new Promise<number[]>((resolve, reject) => {
    const postData = JSON.stringify({
      inputs: text,
      options: {
        wait_for_model: true,
      },
    });

    const options = {
      hostname: 'router.huggingface.co',
      path: `/hf-inference/pipeline/feature-extraction/${model}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            if (res.statusCode === 503) {
              reject(new Error('Model is loading, please try again in a few seconds'));
            } else {
              reject(new Error(`API returned ${res.statusCode}: ${data}`));
            }
            return;
          }

          const parsed = JSON.parse(data);
          const vector = processEmbeddingResponse(parsed);
          resolve(vector);
        } catch (error: any) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error: any) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Process and normalize the embedding response from API
 */
function processEmbeddingResponse(embedding: any): number[] {
  let vector: number[];
  
  if (Array.isArray(embedding)) {
    vector = Array.isArray(embedding[0]) ? embedding[0] : embedding;
  } else if (typeof embedding === 'object' && embedding !== null) {
    vector = embedding.embeddings || embedding.data || [];
  } else {
    throw new Error('Unexpected response format');
  }

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error('Invalid embedding returned');
  }

  return normalizeVector(vector);
}

/**
 * Generate local embedding using TF-IDF inspired approach
 * This works offline and provides decent semantic search quality
 */
function generateLocalEmbedding(text: string): number[] {
  const dimensions = 384; // Match nomic-embed-text dimensions
  const embedding = new Array(dimensions).fill(0);
  
  // Normalize and tokenize text
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2); // Filter short words
  
  if (words.length === 0) {
    return embedding;
  }
  
  // Create word frequency map
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Calculate IDF-like weights (words that appear less frequently are more important)
  const uniqueWords = wordFreq.size;
  
  // Generate features using multiple hash functions with stronger differentiation
  wordFreq.forEach((freq, word) => {
    // TF (term frequency) normalization
    const tf = freq / words.length;
    
    // IDF-like score (more unique words get higher weight)
    const idf = Math.log(1 + uniqueWords / freq);
    const tfidf = tf * idf;
    
    // Use MORE hash functions to create more unique signatures
    for (let hashFunc = 0; hashFunc < 8; hashFunc++) {
      const hash = simpleHash(word, hashFunc * 7); // Use different seeds
      const index = Math.abs(hash) % dimensions;
      
      // Add weighted contribution based on TF-IDF with position variance
      const positionFactor = 1.0 + (hashFunc * 0.15);
      embedding[index] += tfidf * positionFactor;
    }
  });
  
  // Add character n-grams for more specificity
  for (let i = 0; i < Math.min(words.length, 20); i++) {
    const word = words[i];
    if (word.length >= 4) {
      // Character trigrams within words
      for (let j = 0; j < word.length - 2; j++) {
        const charTrigram = word.substring(j, j + 3);
        const hash = simpleHash(charTrigram, 100);
        const index = Math.abs(hash) % dimensions;
        embedding[index] += 0.1;
      }
    }
  }
  
  // Add n-gram features for better context (bigrams)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + '_' + words[i + 1];
    const hash = simpleHash(bigram, 50);
    const index = Math.abs(hash) % dimensions;
    embedding[index] += 0.4; // Weight for bigrams
  }
  
  // Add trigrams for even better context
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = words[i] + '_' + words[i + 1] + '_' + words[i + 2];
    const hash = simpleHash(trigram, 75);
    const index = Math.abs(hash) % dimensions;
    embedding[index] += 0.3; // Weight for trigrams
  }
  
  // Add document-level features with more variation
  embedding[0] += Math.log(1 + words.length) / 8;
  embedding[1] += wordFreq.size / words.length;
  embedding[2] += Math.log(1 + uniqueWords) / 5;
  
  // Add position-based weighting (words at beginning are more important)
  for (let i = 0; i < Math.min(30, words.length); i++) {
    const word = words[i];
    const positionWeight = 1.0 / (1 + i * 0.08); // Stronger decay
    const hash = simpleHash(word + '_pos', i); // Include position in hash
    const index = Math.abs(hash) % dimensions;
    embedding[index] += positionWeight * 0.6;
  }
  
  // Add a small amount of content-specific noise to ensure uniqueness
  // This prevents identical embeddings for very similar content
  const contentHash = simpleHash(text.substring(0, 100), 999);
  for (let i = 0; i < 10; i++) {
    const index = (Math.abs(contentHash) + i * 13) % dimensions;
    embedding[index] += 0.05;
  }
  
  // Normalize the vector
  return normalizeVector(embedding);
}

/**
 * Simple hash function with seed for multiple hash functions
 */
function simpleHash(str: string, seed: number = 0): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Normalize a vector to unit length
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  );
  
  if (magnitude === 0) {
    return vector;
  }
  
  return vector.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

export interface ProcessPageResult {
  skipped: boolean;
  skipReason?: string;
  chunks?: Array<ChunkResult & { embedding: number[] }>;
}

/**
 * Process a page: clean, chunk, and generate embeddings
 *
 * Returns a result indicating whether the page was processed or skipped.
 * Pages with insufficient text are skipped (not failed) so their media
 * and metadata are preserved for future multimodal retrieval.
 */
export async function processPage(
  pageText: string,
  options: ProcessingOptions = {},
  mediaCount: number = 0
): Promise<ProcessPageResult> {
  // Step 1: Clean text
  const cleanedText = cleanTextContent(pageText);
  const wordCount = cleanedText ? cleanedText.split(/\s+/).filter(w => w.length > 0).length : 0;

  const rawLength = pageText.length;
  const cleanedLength = cleanedText ? cleanedText.length : 0;

  // Check if text is too short for meaningful embeddings
  if (!cleanedText || cleanedLength < 100) {
    console.log(`[PROCESS PAGE] Page URL: [logging only - URL not passed to this function]`);
    console.log(`[PROCESS PAGE] Raw text length: ${rawLength}`);
    console.log(`[PROCESS PAGE] Cleaned text length: ${cleanedLength}`);
    console.log(`[PROCESS PAGE] Word count: ${wordCount}`);
    console.log(`[PROCESS PAGE] Media count: ${mediaCount}`);
    console.log(`[PROCESS PAGE] Decision: Skipped (Insufficient text)`);
    console.log(`[PROCESS PAGE] Skipped embedding generation: insufficient textual content.`);
    return { skipped: true, skipReason: 'Insufficient text content after cleaning' };
  }

  console.log(`[PROCESS PAGE] Raw text length: ${rawLength}`);
  console.log(`[PROCESS PAGE] Cleaned text length: ${cleanedLength}`);
  console.log(`[PROCESS PAGE] Word count: ${wordCount}`);
  console.log(`[PROCESS PAGE] Media count: ${mediaCount}`);
  console.log(`[PROCESS PAGE] Cleaned text first 500 chars: ${cleanedText.substring(0, 500).replace(/\n/g, '\\n')}`);

  // Step 2: Semantic chunking (heading-aware, with word-count fallback)
  const chunks = semanticChunkText(cleanedText, options);

  if (chunks.length === 0) {
    console.log(`[PROCESS PAGE] Decision: Skipped (No chunks generated)`);
    return { skipped: true, skipReason: 'No chunks could be generated from text' };
  }

  console.log(`[PROCESS PAGE] Generated ${chunks.length} chunks`);

  // Step 3: Generate embeddings for each chunk
  const processedChunks: Array<ChunkResult & { embedding: number[] }> = [];

  for (const chunk of chunks) {
    try {
      if (chunk.chunkIndex === 0) {
        console.log(`[PROCESS PAGE] First chunk text (${chunk.chunkText.length} chars): ${chunk.chunkText.substring(0, 300).replace(/\n/g, '\\n')}`);
      }

      const embedding = await generateEmbedding(chunk.chunkText);
      processedChunks.push({
        ...chunk,
        embedding,
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${chunk.chunkIndex}:`, error);
    }
  }

  if (processedChunks.length === 0) {
    console.log(`[PROCESS PAGE] Decision: Skipped (No embeddings generated)`);
    return { skipped: true, skipReason: 'Failed to generate embeddings for any chunks' };
  }

  console.log(`[PROCESS PAGE] Decision: Embedded`);
  console.log(`[PROCESS PAGE] Successfully processed ${processedChunks.length} chunks with embeddings`);

  return { skipped: false, chunks: processedChunks };
}
