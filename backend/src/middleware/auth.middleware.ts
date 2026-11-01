import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { verifySupabaseToken, AuthenticatedUser } from '../config/supabase.js';
import { prisma } from '../config/database.js';

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

/**
 * Admin authorization middleware that checks if the authenticated user has role === 'admin'.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user || !req.user.id) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== 'admin') {
      return next(ApiError.forbidden('Admin access required'));
    }

    next();
  } catch (error) {
    next(error);
  }
}


