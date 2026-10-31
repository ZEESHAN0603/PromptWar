import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Guest Management Endpoints (/api/events/:eventId/guests)', () => {
  const userA = { id: 'user-a-111', email: 'user.a@example.com', fullName: 'User A' };
  const userB = { id: 'user-b-222', email: 'user.b@example.com', fullName: 'User B' };

  const eventUserA = { id: 'evt-a-01', userId: userA.id, name: 'User A Wedding' };
  const eventUserB = { id: 'evt-b-02', userId: userB.id, name: 'User B Birthday' };

  const mockGuest = {
    id: 'guest-001',
    eventId: eventUserA.id,
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phoneNumber: '+91 98765 43210',
    guestCategory: 'Family',
    rsvpStatus: 'attending',
    plusOneAllowed: true,
    plusOneCount: 2,
    dietaryPreference: 'Vegetarian',
    notes: 'Table 4 reserved',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Guest CRUD Operations', () => {
    it('should create a guest with valid data and plus-one count', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.guest, 'create').mockResolvedValue(mockGuest as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/guests`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          fullName: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          phoneNumber: '+91 98765 43210',
          guestCategory: 'Family',
          rsvpStatus: 'attending',
          plusOneAllowed: true,
          plusOneCount: 2,
          dietaryPreference: 'Vegetarian',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fullName).toBe('Rahul Sharma');
      expect(res.body.data.plusOneCount).toBe(2);
    });

    it('should reject invalid email format', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/guests`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          fullName: 'Rahul Sharma',
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
    });

    it('should reject negative plus-one count', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/guests`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          fullName: 'Rahul Sharma',
          plusOneCount: -1,
        });

      expect(res.status).toBe(400);
    });

    it('should update guest RSVP status', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.guest, 'findUnique').mockResolvedValue(mockGuest as any);
      vi.spyOn(prisma.guest, 'update').mockResolvedValue({
        ...mockGuest,
        rsvpStatus: 'declined',
      } as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/guests/${mockGuest.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ rsvpStatus: 'declined' });

      expect(res.status).toBe(200);
      expect(res.body.data.rsvpStatus).toBe('declined');
    });

    it('should delete a guest', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.guest, 'findUnique').mockResolvedValue(mockGuest as any);
      vi.spyOn(prisma.guest, 'delete').mockResolvedValue(mockGuest as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/guests/${mockGuest.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  describe('Guest Summary Calculations', () => {
    it('should aggregate guest counts, RSVP statuses, and total headcounts accurately', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const sampleGuests = [
        {
          id: 'g1',
          fullName: 'Guest One',
          rsvpStatus: 'attending',
          plusOneCount: 1, // 1 + 1 = 2
          guestCategory: 'Family',
          dietaryPreference: 'Vegetarian',
        },
        {
          id: 'g2',
          fullName: 'Guest Two',
          rsvpStatus: 'confirmed', // alias for attending
          plusOneCount: 2, // 1 + 2 = 3
          guestCategory: 'Friends',
          dietaryPreference: 'Vegetarian',
        },
        {
          id: 'g3',
          fullName: 'Guest Three',
          rsvpStatus: 'declined',
          plusOneCount: 0,
          guestCategory: 'Colleagues',
          dietaryPreference: 'Non-Vegetarian',
        },
        {
          id: 'g4',
          fullName: 'Guest Four',
          rsvpStatus: 'pending',
          plusOneCount: 1,
          guestCategory: 'Family',
          dietaryPreference: null,
        },
      ];

      vi.spyOn(prisma.guest, 'findMany').mockResolvedValue(sampleGuests as any);

      const res = await request(app)
        .get(`/api/events/${eventUserA.id}/guest-summary`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      const summary = res.body.data;
      expect(summary.totalGuests).toBe(4);
      expect(summary.attendingCount).toBe(2);
      expect(summary.declinedCount).toBe(1);
      expect(summary.pendingCount).toBe(1);
      expect(summary.totalPermittedPlusOnes).toBe(4); // 1 + 2 + 0 + 1
      expect(summary.expectedAttendeesHeadcount).toBe(5); // g1(2) + g2(3) = 5
      expect(summary.dietaryBreakdown.Vegetarian).toBe(2);
      expect(summary.categoryBreakdown.Family).toBe(2);
    });
  });

  describe('Guest Authorization & Cross-Event Isolation', () => {
    it('should reject User A accessing User B guest list', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .get(`/api/events/${eventUserB.id}/guests`)
        .set('Authorization', 'Bearer token-user-a');

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Event not found');
    });

    it('should reject User A modifying User B guest', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserB.id}/guests/some-guest-id`)
        .set('Authorization', 'Bearer token-user-a')
        .send({ fullName: 'Malicious Edit' });

      expect(res.status).toBe(404);
    });
  });
});

