import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { getAllSessions } from '@/lib/chat-service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.query.userId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await getAllSessions({ userId, limit, offset });
    return res.status(200).json({ success: true, data: result.sessions, total: result.total });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default authMiddleware(handler);
