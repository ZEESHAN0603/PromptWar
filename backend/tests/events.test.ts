import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Event Management Endpoints (/api/events)', () => {
  const userA = {
    id: 'user-a-123',
    email: 'user.a@example.com',
    fullName: 'User Alpha',
  };

  const userB = {
    id: 'user-b-456',
    email: 'user.b@example.com',
    fullName: 'User Beta',
  };

  const mockEventUserA = {
    id: 'evt-alpha-001',
    userId: userA.id,
    name: 'Alpha Annual Gala',
    type: 'Corporate event',
    date: new Date('2026-11-15T00:00:00.000Z'),
    location: 'Mumbai Convention Center',
    description: 'Corporate annual celebration',
    budget: 350000 as any,
    guestCount: 200,
    theme: 'Modern Minimalist',
    currency: 'INR',
    status: 'planning',
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    updatedAt: new Date('2026-02-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/events (Create Event)', () => {
    it('should create an event and enforce ownership assigned by the backend', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: userA.id } as any);
      vi.spyOn(prisma.event, 'create').mockResolvedValue(mockEventUserA as any);

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer token-user-a')
        .send({
          eventName: 'Alpha Annual Gala',
          eventType: 'Corporate event',
          eventDate: '2026-11-15',
          location: 'Mumbai Convention Center',
          guestCount: 200,
          budget: 350000,
          currency: 'INR',
          // Maliciously attempt to set userId to another user
          userId: 'user-b-456',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventName).toBe('Alpha Annual Gala');
      expect(response.body.data.userId).toBe(userA.id);

      // Verify Prisma was called with userA's ID, ignoring any submitted userId
      expect(prisma.event.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: userA.id,
            name: 'Alpha Annual Gala',
          }),
        })
      );
    });

    it('should reject invalid event data (missing name, missing date, invalid budget)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', 'Bearer token-user-a')
        .send({
          location: 'Missing name and date',
          budget: -500, // Invalid negative budget
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/events (List Events)', () => {
    it('should list only events owned by the authenticated user with pagination', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);

      vi.spyOn(prisma, '$transaction').mockResolvedValueOnce([
        1,
        [mockEventUserA],
      ] as any);

      const response = await request(app)
        .get('/api/events?page=1&limit=10&sortBy=date_asc')
        .set('Authorization', 'Bearer token-user-a');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(1);
      expect(response.body.data.events[0].id).toBe(mockEventUserA.id);
      expect(response.body.data.events[0].userId).toBe(userA.id);
      expect(response.body.data.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('GET /api/events/:eventId (Event Details)', () => {
    it('should retrieve event details if it belongs to the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);

      const response = await request(app)
        .get(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-a');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockEventUserA.id);
      expect(response.body.data.eventName).toBe(mockEventUserA.name);
    });

    it('should reject access (404) when User B tries to view User A event', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userB);
      // User B is requesting User A's event
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);

      const response = await request(app)
        .get(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-b');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event not found');
    });

    it('should return 404 for nonexistent events', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(null);

      const response = await request(app)
        .get('/api/events/nonexistent-id')
        .set('Authorization', 'Bearer token-user-a');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/events/:eventId (Update Event)', () => {
    it('should update an event owned by the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);
      vi.spyOn(prisma.event, 'update').mockResolvedValue({
        ...mockEventUserA,
        name: 'Alpha Annual Gala 2026 Updated',
        guestCount: 250,
      } as any);

      const response = await request(app)
        .patch(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-a')
        .send({
          eventName: 'Alpha Annual Gala 2026 Updated',
          guestCount: 250,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.eventName).toBe('Alpha Annual Gala 2026 Updated');
      expect(response.body.data.guestCount).toBe(250);
    });

    it('should reject updating User A event when requested by User B', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userB);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);
      const updateSpy = vi.spyOn(prisma.event, 'update');

      const response = await request(app)
        .patch(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-b')
        .send({
          eventName: 'Hijacked Event Name',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event not found');
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/events/:eventId (Delete Event)', () => {
    it('should delete an event owned by the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);
      vi.spyOn(prisma.event, 'delete').mockResolvedValue(mockEventUserA as any);

      const response = await request(app)
        .delete(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-a');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);
      expect(prisma.event.delete).toHaveBeenCalledWith({
        where: { id: mockEventUserA.id },
      });
    });

    it('should reject deleting User A event when requested by User B', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userB);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(mockEventUserA as any);
      const deleteSpy = vi.spyOn(prisma.event, 'delete');

      const response = await request(app)
        .delete(`/api/events/${mockEventUserA.id}`)
        .set('Authorization', 'Bearer token-user-b');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Event not found');
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });
});
