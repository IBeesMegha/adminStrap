import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';
import { crawlWebsite } from '@/lib/web-crawler';
import { storeMediaFromPage } from '@/lib/media-service';
import { processSourcePages } from '@/pages/api/knowledge-base/process';

/**
 * GET /api/knowledge-base - List all knowledge sources
 * POST /api/knowledge-base - Create a new knowledge source
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sources = await prisma.knowledgeSource.findMany({
      include: {
        _count: {
          select: { pages: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error('Error fetching knowledge sources:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge sources',
    });
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, websiteUrl, startCrawl } = req.body;

    // Validation
    if (!name || !websiteUrl) {
      return res.status(400).json({
        success: false,
        error: 'Name and website URL are required',
      });
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid website URL format',
      });
    }

    // Check for duplicate URL
    const existing = await prisma.knowledgeSource.findUnique({
      where: { websiteUrl },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'A knowledge source with this URL already exists',
      });
    }

    // Create knowledge source
    const source = await prisma.knowledgeSource.create({
      data: {
        name,
        websiteUrl,
        status: startCrawl ? 'crawling' : 'pending',
      },
    });

    // If startCrawl is true, trigger background crawling
    if (startCrawl) {
      // Trigger crawling in background (non-blocking) - don't await
      performCrawl(source.id, source.websiteUrl).catch(err => 
        console.error('Error during background crawl:', err)
      );
    }

    return res.status(201).json({
      success: true,
      data: source,
      message: startCrawl
        ? 'Knowledge source created and crawling started'
        : 'Knowledge source created successfully',
    });
  } catch (error) {
    console.error('Error creating knowledge source:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create knowledge source',
    });
  }
}

/**
 * Background crawl function
 */
async function performCrawl(sourceId: string, websiteUrl: string) {
  try {
    console.log(`[CRAWL START] Source: ${sourceId}, URL: ${websiteUrl}`);

    // Delete existing pages for this source
    await prisma.knowledgePage.deleteMany({
      where: { sourceId },
    });

    // Perform the crawl
    const result = await crawlWebsite(websiteUrl, {
      maxPages: 10000, // Increased from 100 to 10000
      maxDepth: 3,
    });

    console.log(`[CRAWL COMPLETE] Pages crawled: ${result.pages.length}`);

    // Insert crawled pages into database in batches to avoid timeout
    if (result.pages.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < result.pages.length; i += batchSize) {
        const batch = result.pages.slice(i, i + batchSize);
        
        // Create pages and store media in parallel batches
        for (const page of batch) {
          // Create page
          const createdPage = await prisma.knowledgePage.create({
            data: {
              sourceId,
              url: page.url,
              pageTitle: page.pageTitle,
              textContent: page.textContent,
              htmlContent: page.htmlContent,
              contentLength: page.contentLength,
              crawlStatus: 'crawled',
              lastCrawledAt: new Date(),
            },
          });

          // Store media for this page (if extracted)
          if (page.media && page.media.length > 0) {
            console.log(
              `[CRAWL] Storing ${page.media.length} media items for page ${page.url}`
            );
            await storeMediaFromPage(createdPage.id, page.media);
          }
        }
      }
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

    console.log(`[CRAWL SUCCESS] Source ${sourceId} completed`);

    // Trigger processing in background (don't await)
    triggerProcessing(sourceId).catch(err => 
      console.error('[CRAWL] Error triggering processing:', err)
    );

  } catch (error) {
    console.error('[CRAWL ERROR]', error);

    // Update source with error status
    await prisma.knowledgeSource.update({
      where: { id: sourceId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }).catch(err => console.error('Error updating failed status:', err));
  }
}

/**
 * Trigger background processing for a source
 */
async function triggerProcessing(sourceId: string) {
  try {
    console.log(`[PROCESSING] Triggering background processing for source: ${sourceId}`);
    
    const result = await processSourcePages(sourceId);
    console.log(`[PROCESSING] Background processing result:`, result);
  } catch (error) {
    console.error('[PROCESSING] Error:', error);
  }
}

export default authMiddleware(handler);
