/**
 * API Authentication Middleware
 * Protects API routes by verifying JWT access tokens
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getAccessToken } from '@/lib/auth/cookies';
import { getUserById } from '@/lib/auth/auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
}

/**
 * Middleware to authenticate API requests
 * Verifies JWT token and attaches user to request
 */
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
): Promise<void> {
  try {
    // Get access token from cookies
    const accessToken = getAccessToken(req);

    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(accessToken);

    // Get user from database
    const user = await getUserById(decoded.userId);

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated',
      });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = user;

    // Call the actual handler
    return handler(req as AuthenticatedRequest, res);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

/**
 * Middleware to check if user has specific role
 */
export function withRole(roles: string[]) {
  return async (
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
  ): Promise<void> => {
    return withAuth(req, res, async (authReq, authRes) => {
      if (!roles.includes(authReq.user.role)) {
        return authRes.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }

      return handler(authReq, authRes);
    });
  };
}
