import { prisma } from '@/lib/prisma';
import { generateAnswer } from '@/lib/llm-service';

export interface ChunkRecord {
  id: string;
  chunkText: string;
  chunkIndex: number;
  sectionHeading: string | null;
  pageTitle: string | null;
  pageUrl: string;
  sourceName: string;
  sourceId: string;
  pageId: string;
  similarity: number;
}

export interface RAGResponse {
  answer: string;
  supportingChunks: ChunkRecord[];
  totalRetrieved: number;
  totalAfterRerank: number;
}

const SYSTEM_PROMPT = `You are a knowledge base assistant.

Use ONLY the information provided in the context below.

Combine information from multiple chunks and pages into a single coherent answer.

Do not mention chunks, embeddings, vector search, reranking, or retrieval.

If information exists across multiple sections, merge it naturally.

If the answer is not present in the provided context, reply:

"The requested information was not found in the knowledge base."

Provide clear, concise, and accurate answers.`;

export async function ragSearch(
  query: string,
  options: {
    sourceId?: string;
    llmModel?: string;
    vectorTopK?: number;
    rerankTopK?: number;
  } = {}
): Promise<RAGResponse> {
  const {
    sourceId,
    llmModel = 'Qwen/Qwen3-4B-Instruct-2507',
    vectorTopK = 50,
    rerankTopK = 10,
  } = options;

  const whereClause: any = {};
  if (sourceId) {
    whereClause.sourceId = sourceId;
  }

  const allChunks = await prisma.knowledgeChunk.findMany({
    where: whereClause,
    include: {
      page: { select: { url: true, pageTitle: true } },
      source: { select: { name: true } },
    },
  });

  if (allChunks.length === 0) {
    return {
      answer: 'The requested information was not found in the knowledge base.',
      supportingChunks: [],
      totalRetrieved: 0,
      totalAfterRerank: 0,
    };
  }

  const queryTerms = tokenize(query);
  const totalDocs = allChunks.length;

  const scored: ChunkRecord[] = [];
  for (const chunk of allChunks) {
    const chunkTerms = tokenize(chunk.chunkText);
    const score = bm25Score(queryTerms, chunkTerms, chunk.chunkText, allChunks.map(c => c.chunkText));
    scored.push({
      id: chunk.id,
      chunkText: chunk.chunkText,
      chunkIndex: chunk.chunkIndex,
      sectionHeading: chunk.sectionHeading,
      pageTitle: chunk.page.pageTitle,
      pageUrl: chunk.page.url,
      sourceName: chunk.source.name,
      sourceId: chunk.sourceId,
      pageId: chunk.pageId,
      similarity: score,
    });
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  const topK = scored.slice(0, vectorTopK);
  const totalRetrieved = scored.length;

  const rerankedChunks = topK.slice(0, rerankTopK);

  const context = buildContext(rerankedChunks);

  let answer: string;
  try {
    answer = await generateAnswer(SYSTEM_PROMPT, buildUserPrompt(context, query), {
      model: llmModel,
      temperature: 0.1,
      maxTokens: 1024,
    });
  } catch {
    answer = 'The requested information was not found in the knowledge base.';
  }

  return {
    answer,
    supportingChunks: rerankedChunks,
    totalRetrieved,
    totalAfterRerank: rerankedChunks.length,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function bm25Score(
  queryTerms: string[],
  docTerms: string[],
  docText: string,
  allDocTexts: string[]
): number {
  const k1 = 1.5;
  const b = 0.75;
  const avgdl = allDocTexts.reduce((s, t) => s + tokenize(t).length, 0) / allDocTexts.length;
  const dl = docTerms.length;

  let score = 0;
  for (const qt of queryTerms) {
    const tf = docTerms.filter(t => t === qt).length;
    if (tf === 0) continue;
    const df = allDocTexts.filter(t => tokenize(t).includes(qt)).length;
    const idf = Math.log((allDocTexts.length - df + 0.5) / (df + 0.5) + 1);
    score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl))));
  }

  if (docText.toLowerCase().includes(queryTerms.join(' '))) {
    score *= 1.5;
  }

  return score;
}

function buildContext(chunks: ChunkRecord[]): string {
  const groups = new Map<string, { pageTitle: string; pageUrl: string; sections: Map<string, string[]> }>();

  for (const chunk of chunks) {
    const key = chunk.pageId;
    if (!groups.has(key)) {
      groups.set(key, {
        pageTitle: chunk.pageTitle || 'Untitled',
        pageUrl: chunk.pageUrl,
        sections: new Map(),
      });
    }
    const group = groups.get(key)!;
    const sectionKey = chunk.sectionHeading || 'General';
    if (!group.sections.has(sectionKey)) {
      group.sections.set(sectionKey, []);
    }
    group.sections.get(sectionKey)!.push(chunk.chunkText);
  }

  const parts: string[] = [];
  for (const group of Array.from(groups.values())) {
    for (const [section, texts] of Array.from(group.sections.entries())) {
      parts.push(`Page: ${group.pageTitle} (${group.pageUrl})`);
      if (section !== 'General') {
        parts.push(`Section: ${section}`);
      }
      parts.push('');
      parts.push(texts.join('\n\n'));
      parts.push('');
    }
  }

  return parts.join('\n').trim();
}

function buildUserPrompt(context: string, query: string): string {
  return `Context:\n${context}\n\nQuestion:\n${query}`;
}
