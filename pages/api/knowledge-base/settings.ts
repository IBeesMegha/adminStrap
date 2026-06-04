import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/knowledge-base/settings - Get knowledge base settings
 * PUT /api/knowledge-base/settings - Update knowledge base settings
 */
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
    });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      chunkSize,
      chunkOverlap,
      similarityThreshold,
      maxSearchResults,
      embeddingModel,
    } = req.body;

    // Validation
    const errors: string[] = [];

    if (chunkSize !== undefined) {
      if (typeof chunkSize !== 'number' || chunkSize < 100 || chunkSize > 5000) {
        errors.push('Chunk size must be between 100 and 5000 words');
      }
    }

    if (chunkOverlap !== undefined) {
      if (typeof chunkOverlap !== 'number' || chunkOverlap < 0 || chunkOverlap > 500) {
        errors.push('Chunk overlap must be between 0 and 500 words');
      }
    }

    if (similarityThreshold !== undefined) {
      if (typeof similarityThreshold !== 'number' || similarityThreshold < 0 || similarityThreshold > 1) {
        errors.push('Similarity threshold must be between 0 and 1');
      }
    }

    if (maxSearchResults !== undefined) {
      if (typeof maxSearchResults !== 'number' || maxSearchResults < 1 || maxSearchResults > 100) {
        errors.push('Max search results must be between 1 and 100');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(', '),
      });
    }

    // Get existing settings
    let settings = await prisma.knowledgeSettings.findFirst();

    // Prepare update data
    const updateData: any = {};
    if (chunkSize !== undefined) updateData.chunkSize = chunkSize;
    if (chunkOverlap !== undefined) updateData.chunkOverlap = chunkOverlap;
    if (similarityThreshold !== undefined) updateData.similarityThreshold = similarityThreshold;
    if (maxSearchResults !== undefined) updateData.maxSearchResults = maxSearchResults;
    if (embeddingModel !== undefined) updateData.embeddingModel = embeddingModel;

    if (settings) {
      // Update existing
      settings = await prisma.knowledgeSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      // Create new
      settings = await prisma.knowledgeSettings.create({
        data: {
          chunkSize: chunkSize || 800,
          chunkOverlap: chunkOverlap || 100,
          similarityThreshold: similarityThreshold || 0.7,
          maxSearchResults: maxSearchResults || 10,
          embeddingModel: embeddingModel || 'sentence-transformers/all-MiniLM-L6-v2',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings',
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
        chunkSize: 800,
        chunkOverlap: 100,
        similarityThreshold: 0.7,
        maxSearchResults: 10,
        embeddingModel: 'nomic-embed-text',
      },
    });
  }

  return settings;
}

export default authMiddleware(handler);
