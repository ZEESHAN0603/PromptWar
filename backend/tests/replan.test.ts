import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';
import { geminiService } from '../src/services/gemini.service.js';
import { ApiError } from '../src/utils/ApiError.js';

describe('Adaptive Event Re-Planning Engine (Phase 6 Endpoints)', () => {
  const normalUser = {
    id: '66666666-6666-6666-6666-666666666661',
    email: 'host.replan@eventpilot.example.com',
    fullName: 'Host User',
  };

  const otherUser = {
    id: '66666666-6666-6666-6666-666666666662',
    email: 'other.host@eventpilot.example.com',
    fullName: 'Other Host',
  };

  const baseEvent = {
    id: '33333333-3333-3333-3333-333333333333',
    userId: normalUser.id,
    name: 'Grand Celebration Replan Test',
    type: 'Wedding',
    date: new Date('2026-12-20T18:00:00Z'),
    location: 'Mumbai, Maharashtra',
    guestCount: 200,
    budget: 800000 as any,
    currency: 'INR',
    theme: 'Contemporary Elegance',
    description: 'Initial plan description',
    status: 'planning',
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-15T12:00:00Z'),
  };

  const mockCategories = [
    {
      id: 'cat-1',
      eventId: baseEvent.id,
      name: 'Catering & Food',
      allocatedAmount: 300000 as any,
      expenses: [{ estimatedAmount: 300000 as any, actualAmount: 150000 as any }],
    },
  ];

  const mockExpenses = [
    {
      id: 'exp-1',
      eventId: baseEvent.id,
      categoryId: 'cat-1',
      estimatedAmount: 300000 as any,
      actualAmount: 150000 as any,
    },
  ];

  const mockGuests = [
    {
      id: 'guest-1',
      eventId: baseEvent.id,
      fullName: 'Vikram Mehta',
      rsvpStatus: 'attending',
      plusOneAllowed: true,
      plusOneCount: 1,
    },
  ];

  const mockTasks = [
    {
      id: 'task-1',
      eventId: baseEvent.id,
      title: 'Finalize Stage Decor Design',
      dueDate: new Date('2026-12-05T00:00:00Z'),
      priority: 'high',
      status: 'todo',
      dependencies: [],
    },
  ];

  const mockTimeline = [
    {
      id: 'tl-1',
      eventId: baseEvent.id,
      title: 'Welcome Reception & Cocktails',
      startTime: new Date('2026-12-20T17:00:00Z'),
      endTime: new Date('2026-12-20T19:00:00Z'),
      category: 'Ceremony',
      status: 'scheduled',
    },
  ];

  const mockProposal = {
    id: 'prop-1111-2222-3333-444455556666',
    eventId: baseEvent.id,
    userId: normalUser.id,
    status: 'READY_FOR_REVIEW',
    proposedChanges: {
      budget: { proposed: 700000 },
      guestCount: { proposed: 250 },
      eventDate: { proposed: '2026-12-08T18:00:00Z' },
    },
    impactReport: {
      summary: {
        hasBudgetChange: true,
        hasGuestChange: true,
        hasDateChange: true,
        overallImpactLevel: 'moderate',
        totalConflicts: 0,
        totalAdjustmentsRecommended: 2,
      },
      budgetImpact: {
        budgetDifference: -100000,
        percentageChange: -12.5,
        totalActualExpenses: 150000,
        proposedRemainingBudget: 550000,
      },
      guestImpact: {
        guestDifference: 50,
        percentageChange: 25,
      },
      dateImpact: {
        daysDifference: 12,
      },
    },
    aiRecommendations: {
      summary: 'Adjusted to ₹7L and 250 guests.',
      impactLevel: 'moderate',
      recommendations: [
        {
          category: 'catering',
          title: 'Optimize banquet menu counters',
          description: 'Transition to live culinary counters.',
          reason: 'Accommodates 250 guests within budget.',
          priority: 'high',
          estimatedImpact: '~₹35,000 savings',
          requiresUserApproval: true,
        },
      ],
      warnings: ['Verify venue capacity'],
      alternatives: ['Digital RSVPs'],
    },
    baseEventUpdatedAt: new Date('2026-10-15T12:00:00Z'),
    appliedChanges: null,
    reason: 'Client requested optimization',
    createdAt: new Date('2026-10-16T10:00:00Z'),
    updatedAt: new Date('2026-10-16T10:00:00Z'),
    appliedAt: null,
  };

  const mockVersion = {
    id: 'ver-1111-2222-3333-444455556666',
    eventId: baseEvent.id,
    userId: normalUser.id,
    versionNumber: 1,
    snapshot: {
      event: {
        id: baseEvent.id,
        name: baseEvent.name,
        date: baseEvent.date.toISOString(),
        budget: 800000,
        guestCount: 200,
      },
    },
    changeSummary: {
      approvedChanges: { budget: true },
      appliedAt: '2026-10-16T11:00:00.000Z',
    },
    sourceProposalId: mockProposal.id,
    createdAt: new Date('2026-10-16T11:00:00Z'),
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    // Default auth setup
    vi.spyOn(supabaseModule, 'verifySupabaseToken').mockImplementation(async (token: string) => {
      if (token === 'valid_normal_token') {
        return {
          id: normalUser.id,
          email: normalUser.email,
          user_metadata: { full_name: normalUser.fullName },
        } as any;
      }
      if (token === 'valid_other_token') {
        return {
          id: otherUser.id,
          email: otherUser.email,
          user_metadata: { full_name: otherUser.fullName },
        } as any;
      }
      return null;
    });

    // Default Prisma queries for event & related entities
    vi.spyOn(prisma.event, 'findUnique').mockImplementation(async ({ where }: any) => {
      if (where.id === baseEvent.id) return baseEvent as any;
      return null;
    });

    vi.spyOn(prisma.budgetCategory, 'findMany').mockResolvedValue(mockCategories as any);
    vi.spyOn(prisma.expense, 'findMany').mockResolvedValue(mockExpenses as any);
    vi.spyOn(prisma.guest, 'findMany').mockResolvedValue(mockGuests as any);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue(mockTasks as any);
    vi.spyOn(prisma.timelineItem, 'findMany').mockResolvedValue(mockTimeline as any);
  });

  describe('1. Authentication and Authorization Validation', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan`)
        .send({
          changes: { budget: { proposed: 700000 } },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests for another user event with 404', async () => {
      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan`)
        .set('Authorization', 'Bearer valid_other_token')
        .send({
          changes: { budget: { proposed: 700000 } },
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with empty changes object', async () => {
      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          changes: {},
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Proposal Creation and Gemini Integration', () => {
    it('should successfully create a proposal with deterministic impact and mocked Gemini output', async () => {
      vi.spyOn(geminiService, 'generateReplanRecommendations').mockResolvedValue({
        summary: 'The event budget has been adjusted.',
        impactLevel: 'moderate',
        recommendations: [
          {
            category: 'catering',
            title: 'Optimize banquet menu counters',
            description: 'Transition to live culinary counters.',
            reason: 'Accommodates 250 guests within budget.',
            priority: 'high',
            estimatedImpact: '~₹35,000 savings',
            requiresUserApproval: true,
          },
        ],
        warnings: ['Verify venue capacity'],
        alternatives: ['Digital RSVPs'],
      });

      vi.spyOn(prisma.eventReplanProposal, 'create').mockImplementation(async (args: any) => ({
        id: 'mock-prop-created-id',
        ...args.data,
        createdAt: new Date('2026-10-16T10:00:00Z'),
        updatedAt: new Date('2026-10-16T10:00:00Z'),
      }));

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          changes: {
            budget: { proposed: 700000 },
            guestCount: { proposed: 250 },
            eventDate: { proposed: '2026-12-08T18:00:00Z' },
          },
          reason: 'Client requested cost optimization and expanded guest headcount',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const proposal = res.body.data;
      expect(proposal.proposalId).toBe('mock-prop-created-id');
      expect(proposal.status).toBe('READY_FOR_REVIEW');

      // Verify deterministic calculations
      expect(proposal.impactReport.summary.hasBudgetChange).toBe(true);
      expect(proposal.impactReport.budgetImpact.budgetDifference).toBe(-100000);
      expect(proposal.impactReport.guestImpact.guestDifference).toBe(50);
      expect(proposal.impactReport.dateImpact.daysDifference).toBe(12);

      // Verify AI recommendations
      expect(proposal.aiRecommendations.recommendations.length).toBe(1);
      expect(proposal.aiRecommendations.recommendations[0].title).toBe('Optimize banquet menu counters');
    });

    it('should gracefully persist proposal even if Gemini API call fails', async () => {
      vi.spyOn(geminiService, 'generateReplanRecommendations').mockRejectedValue(
        ApiError.internal('Gemini request timed out')
      );

      vi.spyOn(prisma.eventReplanProposal, 'create').mockImplementation(async (args: any) => ({
        id: 'mock-prop-fallback-id',
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          changes: { budget: { proposed: 750000 } },
          reason: 'Testing Gemini failure resilience',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.impactReport.budgetImpact.budgetDifference).toBe(-50000);
      expect(res.body.data.aiRecommendations).toBeNull();
    });
  });

  describe('3. Proposal Retrieval & Stale State Protection', () => {
    it('should retrieve proposal and report isStale: false when event is unmodified', async () => {
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue(mockProposal as any);

      const res = await request(app)
        .get(`/api/events/${baseEvent.id}/replan/${mockProposal.id}`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.proposalId).toBe(mockProposal.id);
      expect(res.body.data.isStale).toBe(false);
    });

    it('should detect stale proposal when event was modified after proposal generation', async () => {
      // Event updated at 12:00, proposal baseEventUpdatedAt at 10:00 -> stale
      const modifiedEvent = {
        ...baseEvent,
        updatedAt: new Date('2026-10-18T15:00:00Z'),
      };
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(modifiedEvent as any);
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue(mockProposal as any);

      const res = await request(app)
        .get(`/api/events/${baseEvent.id}/replan/${mockProposal.id}`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.isStale).toBe(true);

      // Attempting to apply stale proposal must be rejected with 409 Conflict
      const applyRes = await request(app)
        .post(`/api/events/${baseEvent.id}/replan/${mockProposal.id}/apply`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          approvedChanges: { budget: true, guestCount: false, eventDate: false },
        });

      expect(applyRes.status).toBe(409);
      expect(applyRes.body.message).toContain('modified after this re-planning proposal was generated');
    });
  });

  describe('4. Selective Approval and Transactional Application', () => {
    it('should apply only approved dimensions, create plan version, and mark proposal as APPLIED', async () => {
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue(mockProposal as any);

      // Mock prisma transaction to execute callback with mock tx
      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const mockTx = {
          budgetCategory: { findMany: vi.fn().mockResolvedValue(mockCategories) },
          task: {
            findMany: vi.fn().mockResolvedValue(mockTasks),
            findUnique: vi.fn().mockResolvedValue(mockTasks[0]),
            update: vi.fn().mockResolvedValue({ ...mockTasks[0], dueDate: new Date('2026-12-01') }),
          },
          timelineItem: {
            findMany: vi.fn().mockResolvedValue(mockTimeline),
            findUnique: vi.fn().mockResolvedValue(mockTimeline[0]),
            update: vi.fn().mockResolvedValue(mockTimeline[0]),
          },
          expense: { findMany: vi.fn().mockResolvedValue(mockExpenses) },
          eventPlanVersion: {
            count: vi.fn().mockResolvedValue(0),
            create: vi.fn().mockResolvedValue(mockVersion),
          },
          event: {
            update: vi.fn().mockResolvedValue({
              ...baseEvent,
              budget: 700000,
              guestCount: 250,
            }),
          },
          eventReplanProposal: {
            update: vi.fn().mockResolvedValue({
              ...mockProposal,
              status: 'APPLIED',
              appliedAt: new Date(),
            }),
          },
        };
        return callback(mockTx);
      });

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan/${mockProposal.id}/apply`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          approvedChanges: {
            budget: true,
            guestCount: true,
            eventDate: false,
          },
          approvedTaskChanges: [
            { taskId: mockTasks[0].id, proposedDueDate: '2026-12-01T00:00:00Z' },
          ],
          approvedTimelineChanges: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.versionNumber).toBe(1);
      expect(res.body.data.appliedChanges.budget).toBe(true);
      expect(res.body.data.appliedChanges.eventDate).toBe(false);
    });

    it('should reject application if proposal status is already APPLIED', async () => {
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue({
        ...mockProposal,
        status: 'APPLIED',
      } as any);

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan/${mockProposal.id}/apply`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          approvedChanges: { budget: true, guestCount: false, eventDate: false },
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already been applied');
    });
  });

  describe('5. Proposal Rejection', () => {
    it('should reject a proposal and update its status to REJECTED', async () => {
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue(mockProposal as any);
      vi.spyOn(prisma.eventReplanProposal, 'update').mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
      } as any);

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan/${mockProposal.id}/reject`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REJECTED');
    });

    it('should disallow applying a rejected proposal', async () => {
      vi.spyOn(prisma.eventReplanProposal, 'findUnique').mockResolvedValue({
        ...mockProposal,
        status: 'REJECTED',
      } as any);

      const res = await request(app)
        .post(`/api/events/${baseEvent.id}/replan/${mockProposal.id}/apply`)
        .set('Authorization', 'Bearer valid_normal_token')
        .send({
          approvedChanges: { budget: true, guestCount: false, eventDate: false },
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot apply a rejected');
    });
  });

  describe('6. Version History and Version Comparison', () => {
    it('should list plan versions for an event', async () => {
      vi.spyOn(prisma.eventPlanVersion, 'findMany').mockResolvedValue([mockVersion] as any);

      const res = await request(app)
        .get(`/api/events/${baseEvent.id}/versions`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.versions.length).toBe(1);
      expect(res.body.data.versions[0].versionNumber).toBe(1);
      expect(res.body.data.versions[0].versionLabel).toBe('v1.0');
    });

    it('should retrieve single version snapshot details', async () => {
      vi.spyOn(prisma.eventPlanVersion, 'findUnique').mockResolvedValue({
        ...mockVersion,
        sourceProposal: mockProposal,
      } as any);

      const res = await request(app)
        .get(`/api/events/${baseEvent.id}/versions/${mockVersion.id}`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(mockVersion.id);
      expect(res.body.data.versionNumber).toBe(1);
      expect(res.body.data.snapshot).toBeDefined();
    });

    it('should compare two versions and report differences', async () => {
      const versionA = {
        ...mockVersion,
        id: 'ver-A',
        versionNumber: 1,
        snapshot: { event: { budget: 800000, guestCount: 200 } },
      };

      const versionB = {
        ...mockVersion,
        id: 'ver-B',
        versionNumber: 2,
        snapshot: { event: { budget: 700000, guestCount: 250 } },
      };

      vi.spyOn(prisma.eventPlanVersion, 'findUnique').mockImplementation(async ({ where }: any) => {
        if (where.id === 'ver-A') return versionA as any;
        if (where.id === 'ver-B') return versionB as any;
        return null;
      });

      const res = await request(app)
        .get(`/api/events/${baseEvent.id}/versions/compare?from=ver-A&to=ver-B`)
        .set('Authorization', 'Bearer valid_normal_token');

      expect(res.status).toBe(200);
      expect(res.body.data.fromVersion.versionNumber).toBe(1);
      expect(res.body.data.toVersion.versionNumber).toBe(2);
      expect(res.body.data.differences.length).toBe(2);

      const budgetDiff = res.body.data.differences.find((d: any) => d.field === 'Budget');
      expect(budgetDiff.fromValue).toBe(800000);
      expect(budgetDiff.toValue).toBe(700000);
      expect(budgetDiff.difference).toBe(-100000);

      const guestDiff = res.body.data.differences.find((d: any) => d.field === 'Guest Count');
      expect(guestDiff.fromValue).toBe(200);
      expect(guestDiff.toValue).toBe(250);
      expect(guestDiff.difference).toBe(50);
    });
  });
});
