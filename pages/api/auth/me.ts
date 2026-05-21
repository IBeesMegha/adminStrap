/**
 * Current User API Route
 * GET /api/auth/me
 * Returns current authenticated user data
 */

import type { NextApiResponse } from 'next';
import { withAuth, type AuthenticatedRequest } from '@/lib/middlewares/api/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    // User is already attached by middleware
    return res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
}

export default function (req: any, res: NextApiResponse) {
  return withAuth(req, res, handler);
}
