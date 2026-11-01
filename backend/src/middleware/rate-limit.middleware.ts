import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * In-memory rate limiting middleware for expensive AI generation endpoints.
 * @param windowMs Time window in milliseconds (default: 5 minutes)
 * @param maxRequests Maximum requests permitted within the window (default: 15)
 */
export function createRateLimiter(windowMs: number = 5 * 60 * 1000, maxRequests: number = 15) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Determine key: user ID if authenticated, else IP
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const existing = rateLimitStore.get(key);

    if (!existing || now > existing.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (existing.count >= maxRequests) {
      const waitSeconds = Math.ceil((existing.resetTime - now) / 1000);
      return next(
        ApiError.badRequest(
          `Too many generation requests. Please wait ${waitSeconds} seconds before generating new celebration ideas.`
        )
      );
    }

    existing.count += 1;
    next();
  };
}

export const generateIdeasRateLimiter = createRateLimiter(60 * 1000, 10);

