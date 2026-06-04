import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { crawlWebsite } from '@/lib/web-crawler';

/**
 * POST /api/knowledge-base/:id/crawl - Start or re-crawl a knowledge source
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
      });
    }

    const source = await prisma.knowledgeSource.findUnique({
      where: { id },
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge source not found',
      });
    }

    // Update status to crawling
    await prisma.knowledgeSource.update({
      where: { id },
      data: {
        status: 'crawling',
        errorMessage: null,
      },
    });

    // Return immediately and crawl in background
    res.status(202).json({
      success: true,
      message: 'Crawling started',
    });

    // Perform crawling asynchronously
    performCrawl(id, source.websiteUrl).catch(console.error);

  } catch (error) {
    console.error('Error starting crawl:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start crawling',
    });
  }
}

async function performCrawl(sourceId: string, websiteUrl: string) {
  try {
    console.log(`Starting crawl for source ${sourceId}: ${websiteUrl}`);

    // Delete existing pages for this source
    await prisma.knowledgePage.deleteMany({
      where: { sourceId },
    });

    // Perform the crawl
    const result = await crawlWebsite(websiteUrl, {
      maxPages: 100,
      maxDepth: 3,
    });

    console.log(`Crawl completed: ${result.pages.length} pages`);

    // Insert crawled pages into database
    if (result.pages.length > 0) {
      await prisma.knowledgePage.createMany({
        data: result.pages.map(page => ({
          sourceId,
          url: page.url,
          pageTitle: page.pageTitle,
          textContent: page.textContent,
          htmlContent: page.htmlContent,
          contentLength: page.contentLength,
          crawlStatus: 'crawled',
          lastCrawledAt: new Date(),
        })),
      });
    }

    // Update source status
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: {
        status: 'completed',
        totalPages: result.pages.length,
        lastCrawlAt: new Date(),
        errorMessage: result.errors.length > 0 
          ? `Completed with ${result.errors.length} errors` 
          : null,
      },
    });

    console.log(`Crawl completed successfully for source ${sourceId}`);

  } catch (error) {
    console.error('Error during crawl:', error);

    // Update source with error status
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    });
  }
}

export default authMiddleware(handler);
