import { prisma } from '@/lib/prisma';
import { ragSearch, type ConversationMessage } from '@/lib/rag-service';
import { searchFAQs } from '@/pages/api/knowledge-base/search';

const MAX_CONVERSATION_HISTORY = 8;

export interface ChatSessionData {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface ChatMessageData {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  source: string | null;
  faqQuestion: string | null;
  faqId: string | null;
  relevanceScore: number | null;
  supportingChunks: any;
  totalRetrieved: number | null;
  totalAfterRerank: number | null;
  images: any;
  createdAt: Date;
}

export async function createSession(userId: string): Promise<ChatSessionData> {
  const session = await prisma.chatSession.create({
    data: { userId },
  });
  return session;
}

export async function getActiveSession(userId: string): Promise<ChatSessionData | null> {
  const session = await prisma.chatSession.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return session;
}

export async function getSessionMessages(sessionId: string): Promise<ChatMessageData[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
  return messages;
}

export async function getConversationHistory(sessionId: string): Promise<ConversationMessage[]> {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONVERSATION_HISTORY,
    select: { role: true, content: true },
  });
  return messages.reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
}

export async function closeSession(sessionId: string): Promise<void> {
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: { status: 'closed' },
  });
}

export async function newChat(userId: string): Promise<ChatSessionData> {
  const activeSession = await getActiveSession(userId);
  if (activeSession) {
    await closeSession(activeSession.id);
  }
  return createSession(userId);
}

export async function getAllSessions(options?: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: any[]; total: number }> {
  const where: any = {};
  if (options?.userId) where.userId = options.userId;

  const [sessions, total] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.chatSession.count({ where }),
  ]);

  return { sessions, total };
}

export async function sendMessage(
  sessionId: string,
  query: string,
  options?: {
    sourceId?: string;
    llmModel?: string;
    vectorTopK?: number;
    rerankTopK?: number;
    skipFAQ?: boolean;
  }
): Promise<{
  userMessage: ChatMessageData;
  assistantMessage: ChatMessageData;
}> {
  const queryTrimmed = query.trim();
  if (!queryTrimmed) throw new Error('Query is required');

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');
  if (session.status !== 'active') throw new Error('Session is closed');

  // Save user message
  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'user',
      content: queryTrimmed,
    },
  });

  // Update session title from first user message if still default
  if (session.title === 'New Chat') {
    const title = queryTrimmed.length > 100 ? queryTrimmed.slice(0, 97) + '...' : queryTrimmed;
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
  }

  // Get conversation history
  const conversationHistory = await getConversationHistory(sessionId);

  // Try FAQ match first
  if (!options?.skipFAQ) {
    const faqResult = await searchFAQs(queryTrimmed);
    if (faqResult.matched && faqResult.answer) {
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: faqResult.answer,
          source: 'faq',
          faqQuestion: faqResult.question || null,
          faqId: faqResult.id || null,
          relevanceScore: faqResult.relevanceScore || null,
        },
      });
      return { userMessage, assistantMessage };
    }
  }

  // Run RAG search with conversation history
  const result = await ragSearch(queryTrimmed, {
    sourceId: options?.sourceId,
    llmModel: options?.llmModel,
    vectorTopK: options?.vectorTopK,
    rerankTopK: options?.rerankTopK,
    conversationHistory,
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      role: 'assistant',
      content: result.answer,
      source: 'rag',
      supportingChunks: JSON.parse(JSON.stringify(result.supportingChunks || [])),
      totalRetrieved: result.totalRetrieved,
      totalAfterRerank: result.totalAfterRerank,
      images: result.images ? JSON.parse(JSON.stringify(result.images)) : [],
    },
  });

  return { userMessage, assistantMessage };
}
