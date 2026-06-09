import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { processPage } from '@/lib/knowledge-processing';

/**
 * POST /api/knowledge-base/process - Process all pending pages
 * POST /api/knowledge-base/process?sourceId=xxx - Process pages for specific source
 * POST /api/knowledge-base/process?pageId=xxx - Process specific page
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sourceId, pageId } = req.query;

    // Get settings
    const settings = await getOrCreateSettings();

    // Build query
    let whereClause: any = {
      crawlStatus: 'crawled',
      processingStatus: { in: ['pending', 'failed'] },
    };

    if (pageId && typeof pageId === 'string') {
      whereClause.id = pageId;
    } else if (sourceId && typeof sourceId === 'string') {
      whereClause.sourceId = sourceId;
    }

    // Get pages to process
    const pagesToProcess = await prisma.knowledgePage.findMany({
      where: whereClause,
      take: 10, // Process in batches
      orderBy: { createdAt: 'asc' },
    });

    if (pagesToProcess.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pages to process',
        processed: 0,
      });
    }

    console.log(`[PROCESSING] Starting processing of ${pagesToProcess.length} pages`);

    let successCount = 0;
    let errorCount = 0;

    // Process each page
    for (const page of pagesToProcess) {
      try {
        // Update status to processing
        await prisma.knowledgePage.update({
          where: { id: page.id },
          data: { processingStatus: 'processing' },
        });

        console.log(`[PROCESSING] Page: ${page.url}`);

        // Delete existing chunks for this page (in case of reprocessing)
        await prisma.knowledgeChunk.deleteMany({
          where: { pageId: page.id },
        });

        // Process page: clean, chunk, generate embeddings
        const chunks = await processPage(page.textContent, {
          chunkSize: settings.chunkSize,
          chunkOverlap: settings.chunkOverlap,
        });

        console.log(`[PROCESSING] Generated ${chunks.length} chunks for page ${page.url}`);

        // Store chunks in database
        for (const chunk of chunks) {
          await prisma.knowledgeChunk.create({
            data: {
              sourceId: page.sourceId,
              pageId: page.id,
              chunkText: chunk.chunkText,
              chunkIndex: chunk.chunkIndex,
              tokenCount: chunk.tokenCount,
              sectionHeading: chunk.sectionHeading,
              embedding: chunk.embedding,
            },
          });
        }

        // Update page status
        await prisma.knowledgePage.update({
          where: { id: page.id },
          data: {
            processingStatus: 'completed',
            lastProcessedAt: new Date(),
            errorMessage: null,
          },
        });

        // Update source total chunks
        await updateSourceChunkCount(page.sourceId);

        successCount++;
        console.log(`[PROCESSING] Successfully processed page: ${page.url}`);

      } catch (error: any) {
        console.error(`[PROCESSING] Error processing page ${page.url}:`, error);

        // Update page with error
        await prisma.knowledgePage.update({
          where: { id: page.id },
          data: {
            processingStatus: 'failed',
            errorMessage: error.message || 'Unknown error',
          },
        });

        errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${successCount} pages successfully, ${errorCount} failed`,
      processed: successCount,
      failed: errorCount,
    });

  } catch (error: any) {
    console.error('[PROCESSING] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process pages',
    });
  }
}

/**
 * Get or create default settings
 */
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

/**
 * Update source chunk count
 */
async function updateSourceChunkCount(sourceId: string) {
  const count = await prisma.knowledgeChunk.count({
    where: { sourceId },
  });

  await prisma.knowledgeSource.update({
    where: { id: sourceId },
    data: { totalChunks: count },
  });
}

export default authMiddleware(handler);
