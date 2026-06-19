import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { ragSearch } from '@/lib/rag-service';

/**
 * POST /api/knowledge-base/search - Hybrid FAQ + RAG search
 *
 * 1. First checks FAQs for fast keyword matching
 * 2. If no FAQ match, falls back to RAG search
 * 
 * Returns AI-generated answer from retrieved context.
 * Also returns supporting chunks for transparency.
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, sourceId, vectorTopK, rerankTopK, skipFAQ } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required',
      });
    }

    const queryTrimmed = query.trim();
    console.log(`[SEARCH] Query: "${queryTrimmed}"`);

    // STEP 1: Check FAQs first (unless explicitly skipped)
    if (!skipFAQ) {
      const faqResult = await searchFAQs(queryTrimmed);
      
      if (faqResult.matched) {
        console.log(`[FAQ] ✓ Match found (score: ${faqResult.relevanceScore}): "${faqResult.question}"`);
        
        // Return FAQ answer with metadata
        return res.status(200).json({
          success: true,
          source: 'faq',
          answer: faqResult.answer,
          faqQuestion: faqResult.question,
          faqId: faqResult.id,
          relevanceScore: faqResult.relevanceScore,
          supportingChunks: [],
          totalRetrieved: 0,
          totalAfterRerank: 0,
        });
      } else {
        console.log(`[FAQ] ✗ No match found, falling back to RAG...`);
      }
    }

    // STEP 2: Fall back to RAG search
    const settings = await getOrCreateSettings();
    console.log(`[RAG] Source filter: ${sourceId || 'all'}`);

    const result = await ragSearch(queryTrimmed, {
      sourceId,
      llmModel: settings.llmModel,
      vectorTopK: vectorTopK || 50,
      rerankTopK: rerankTopK || 10,
    });

    const responseData: any = {
      success: true,
      source: 'rag',
      answer: result.answer,
      supportingChunks: result.supportingChunks,
      totalRetrieved: result.totalRetrieved,
      totalAfterRerank: result.totalAfterRerank,
    };

    // Include images if available
    if (result.images && result.images.length > 0) {
      responseData.images = result.images;
    }

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('[SEARCH] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Search failed',
    });
  }
}

/**
 * Search FAQs for relevant matches
 */
async function searchFAQs(query: string) {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(' ').filter((w: string) => w.length > 2);

  // Minimum relevance threshold for FAQ match
  const FAQ_THRESHOLD = 10;

  try {
    // Get all active FAQs with potential matches
    const faqs = await prisma.fAQ.findMany({
      where: {
        status: 'active',
      },
      orderBy: [
        { priority: 'desc' },
        { usageCount: 'desc' },
      ],
    });

    if (faqs.length === 0) {
      return { matched: false };
    }

    // Calculate relevance scores
    const results = faqs.map(faq => {
      let score = 0;
      const faqQuestionLower = faq.question.toLowerCase();
      const faqAnswerLower = faq.answer.toLowerCase();
      
      // 1. Exact question match (highest score)
      if (faqQuestionLower === queryLower) {
        score += 30;
      }
      // 2. Query is contained in question
      else if (faqQuestionLower.includes(queryLower)) {
        score += 15;
      }
      // 3. Question is contained in query
      else if (queryLower.includes(faqQuestionLower)) {
        score += 12;
      }
      
      // 4. Answer contains query
      if (faqAnswerLower.includes(queryLower)) {
        score += 8;
      }
      
      // 5. Keyword phrase matching (check if query matches any keyword phrase)
      for (const keyword of faq.keywords) {
        const keywordLower = keyword.toLowerCase();
        
        // Exact keyword match
        if (keywordLower === queryLower) {
          score += 25;
        }
        // Query contains keyword phrase
        else if (queryLower.includes(keywordLower)) {
          score += 15;
        }
        // Keyword phrase contains query
        else if (keywordLower.includes(queryLower)) {
          score += 12;
        }
        // Partial word matching within keywords
        else {
          const keywordWords = keywordLower.split(' ');
          const matchingWords = queryWords.filter(qw => 
            keywordWords.some(kw => kw.includes(qw) || qw.includes(kw))
          );
          score += matchingWords.length * 2;
        }
      }
      
      // 6. Individual word matching in question
      const questionWords = faqQuestionLower.split(' ');
      const matchingQuestionWords = queryWords.filter(qw =>
        questionWords.some(qWord => qWord.includes(qw) || qw.includes(qWord))
      );
      score += matchingQuestionWords.length * 2;
      
      // 7. Priority bonus
      score += faq.priority;
      
      return {
        ...faq,
        relevanceScore: score,
      };
    });

    // Filter out FAQs with zero score and sort by relevance
    const scoredResults = results.filter(r => r.relevanceScore > 0);
    scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    if (scoredResults.length === 0) {
      return { matched: false };
    }

    const topResult = scoredResults[0];

    console.log(`[FAQ] Top match: "${topResult.question}" (score: ${topResult.relevanceScore})`);

    // Check if top result meets threshold
    if (topResult.relevanceScore >= FAQ_THRESHOLD) {
      // Increment usage count (async, don't await)
      prisma.fAQ.update({
        where: { id: topResult.id },
        data: { usageCount: { increment: 1 } },
      }).catch(err => console.error('[FAQ] Error updating usage count:', err));

      return {
        matched: true,
        id: topResult.id,
        question: topResult.question,
        answer: topResult.answer,
        relevanceScore: topResult.relevanceScore,
      };
    }

    console.log(`[FAQ] Best score ${topResult.relevanceScore} below threshold ${FAQ_THRESHOLD}`);
    return { matched: false };
  } catch (error) {
    console.error('[FAQ] Search error:', error);
    return { matched: false };
  }
}

async function getOrCreateSettings() {
  let settings = await prisma.knowledgeSettings.findFirst();

  if (!settings) {
    settings = await prisma.knowledgeSettings.create({
      data: {
        chunkSize: 500,
        chunkOverlap: 50,
        similarityThreshold: 0.7,
        maxSearchResults: 10,
        embeddingModel: 'BAAI/bge-base-en-v1.5',
        rerankerModel: 'BAAI/bge-reranker-base',
        llmModel: 'Qwen/Qwen3-4B-Instruct-2507',
      },
    });
  } else {
    const updateData: any = {};
    if (settings.llmModel === 'Qwen/Qwen3-8B-Instruct') {
      updateData.llmModel = 'Qwen/Qwen3-4B-Instruct-2507';
    }
    if (Object.keys(updateData).length > 0) {
      settings = await prisma.knowledgeSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    }
  }

  return settings;
}

export default authMiddleware(handler);
