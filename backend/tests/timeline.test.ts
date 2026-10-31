import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Timeline Management Endpoints (/api/events/:eventId/timeline)', () => {
  const userA = { id: 'user-a-111', email: 'user.a@example.com', fullName: 'User A' };
  const userB = { id: 'user-b-222', email: 'user.b@example.com', fullName: 'User B' };

  const eventUserA = { id: 'evt-a-01', userId: userA.id, name: 'User A Wedding' };
  const eventUserB = { id: 'evt-b-02', userId: userB.id, name: 'User B Corporate' };

  const item1 = {
    id: 'tl-001',
    eventId: eventUserA.id,
    title: 'Floral & Mandap Setup',
    description: 'Florists arrive to prepare stage',
    startTime: new Date('2026-11-20T08:00:00.000Z'),
    endTime: new Date('2026-11-20T10:30:00.000Z'),
    location: 'Main Ballroom',
    category: 'Decoration',
    status: 'scheduled',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  };

  const item2 = {
    id: 'tl-002',
    eventId: eventUserA.id,
    title: 'Wedding Ceremony & Vows',
    description: 'Auspicious ritual time',
    startTime: new Date('2026-11-20T11:00:00.000Z'),
    endTime: new Date('2026-11-20T13:00:00.000Z'),
    location: 'Main Stage',
    category: 'Ceremony',
    status: 'scheduled',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Timeline CRUD Operations', () => {
    it('should create a timeline item with valid time range', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.timelineItem, 'create').mockResolvedValue(item1 as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/timeline`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Floral & Mandap Setup',
          startTime: '2026-11-20T08:00:00.000Z',
          endTime: '2026-11-20T10:30:00.000Z',
          location: 'Main Ballroom',
          category: 'Decoration',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Floral & Mandap Setup');
    });

    it('should reject timeline item where endTime is earlier than startTime', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/timeline`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Invalid Timeline Activity',
          startTime: '2026-11-20T12:00:00.000Z',
          endTime: '2026-11-20T09:00:00.000Z', // earlier than start!
        });

      expect(res.status).toBe(400);
    });

    it('should list timeline activities chronologically', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.timelineItem, 'findMany').mockResolvedValue([item1, item2] as any);

      const res = await request(app)
        .get(`/api/events/${eventUserA.id}/timeline?sortBy=startTime_asc`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].title).toBe('Floral & Mandap Setup');
      expect(res.body.data[1].title).toBe('Wedding Ceremony & Vows');
    });

    it('should update timeline activity and validate new timings', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.timelineItem, 'findUnique').mockResolvedValue(item1 as any);
      vi.spyOn(prisma.timelineItem, 'update').mockResolvedValue({
        ...item1,
        location: 'Garden Courtyard',
      } as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/timeline/${item1.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ location: 'Garden Courtyard' });

      expect(res.status).toBe(200);
      expect(res.body.data.location).toBe('Garden Courtyard');
    });

    it('should delete timeline activity', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.timelineItem, 'findUnique').mockResolvedValue(item1 as any);
      vi.spyOn(prisma.timelineItem, 'delete').mockResolvedValue(item1 as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/timeline/${item1.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Timeline Authorization & Isolation Rules', () => {
    it('should reject User A accessing User B timeline', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .get(`/api/events/${eventUserB.id}/timeline`)
        .set('Authorization', 'Bearer token-user-a');

      expect(res.status).toBe(404);
    });
  });
});

