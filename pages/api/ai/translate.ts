import type { NextApiRequest, NextApiResponse } from 'next';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { findUniqueDynamic } from '@/lib/dynamic-prisma';

interface TranslateRequest {
  collectionName: string;
  translationGroupId: string;
  sourceEntryId: string;
  sourceLang: string;
  targetLang: string;
  fields: string[];
}

interface ApiResponse {
  data?: any;
  error?: string;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  console.log('[AI Translate] Request received');
  console.log('[AI Translate] Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      collectionName,
      translationGroupId,
      sourceEntryId,
      sourceLang,
      targetLang,
      fields,
    }: TranslateRequest = req.body;

    // Validate required fields
    if (!collectionName || !translationGroupId || !sourceEntryId || !sourceLang || !targetLang || !fields || fields.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Groq API key not configured. Please add GROQ_API_KEY to your .env file.'
      });
    }

    // Fetch source entry
    const sourceEntries = await findUniqueDynamic(collectionName, sourceEntryId) as any[];

    if (!sourceEntries || sourceEntries.length === 0) {
      return res.status(404).json({ error: 'Source entry not found' });
    }

    const sourceEntry = sourceEntries[0];

    // Verify translation group matches
    if (sourceEntry.translationGroupId !== translationGroupId) {
      return res.status(400).json({ error: 'Translation group ID mismatch' });
    }

    // Verify source language matches
    if (sourceEntry.lang !== sourceLang) {
      return res.status(400).json({ error: 'Source language mismatch' });
    }

    // Get language names for better context
    const [sourceLangData, targetLangData] = await Promise.all([
      prisma.language.findFirst({ where: { code: sourceLang } }),
      prisma.language.findFirst({ where: { code: targetLang } }),
    ]);

    const sourceLangName = sourceLangData?.name || sourceLang;
    const targetLangName = targetLangData?.name || targetLang;

    // Extract content to translate
    const contentToTranslate: Record<string, any> = {};
    fields.forEach(fieldName => {
      if (sourceEntry[fieldName] !== undefined && sourceEntry[fieldName] !== null) {
        contentToTranslate[fieldName] = sourceEntry[fieldName];
      }
    });

    if (Object.keys(contentToTranslate).length === 0) {
      return res.status(400).json({ error: 'No content to translate' });
    }

    // Initialize Groq AI
    const groq = new Groq({
      apiKey: apiKey,
    });

    // Create translation prompt
    const prompt = `You are a professional multilingual CMS translator.

Translate all JSON values from ${sourceLangName} to ${targetLangName}.

CRITICAL RULES:
- Keep JSON structure IDENTICAL
- Do NOT modify keys
- Preserve HTML tags and their attributes exactly
- Preserve arrays and their structure
- Preserve formatting (line breaks, spacing)
- Return ONLY valid JSON
- Do not add explanations or comments
- Translate naturally and professionally
- Maintain the tone and style of the original content

Content to translate:
${JSON.stringify(contentToTranslate, null, 2)}

Return ONLY the translated JSON object with the same keys.`;

    console.log('[AI Translate] Sending request to Groq...');
    console.log('[AI Translate] Source language:', sourceLangName);
    console.log('[AI Translate] Target language:', targetLangName);
    console.log('[AI Translate] Fields to translate:', fields);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Always return valid JSON only, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile', // Fast and good for translations
      temperature: 0.3,
      max_tokens: 8000,
      response_format: { type: 'json_object' }
    });

    let translatedText = completion.choices[0]?.message?.content || '';

    console.log('[AI Translate] Raw response:', translatedText);

    // Clean up response - remove markdown code blocks if present
    translatedText = translatedText.trim();
    if (translatedText.startsWith('```json')) {
      translatedText = translatedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (translatedText.startsWith('```')) {
      translatedText = translatedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse translated content
    let translatedContent: Record<string, any>;
    try {
      translatedContent = JSON.parse(translatedText);
    } catch (parseError) {
      console.error('[AI Translate] Failed to parse response:', parseError);
      console.error('[AI Translate] Response text:', translatedText);
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.'
      });
    }

    // Validate that all requested fields are present
    const missingFields = fields.filter(field => !(field in translatedContent));
    if (missingFields.length > 0) {
      console.warn('[AI Translate] Missing fields in response:', missingFields);
    }

    console.log('[AI Translate] Translation successful');
    console.log('[AI Translate] Translated fields:', Object.keys(translatedContent));

    // Add metadata for translation status
    const responseData = {
      translatedContent,
      sourceLang: sourceLangName,
      targetLang: targetLangName,
      translationStatus: 'AI_GENERATED',
    };

    return res.status(200).json({
      data: responseData
    });

  } catch (error: any) {
    console.error('[AI Translate] Error:', error);

    // Handle specific Groq API errors
    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Invalid Groq API key. Please check your configuration.'
      });
    }

    if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      return res.status(429).json({
        error: 'API rate limit exceeded. Please try again later.'
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to generate translation'
    });
  }
}

export default authMiddleware(handler);
