import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Authentication Middleware & Protected Routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token validation', () => {
    it('should return 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Authorization header is required'),
      });
    });

    it('should return 401 when Authorization header has invalid format', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Format must be: Bearer <token>');
    });

    it('should return 401 when token is invalid or expired according to Supabase', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer expired-or-invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid, malformed, or expired authentication token');
    });

    it('should succeed and proceed when a valid Bearer token is provided', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValueOnce({
        id: 'usr-valid-1',
        email: 'host@eventpilot.example.com',
        fullName: 'Celebration Host',
      });

      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce({
        id: 'usr-valid-1',
        email: 'host@eventpilot.example.com',
        fullName: 'Celebration Host',
        avatarUrl: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('usr-valid-1');
    });

    it('should reject unauthenticated requests to /api/events', async () => {
      const response = await request(app).get('/api/events');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject unauthenticated requests to POST /api/events', async () => {
      const response = await request(app).post('/api/events').send({
        eventName: 'Hacked Event',
      });
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
