import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifySupabaseToken, AuthenticatedUser } from '../config/supabase.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Authentication middleware that verifies Supabase JWT access tokens
 * and attaches verified user info to req.user.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(ApiError.unauthorized('Authorization header is required'));
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1].trim()) {
      return next(
        ApiError.unauthorized('Invalid authorization header format. Format must be: Bearer <token>')
      );
    }

    const token = parts[1].trim();

    const user = await verifySupabaseToken(token);
    if (!user) {
      return next(ApiError.unauthorized('Invalid, malformed, or expired authentication token'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

