import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('User Profile Endpoints (/api/users)', () => {
  const mockUser = {
    id: 'user-profile-test-1',
    email: 'aditi@example.com',
    fullName: 'Aditi Deshmukh',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/users/me', () => {
    it('should retrieve existing profile for the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(mockUser);

      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        avatarUrl: null,
        phoneNumber: '+91 98765 43210',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
      } as any);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(response.body.data.email).toBe(mockUser.email);
      expect(response.body.data.fullName).toBe('Aditi Deshmukh');
    });

    it('should automatically provision profile if it does not exist yet (idempotency)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(mockUser);

      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce(null);
      vi.spyOn(prisma.profile, 'create').mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        avatarUrl: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockUser.id);
      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          id: mockUser.id,
          email: mockUser.email,
          fullName: mockUser.fullName,
          avatarUrl: null,
        },
      });
    });

    it('should reject unauthorized profile access without token', async () => {
      const response = await request(app).get('/api/users/me');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update permitted profile fields (fullName, phoneNumber)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(mockUser);

      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        fullName: 'Old Name',
        avatarUrl: null,
        phoneNumber: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(prisma.profile, 'update').mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        fullName: 'Aditi Updated',
        avatarUrl: 'https://images.example.com/aditi.jpg',
        phoneNumber: '+91 99999 88888',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          fullName: 'Aditi Updated',
          avatarUrl: 'https://images.example.com/aditi.jpg',
          phoneNumber: '+91 99999 88888',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe('Aditi Updated');
      expect(response.body.data.phoneNumber).toBe('+91 99999 88888');
    });

    it('should reject modification of unpermitted fields like email or id', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(mockUser);

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'hacked@example.com',
          id: 'new-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me/events', () => {
    it('should return events belonging to the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(mockUser);

      vi.spyOn(prisma.event, 'findMany').mockResolvedValueOnce([
        {
          id: 'evt-1',
          userId: mockUser.id,
          name: 'Royal Wedding',
          type: 'Wedding',
          date: new Date('2026-12-20'),
          location: 'Udaipur Palace',
          description: 'A grand celebration',
          budget: 500000 as any,
          guestCount: 150,
          currency: 'INR',
          theme: 'Royal',
          status: 'planning',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        } as any,
      ]);

      const response = await request(app)
        .get('/api/users/me/events')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].eventName).toBe('Royal Wedding');
      expect(response.body.data[0].userId).toBe(mockUser.id);
    });
  });
});

