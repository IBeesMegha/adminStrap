import type { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware } from '@/lib/middlewares/api/auth-middleware';
import { getActiveSession, createSession } from '@/lib/chat-service';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = (req as any).user.id;
    let session = await getActiveSession(userId);
    if (!session) {
      session = await createSession(userId);
    }
    return res.status(200).json({ success: true, data: session });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export default authMiddleware(handler);
