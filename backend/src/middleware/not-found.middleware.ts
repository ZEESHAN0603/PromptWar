import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
