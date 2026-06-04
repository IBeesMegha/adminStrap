/**
 * Knowledge Base Content Processing Pipeline
 * 
 * This module handles:
 * 1. Text cleaning and normalization
 * 2. Content chunking with overlap
 * 3. Token counting
 * 4. Embedding generation using Hugging Face
 */

import https from 'https';

export interface ChunkResult {
  chunkText: string;
  chunkIndex: number;
  tokenCount: number;
}

export interface ProcessingOptions {
  chunkSize?: number; // Words per chunk
  chunkOverlap?: number; // Overlapping words
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
  
  // AGGRESSIVE HEADER/NAVIGATION REMOVAL
  // Remove the specific repeated header pattern from virgo.com
  cleaned = cleaned.replace(/LaminatesCrafted for Creativity[.\s\w]*?Engineered for [Ee]ndurance[.\s\w]*?Hanepellalaminatescolor[^\s]*/gi, '');
  cleaned = cleaned.replace(/Crafted for Creativity[.\s\w]*?Engineered for [Ee]ndurance/gi, '');
  
  // Remove design name patterns that repeat
  cleaned = cleaned.replace(/Design Name[\w\s]*?Design Name/gi, 'Design Name');
  
  // Remove repetitive product codes and numbers at the start
  cleaned = cleaned.replace(/^[\d\/\-\s]{20,}/gm, '');
  
  // Split into lines and remove duplicates more aggressively
  const lines = cleaned.split('\n');
  const uniqueLines: string[] = [];
  const seenShortKeys = new Map<string, number>();
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty or very short lines
    if (trimmed.length < 3) continue;
    
    // Create a fingerprint of the line (first 80 chars normalized)
    const fingerprint = trimmed
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .substring(0, 80);
    
    // Track how many times we've seen similar content
    const count = seenShortKeys.get(fingerprint) || 0;
    
    // Only include a line if:
    // 1. It's unique (not seen before)
    // 2. OR it's substantial content (>50 chars) and we've seen it fewer than 2 times
    if (count === 0 || (trimmed.length > 50 && count < 2)) {
      uniqueLines.push(trimmed);
      seenShortKeys.set(fingerprint, count + 1);
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
  let chunkIndex = 0;
  let startIndex = 0;

  while (startIndex < words.length) {
    // Extract chunk
    const endIndex = Math.min(startIndex + chunkSize, words.length);
    const chunkWords = words.slice(startIndex, endIndex);
    const chunkText = chunkWords.join(' ');

    // Estimate token count (rough approximation: ~0.75 tokens per word)
    const tokenCount = Math.ceil(chunkWords.length * 0.75);

    chunks.push({
      chunkText,
      chunkIndex,
      tokenCount,
    });

    chunkIndex++;

    // Move start index forward, accounting for overlap
    if (endIndex >= words.length) {
      break; // We've reached the end
    }

    startIndex = endIndex - chunkOverlap;
    
    // Ensure we make progress
    if (startIndex <= chunks[chunks.length - 1]?.chunkIndex || startIndex < 0) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

/**
 * Generate embedding for text using Hugging Face Inference API
 * Falls back to local embedding if API is unavailable
 */
export async function generateEmbedding(
  text: string,
  model: string = 'sentence-transformers/all-MiniLM-L6-v2'
): Promise<number[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  // If no API key, use local embeddings
  if (!apiKey) {
    console.log('[EMBEDDING] No API key found, using local embeddings');
    return generateLocalEmbedding(text);
  }

  // Truncate text if too long
  const maxLength = 2000;
  const truncatedText = text.length > maxLength 
    ? text.substring(0, maxLength) 
    : text;

  try {
    // Try Hugging Face API with timeout
    const embedding = await Promise.race([
      generateEmbeddingWithHttps(truncatedText, model, apiKey),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('API request timed out')), 10000)
      )
    ]);
    
    console.log('[EMBEDDING] Generated using Hugging Face API');
    return embedding;
    
  } catch (error: any) {
    console.error('[EMBEDDING] API failed:', error.message);
    console.log('[EMBEDDING] Falling back to local embedding generation');
    
    // Fallback to local embedding
    return generateLocalEmbedding(text);
  }
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
      hostname: 'api-inference.huggingface.co',
      path: `/pipeline/feature-extraction/${model}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 8000, // 8 second timeout
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
  const dimensions = 384; // Match Hugging Face model dimensions
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

/**
 * Process a page: clean, chunk, and generate embeddings
 */
export async function processPage(
  pageText: string,
  options: ProcessingOptions = {}
): Promise<Array<ChunkResult & { embedding: number[] }>> {
  // Step 1: Clean text
  const cleanedText = cleanTextContent(pageText);

  if (!cleanedText || cleanedText.length < 100) {
    throw new Error('Text content too short after cleaning');
  }

  // Step 2: Chunk text
  const chunks = chunkText(cleanedText, options);

  if (chunks.length === 0) {
    throw new Error('No chunks generated from text');
  }

  // Step 3: Generate embeddings for each chunk
  const processedChunks: Array<ChunkResult & { embedding: number[] }> = [];

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk.chunkText);
      processedChunks.push({
        ...chunk,
        embedding,
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to generate embedding for chunk ${chunk.chunkIndex}:`, error);
      // Continue with other chunks even if one fails
    }
  }

  if (processedChunks.length === 0) {
    throw new Error('Failed to generate embeddings for any chunks');
  }

  return processedChunks;
}
