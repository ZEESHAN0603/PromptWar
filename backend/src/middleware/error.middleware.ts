import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Handled Operational ApiError
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.warn({ path: req.path, status: err.statusCode }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      ...(isProduction ? {} : { stack: err.stack }),
    });
    return;
  }

  // 2. Zod Validation Error
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    logger.warn({ path: req.path, errors: formattedErrors }, 'Validation error');

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      ...(isProduction ? {} : { stack: err.stack }),
    });
    return;
  }

  // 3. SyntaxError (e.g. malformed JSON in request body)
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    logger.warn({ path: req.path, message: err.message }, 'Malformed JSON body');
    res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received in request body',
      errors: [],
    });
    return;
  }

  // 4. Unhandled / Internal Server Error
  logger.error({ err, path: req.path }, 'Unhandled server error');

  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message || 'Internal server error',
    errors: [],
    ...(isProduction ? {} : { stack: err.stack }),
  });
}

