import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/knowledge-base/:id/chat - Chat with knowledge source
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { question } = req.body;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
      });
    }

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    const source = await prisma.knowledgeSource.findUnique({
      where: { id },
      include: {
        pages: {
          where: {
            crawlStatus: 'crawled',
          },
        },
      },
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found',
      });
    }

    if (source.pages.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          answer: 'No content has been crawled yet. Please crawl the website first.',
          sources: [],
        },
      });
    }

    // Simple keyword-based search (Phase 1 - no AI/embeddings)
    const searchResults = searchPages(source.pages, question);

    if (searchResults.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          answer: 'I could not find any relevant information about your question in the crawled content.',
          sources: [],
        },
      });
    }

    // Build answer from search results
    const answer = buildAnswer(searchResults, question);
    const sources = searchResults.slice(0, 5).map(result => ({
      url: result.url,
      title: result.pageTitle || 'Untitled Page',
      snippet: result.snippet,
      relevanceScore: result.score,
    }));

    return res.status(200).json({
      success: true,
      data: {
        answer,
        sources,
      },
    });

  } catch (error) {
    console.error('Error processing chat:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process question',
    });
  }
}

interface SearchResult {
  url: string;
  pageTitle: string | null;
  snippet: string;
  score: number;
}

/**
 * Simple keyword-based search (Phase 1)
 */
function searchPages(pages: any[], question: string): SearchResult[] {
  const keywords = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Only search words longer than 3 chars

  if (keywords.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const page of pages) {
    const textContent = page.textContent.toLowerCase();
    let score = 0;

    // Calculate relevance score
    for (const keyword of keywords) {
      const occurrences = (textContent.match(new RegExp(keyword, 'g')) || []).length;
      score += occurrences;
    }

    if (score > 0) {
      // Find best matching snippet
      const snippet = extractSnippet(page.textContent, keywords);

      results.push({
        url: page.url,
        pageTitle: page.pageTitle,
        snippet,
        score,
      });
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Extract a relevant snippet containing keywords
 */
function extractSnippet(content: string, keywords: string[]): string {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Find sentence with most keyword matches
  let bestSentence = '';
  let maxMatches = 0;

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    let matches = 0;

    for (const keyword of keywords) {
      if (lowerSentence.includes(keyword)) {
        matches++;
      }
    }

    if (matches > maxMatches) {
      maxMatches = matches;
      bestSentence = sentence.trim();
    }
  }

  // Truncate if too long
  if (bestSentence.length > 300) {
    return bestSentence.substring(0, 297) + '...';
  }

  return bestSentence || content.substring(0, 300) + '...';
}

/**
 * Build answer from search results
 */
function buildAnswer(results: SearchResult[], question: string): string {
  const topResults = results.slice(0, 3);

  let answer = `Based on the crawled content, I found the following relevant information:\n\n`;

  topResults.forEach((result, index) => {
    answer += `${index + 1}. From "${result.pageTitle || result.url}":\n`;
    answer += `   ${result.snippet}\n\n`;
  });

  answer += `\nFound ${results.length} relevant page(s) in total.`;

  return answer;
}

export default authMiddleware(handler);
