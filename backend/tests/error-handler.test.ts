import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { ApiError } from '../src/utils/ApiError.js';
import { errorHandler } from '../src/middleware/error.middleware.js';
import { notFoundHandler } from '../src/middleware/not-found.middleware.js';
import { z } from 'zod';

describe('Error Handler Middleware', () => {
  const testApp = express();
  testApp.use(express.json());

  // Test routes to trigger specific errors
  testApp.get('/test/operational-error', () => {
    throw ApiError.badRequest('Invalid request parameters', [
      { field: 'email', message: 'Email is required' },
    ]);
  });

  testApp.get('/test/unauthorized-error', () => {
    throw ApiError.unauthorized('Invalid or expired token');
  });

  testApp.get('/test/forbidden-error', () => {
    throw ApiError.forbidden('User does not have access to this event');
  });

  testApp.get('/test/zod-error', () => {
    const dummySchema = z.object({
      name: z.string({ required_error: 'Name is required' }),
    });
    dummySchema.parse({});
  });

  testApp.get('/test/unhandled-error', () => {
    throw new Error('Database disk full failure');
  });

  // 404 handler
  testApp.use(notFoundHandler);

  // Central error handler
  testApp.use(errorHandler);

  it('should format ApiError into standard error response', async () => {
    const response = await request(testApp).get('/test/operational-error');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Invalid request parameters',
      errors: [{ field: 'email', message: 'Email is required' }],
      stack: expect.any(String),
    });
  });

  it('should format unauthorized error with 401 status', async () => {
    const response = await request(testApp).get('/test/unauthorized-error');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('should format forbidden error with 403 status', async () => {
    const response = await request(testApp).get('/test/forbidden-error');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('User does not have access to this event');
  });

  it('should format Zod validation error with 400 status and field details', async () => {
    const response = await request(testApp).get('/test/zod-error');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('should catch unhandled errors and return 500 status', async () => {
    const response = await request(testApp).get('/test/unhandled-error');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });

  it('should return 404 for nonexistent routes', async () => {
    const response = await request(testApp).get('/test/nonexistent-route-xyz');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Route not found');
  });
});
