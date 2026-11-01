import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';
import { geminiService } from '../src/services/gemini.service.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('Personalized Celebration Ideas Engine (Phase 5 Endpoints)', () => {
  const normalUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'normal.user@example.com',
    fullName: 'Normal User',
  };

  const otherUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'other.user@example.com',
    fullName: 'Other User',
  };

  const testEvent = {
    id: '33333333-3333-3333-3333-333333333333',
    userId: normalUser.id,
    name: 'Royal Heritage Wedding',
    type: 'Wedding',
    date: new Date('2026-12-15T18:00:00Z'),
    location: 'Jaipur, Rajasthan',
    guestCount: 200,
    budget: 1500000 as any,
    currency: 'INR',
    theme: 'Royal Palace Heritage',
    description: 'A grand traditional wedding celebration in Jaipur with heritage elements',
  };

  const mockGeneratedGeminiOutput = {
    eventContext: {
      eventType: 'Wedding',
      budget: 1500000,
      guestCount: 200,
    },
    categories: [
      {
        category: 'theme',
        ideas: [
          {
            title: 'Rajputana Royal Grandeur',
            description: 'Intricately carved jharokha backdrops with marigold garlands and royal brass lanterns.',
            reason: 'Directly complements your Jaipur heritage celebration and 200 guest count.',
            colorPalette: ['Royal Crimson', 'Antique Gold', 'Emerald Green'],
            estimatedCost: {
              min: 80000,
              max: 120000,
              currency: 'INR',
              basis: 'Estimated decor range for 200 guests in Jaipur',
            },
            budgetSuitability: 'Fits comfortably within the ₹15,00,000 budget',
            implementationTips: ['Rent vintage brass urlis from local Johari Bazaar vendors', 'Use local marigold strings'],
            alternatives: ['Warm ambient candlelight with terracotta lamps for ₹45,000'],
          },
        ],
      },
      {
        category: 'food',
        ideas: [
          {
            title: 'Royal Dal Baati Churma & Live Ker Sangri Bar',
            description: 'Authentic royal Rajasthani banquet stations served with pure desi ghee and artisanal breads.',
            reason: 'Delights out-of-town guests with an immersive culinary taste of Rajasthan.',
            colorPalette: ['Saffron', 'Terracotta'],
            estimatedCost: {
              min: 150000,
              max: 220000,
              currency: 'INR',
              basis: 'Catering estimate for 200 plates',
            },
            budgetSuitability: 'Aligned with premium wedding catering standards',
            implementationTips: ['Station dedicated server per counter for interactive guest engagement'],
            alternatives: ['Pre-plated multi-course thali to streamline service'],
          },
        ],
      },
    ],
  };

  const existingDbIdea = {
    id: '44444444-4444-4444-4444-444444444444',
    eventId: testEvent.id,
    title: 'Heritage Brass Urli Floating Blossom Pathway',
    description: 'Handcrafted antiqued brass urlis filled with fresh rose petals.',
    category: 'decoration',
    estimatedBudgetRange: '₹15,000 – ₹24,000',
    matchReason: 'Delivers a grand arrival sequence tailored for Jaipur.',
    alternatives: ['Terracotta floral diya bowls'],
    tags: ['Traditional', 'Grand Arrival'],
    content: null,
    generationId: 'gen_batch_1',
    isSaved: false,
    createdAt: new Date('2026-10-31T10:00:00Z'),
    updatedAt: new Date('2026-10-31T10:00:00Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Authentication and Authorization Validation', () => {
    it('should reject unauthenticated generation request with 401', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .send({ categories: ['theme'] });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Authorization header is required');
    });

    it('should reject access to another user\'s event with 404', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(otherUser as any);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: otherUser.id, role: 'user' } as any);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-other-user-token')
        .send({ categories: ['theme'] });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Event not found or access denied');
    });
  });

  describe('2. Request Input and Preference Validation', () => {
    beforeEach(() => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser as any);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: normalUser.id, role: 'user' } as any);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
    });

    it('should reject empty categories array with 400 validation error', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ categories: [] });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid venuePreference value with 400', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          categories: ['theme'],
          preferences: { venuePreference: 'underwater-submarine' },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Gemini AI Generation & Output Validation', () => {
    beforeEach(() => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser as any);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: normalUser.id, role: 'user' } as any);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
    });

    it('should successfully generate, validate, and persist personalized celebration ideas', async () => {
      vi.spyOn(geminiService, 'generateCelebrationIdeas').mockResolvedValue(mockGeneratedGeminiOutput as any);
      vi.spyOn(prisma.personalizedIdea, 'create').mockImplementation(async (args: any) => ({
        id: 'mock-created-idea-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          categories: ['theme', 'food'],
          preferences: {
            preferredColors: ['Crimson', 'Gold'],
            atmosphere: 'Royal Heritage',
            venuePreference: 'outdoor',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generationId).toBeDefined();
      expect(res.body.data.totalGenerated).toBe(2);
      expect(res.body.data.ideas).toHaveLength(2);
      expect(prisma.personalizedIdea.create).toHaveBeenCalledTimes(2);
    });

    it('should handle Gemini API quota exhaustion error gracefully', async () => {
      vi.spyOn(geminiService, 'generateCelebrationIdeas').mockRejectedValue(
        ApiError.badRequest('Gemini API rate limit or quota exceeded. Please try again shortly.')
      );

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ categories: ['theme'] });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('quota exceeded');
    });

    it('should handle Gemini timeout gracefully with 500 ApiError', async () => {
      vi.spyOn(geminiService, 'generateCelebrationIdeas').mockRejectedValue(
        ApiError.internal('Gemini request timed out. Please try again.')
      );

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ categories: ['theme'] });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain('timed out');
    });

    it('should handle malformed Gemini JSON output without crashing', async () => {
      vi.spyOn(geminiService, 'generateCelebrationIdeas').mockRejectedValue(
        ApiError.internal('Gemini returned a malformed response format. Please try again.')
      );

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/generate`)
        .set('Authorization', 'Bearer valid-token')
        .send({ categories: ['theme'] });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain('malformed response');
    });
  });

  describe('4. Retrieval, Category Filtering, and Single Idea Details', () => {
    beforeEach(() => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser as any);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: normalUser.id, role: 'user' } as any);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
    });

    it('should retrieve all ideas for an event', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findMany').mockResolvedValue([existingDbIdea as any]);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/ideas`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ideas).toHaveLength(1);
      expect(res.body.data.ideas[0].title).toBe(existingDbIdea.title);
    });

    it('should filter ideas by category', async () => {
      const decorIdea = { ...existingDbIdea, id: '1', category: 'decoration' };
      const foodIdea = { ...existingDbIdea, id: '2', category: 'food' };
      vi.spyOn(prisma.personalizedIdea, 'findMany').mockResolvedValue([decorIdea, foodIdea] as any);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/ideas?category=food`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.ideas).toHaveLength(1);
      expect(res.body.data.ideas[0].category).toBe('food');
    });

    it('should retrieve single idea by ID', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findFirst').mockResolvedValue(existingDbIdea as any);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/ideas/${existingDbIdea.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.idea.id).toBe(existingDbIdea.id);
    });

    it('should return 404 when retrieving a non-existent idea', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/ideas/non-existent-uuid`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
    });
  });

  describe('5. Saving, Unsaving, and Deleting Ideas', () => {
    beforeEach(() => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser as any);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: normalUser.id, role: 'user' } as any);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
    });

    it('should mark an idea as favorite via POST /save', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findFirst').mockResolvedValue(existingDbIdea as any);
      vi.spyOn(prisma.personalizedIdea, 'update').mockResolvedValue({
        ...existingDbIdea,
        isSaved: true,
      } as any);

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/ideas/${existingDbIdea.id}/save`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.idea.isSaved).toBe(true);
      expect(prisma.personalizedIdea.update).toHaveBeenCalledWith({
        where: { id: existingDbIdea.id },
        data: { isSaved: true },
      });
    });

    it('should remove an idea from favorites via DELETE /save', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findFirst').mockResolvedValue({
        ...existingDbIdea,
        isSaved: true,
      } as any);
      vi.spyOn(prisma.personalizedIdea, 'update').mockResolvedValue({
        ...existingDbIdea,
        isSaved: false,
      } as any);

      const res = await request(app)
        .delete(`/api/events/${testEvent.id}/ideas/${existingDbIdea.id}/save`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.idea.isSaved).toBe(false);
      expect(prisma.personalizedIdea.update).toHaveBeenCalledWith({
        where: { id: existingDbIdea.id },
        data: { isSaved: false },
      });
    });

    it('should delete an idea with ownership verification', async () => {
      vi.spyOn(prisma.personalizedIdea, 'findFirst').mockResolvedValue(existingDbIdea as any);
      vi.spyOn(prisma.personalizedIdea, 'delete').mockResolvedValue(existingDbIdea as any);

      const res = await request(app)
        .delete(`/api/events/${testEvent.id}/ideas/${existingDbIdea.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
      expect(prisma.personalizedIdea.delete).toHaveBeenCalledWith({
        where: { id: existingDbIdea.id },
      });
    });
  });
});

