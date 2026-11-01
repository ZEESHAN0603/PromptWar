import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Community Vendor & Recommendation System Endpoints', () => {
  const normalUser = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'normal.user@example.com',
    fullName: 'Normal User',
  };

  const adminUser = {
    id: '99999999-9999-9999-9999-999999999999',
    email: 'admin.user@example.com',
    fullName: 'Admin User',
  };

  const otherUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'other.user@example.com',
    fullName: 'Other User',
  };

  const testEvent = {
    id: '33333333-3333-3333-3333-333333333333',
    userId: normalUser.id,
    name: 'Dream Wedding Celebration',
    type: 'Wedding',
    location: 'Mumbai, Maharashtra',
    budget: 800000 as any,
    currency: 'INR',
    budgetCategories: [
      {
        id: '44444444-4444-4444-4444-444444444444',
        eventId: '33333333-3333-3333-3333-333333333333',
        name: 'Catering',
        allocatedAmount: 300000 as any,
      },
    ],
  };

  const approvedVendor1 = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Royal Feast Caterers',
    slug: 'royal-feast-caterers-mumbai',
    category: 'Catering',
    description: 'Premier culinary services for celebrations',
    city: 'Mumbai',
    country: 'India',
    publicPhone: '+91 98765 43210',
    publicEmail: 'contact@royalfeast.in',
    websiteUrl: 'https://royalfeast.in',
    serviceAreas: ['Mumbai', 'Thane', 'Navi Mumbai'],
    eventTypes: ['Wedding', 'Reception', 'Anniversary'],
    priceInformation: { startingPrice: 150000, priceRange: 'mid', currency: 'INR' },
    rating: 4.9 as any,
    status: 'approved',
    submittedBy: normalUser.id,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
  };

  const pendingVendor = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Sparkle Decorators',
    slug: 'sparkle-decorators-delhi',
    category: 'Decoration',
    city: 'Delhi',
    status: 'pending',
    submittedBy: normalUser.id,
    createdAt: new Date('2026-01-02T10:00:00Z'),
    updatedAt: new Date('2026-01-02T10:00:00Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Public Community Vendor Discovery (GET /api/vendors)', () => {
    it('should list approved community vendors without authentication', async () => {
      vi.spyOn(prisma.communityVendor, 'count').mockResolvedValue(1);
      vi.spyOn(prisma.communityVendor, 'findMany').mockResolvedValue([approvedVendor1 as any]);

      const res = await request(app).get('/api/vendors?category=Catering');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendors).toHaveLength(1);
      expect(res.body.data.vendors[0].name).toBe('Royal Feast Caterers');
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should return vendor details by ID for approved vendors', async () => {
      vi.spyOn(prisma.communityVendor, 'findUnique').mockResolvedValue(approvedVendor1 as any);

      const res = await request(app).get(`/api/vendors/${approvedVendor1.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendor.id).toBe(approvedVendor1.id);
    });

    it('should return 404 when querying pending or non-existent vendor', async () => {
      vi.spyOn(prisma.communityVendor, 'findUnique').mockResolvedValue(pendingVendor as any);

      const res = await request(app).get(`/api/vendors/${pendingVendor.id}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Customer Vendor Contribution (POST /api/vendors/contributions)', () => {
    it('should reject unauthenticated contributions with 401', async () => {
      const res = await request(app)
        .post('/api/vendors/contributions')
        .send({
          name: 'Flora Design',
          category: 'Decoration',
          city: 'Mumbai',
          relationshipType: 'customer',
          consentConfirmed: true,
        });

      expect(res.status).toBe(401);
    });

    it('should reject submission without mandatory consent with 400', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);

      const res = await request(app)
        .post('/api/vendors/contributions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Flora Design',
          category: 'Decoration',
          city: 'Mumbai',
          relationshipType: 'customer',
          consentConfirmed: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should create pending vendor contribution with consent confirmed', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.communityVendor, 'findMany').mockResolvedValue([]); // duplicate check returns empty

      const createdVendor = {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Flora Design',
        slug: 'flora-design-mumbai-abc12',
        category: 'Decoration',
        city: 'Mumbai',
        status: 'pending',
        submittedBy: normalUser.id,
      };

      const createdContribution = {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        vendorId: createdVendor.id,
        submittedBy: normalUser.id,
        relationshipType: 'customer',
        reviewStatus: 'pending',
        consentConfirmed: true,
      };

      vi.spyOn(prisma, '$transaction').mockResolvedValue({
        vendor: createdVendor,
        contribution: createdContribution,
      } as any);

      const res = await request(app)
        .post('/api/vendors/contributions')
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Flora Design',
          category: 'Decoration',
          city: 'Mumbai',
          relationshipType: 'customer',
          consentConfirmed: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vendor.status).toBe('pending');
      expect(res.body.data.contribution.reviewStatus).toBe('pending');
    });

    it('should flag duplicate warnings when matching existing vendor', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.communityVendor, 'findMany').mockResolvedValue([approvedVendor1 as any]);

      const res = await request(app)
        .get('/api/vendors/check-duplicates?name=Royal+Feast+Catering&city=Mumbai&publicPhone=9876543210')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasPotentialDuplicate).toBe(true);
      expect(res.body.data.matches.length).toBeGreaterThan(0);
      expect(res.body.data.matches[0].name).toBe('Royal Feast Caterers');
    });
  });

  describe('3. Deterministic Recommendation Engine (GET /api/events/:eventId/vendor-recommendations)', () => {
    it('should calculate accurate match score breakdown for event requirements', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
      vi.spyOn(prisma.communityVendor, 'findMany').mockResolvedValue([approvedVendor1 as any]);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/vendor-recommendations?category=Catering`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toHaveLength(1);

      const rec = res.body.data.recommendations[0];
      // Category (40) + City (25) + Service Area (15) + EventType (10) + Budget (10) = 100
      expect(rec.score).toBe(100);
      expect(rec.scoreDetails.categoryMatch.score).toBe(40);
      expect(rec.scoreDetails.cityMatch.score).toBe(25);
      expect(rec.scoreDetails.serviceAreaMatch.score).toBe(15);
      expect(rec.scoreDetails.eventTypeMatch.score).toBe(10);
      expect(rec.scoreDetails.budgetMatch.score).toBe(10);
      expect(rec.reasons.length).toBeGreaterThan(0);
    });

    it('should return 404 when requesting recommendations for another users event', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(otherUser);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/events/${testEvent.id}/vendor-recommendations`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(404);
    });
  });

  describe('4. My Saved Vendors (GET, POST, DELETE /api/users/me/saved-vendors)', () => {
    it('should save approved community vendor to personal list', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.communityVendor, 'findUnique').mockResolvedValue(approvedVendor1 as any);
      vi.spyOn(prisma.myVendor, 'findUnique').mockResolvedValue(null);

      const savedRecord = {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        userId: normalUser.id,
        vendorId: approvedVendor1.id,
        personalNotes: 'Spoke with manager, great pricing',
        savedAt: new Date(),
        vendor: approvedVendor1,
      };

      vi.spyOn(prisma.myVendor, 'create').mockResolvedValue(savedRecord as any);

      const res = await request(app)
        .post('/api/users/me/saved-vendors')
        .set('Authorization', 'Bearer valid-token')
        .send({
          vendorId: approvedVendor1.id,
          personalNotes: 'Spoke with manager, great pricing',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.savedVendor.vendorId).toBe(approvedVendor1.id);
    });

    it('should prevent duplicate saving with 409 conflict', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.communityVendor, 'findUnique').mockResolvedValue(approvedVendor1 as any);
      vi.spyOn(prisma.myVendor, 'findUnique').mockResolvedValue({ id: 'existing' } as any);

      const res = await request(app)
        .post('/api/users/me/saved-vendors')
        .set('Authorization', 'Bearer valid-token')
        .send({ vendorId: approvedVendor1.id });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should list all saved vendors for the authenticated user', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.myVendor, 'findMany').mockResolvedValue([
        {
          id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          userId: normalUser.id,
          vendorId: approvedVendor1.id,
          vendor: approvedVendor1,
        } as any,
      ]);

      const res = await request(app)
        .get('/api/users/me/saved-vendors')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.savedVendors).toHaveLength(1);
    });

    it('should remove saved vendor bookmark', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.myVendor, 'findFirst').mockResolvedValue({ id: 'saved-1', userId: normalUser.id } as any);
      vi.spyOn(prisma.myVendor, 'delete').mockResolvedValue({} as any);

      const res = await request(app)
        .delete('/api/users/me/saved-vendors/saved-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Event Vendor Selections & Management (/api/events/:eventId/vendors)', () => {
    it('should assign community vendor to event workspace', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
      vi.spyOn(prisma.communityVendor, 'findUnique').mockResolvedValue(approvedVendor1 as any);
      vi.spyOn(prisma.eventVendor, 'findUnique').mockResolvedValue(null);

      const createdEventVendor = {
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        eventId: testEvent.id,
        vendorId: approvedVendor1.id,
        category: 'Catering',
        selectionStatus: 'shortlisted',
        contactStatus: 'not_contacted',
        estimatedCost: 180000 as any,
        currency: 'INR',
        vendor: approvedVendor1,
        expenses: [],
      };

      vi.spyOn(prisma.eventVendor, 'create').mockResolvedValue(createdEventVendor as any);

      const res = await request(app)
        .post(`/api/events/${testEvent.id}/vendors`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          vendorId: approvedVendor1.id,
          selectionStatus: 'shortlisted',
          estimatedCost: 180000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventVendor.category).toBe('Catering');
    });

    it('should update event vendor status and actual cost', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.event, 'findFirst').mockResolvedValue(testEvent as any);
      vi.spyOn(prisma.eventVendor, 'findFirst').mockResolvedValue({
        id: 'ev-1',
        eventId: testEvent.id,
        selectionStatus: 'shortlisted',
      } as any);

      vi.spyOn(prisma.eventVendor, 'update').mockResolvedValue({
        id: 'ev-1',
        eventId: testEvent.id,
        selectionStatus: 'hired',
        contactStatus: 'contract_signed',
        actualCost: 175000 as any,
      } as any);

      const res = await request(app)
        .patch(`/api/events/${testEvent.id}/vendors/ev-1`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          selectionStatus: 'hired',
          contactStatus: 'contract_signed',
          actualCost: 175000,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.eventVendor.selectionStatus).toBe('hired');
    });
  });

  describe('6. Admin Moderation Workflow (/api/admin/vendor-contributions)', () => {
    it('should block non-admin users with 403 Forbidden', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(normalUser);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: normalUser.id, role: 'user' } as any);

      const res = await request(app)
        .get('/api/admin/vendor-contributions')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Admin access required/i);
    });

    it('should allow admin to list pending contributions', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(adminUser);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: adminUser.id, role: 'admin' } as any);
      vi.spyOn(prisma.vendorContribution, 'findMany').mockResolvedValue([
        {
          id: 'contrib-1',
          vendorId: pendingVendor.id,
          reviewStatus: 'pending',
          vendor: pendingVendor,
          submitter: { id: normalUser.id, email: normalUser.email, fullName: normalUser.fullName },
        } as any,
      ]);

      const res = await request(app)
        .get('/api/admin/vendor-contributions')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contributions).toHaveLength(1);
    });

    it('should allow admin to approve a contribution and activate vendor', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(adminUser);
      vi.spyOn(prisma.profile, 'findUnique').mockResolvedValue({ id: adminUser.id, role: 'admin' } as any);
      vi.spyOn(prisma.vendorContribution, 'findUnique').mockResolvedValue({
        id: 'contrib-1',
        vendorId: pendingVendor.id,
        vendor: pendingVendor,
      } as any);

      vi.spyOn(prisma, '$transaction').mockResolvedValue({
        contribution: { id: 'contrib-1', reviewStatus: 'approved', reviewedBy: adminUser.id },
        vendor: { id: pendingVendor.id, status: 'approved' },
      } as any);

      const res = await request(app)
        .post('/api/admin/vendor-contributions/contrib-1/review')
        .set('Authorization', 'Bearer admin-token')
        .send({
          action: 'approve',
          reviewNotes: 'Verified phone and service quality. Approved.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contribution.reviewStatus).toBe('approved');
      expect(res.body.data.vendor.status).toBe('approved');
    });
  });
});

