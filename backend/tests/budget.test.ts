import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Budget & Expense Management Endpoints (/api/events/:eventId)', () => {
  const userA = { id: '11111111-1111-1111-1111-111111111111', email: 'user.a@example.com', fullName: 'User A' };
  const userB = { id: '22222222-2222-2222-2222-222222222222', email: 'user.b@example.com', fullName: 'User B' };

  const eventUserA = {
    id: '33333333-3333-3333-3333-333333333333',
    userId: userA.id,
    name: 'User A Grand Wedding',
    budget: 500000 as any,
    currency: 'INR',
  };

  const eventUserB = {
    id: '44444444-4444-4444-4444-444444444444',
    userId: userB.id,
    name: 'User B Private Birthday',
    budget: 50000 as any,
    currency: 'INR',
  };

  const mockCategory = {
    id: '55555555-5555-5555-5555-555555555555',
    eventId: eventUserA.id,
    name: 'Catering & Dining',
    allocatedAmount: 150000 as any,
    description: 'Food and drink services',
    color: '#10b981',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  };

  const mockExpense = {
    id: '66666666-6666-6666-6666-666666666666',
    eventId: eventUserA.id,
    categoryId: mockCategory.id,
    title: 'Welcome Dinner Buffet',
    description: 'Advance payment for live stations',
    estimatedAmount: 120000 as any,
    actualAmount: 130000 as any,
    expenseDate: new Date('2026-03-05T00:00:00.000Z'),
    paymentStatus: 'paid',
    notes: 'Paid via bank transfer',
    createdAt: new Date('2026-03-02T10:00:00.000Z'),
    updatedAt: new Date('2026-03-02T10:00:00.000Z'),
    category: { id: mockCategory.id, name: mockCategory.name, color: mockCategory.color },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // Budget Category Tests
  // ==========================================
  describe('Budget Category Management', () => {
    it('should create a budget category for an authorized event', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.budgetCategory, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.budgetCategory, 'create').mockResolvedValue(mockCategory as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/budget-categories`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Catering & Dining',
          allocatedAmount: 150000,
          description: 'Food and drink services',
          color: '#10b981',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Catering & Dining');
      expect(res.body.data.allocatedAmount).toBe(150000);
    });

    it('should reject duplicate category name within same event', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.budgetCategory, 'findFirst').mockResolvedValue(mockCategory as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/budget-categories`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Catering & Dining',
          allocatedAmount: 200000,
        });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject negative allocated amounts', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/budget-categories`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          name: 'Decorations',
          allocatedAmount: -5000,
        });

      expect(res.status).toBe(400);
    });

    it('should update a category allocation', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.budgetCategory, 'findUnique').mockResolvedValue(mockCategory as any);
      vi.spyOn(prisma.budgetCategory, 'update').mockResolvedValue({
        ...mockCategory,
        allocatedAmount: 180000 as any,
      } as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/budget-categories/${mockCategory.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ allocatedAmount: 180000 });

      expect(res.status).toBe(200);
      expect(res.body.data.allocatedAmount).toBe(180000);
    });

    it('should delete a category and safely unassign associated expenses without deleting them', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.budgetCategory, 'findUnique').mockResolvedValue(mockCategory as any);
      vi.spyOn(prisma.expense, 'updateMany').mockResolvedValue({ count: 2 } as any);
      vi.spyOn(prisma.budgetCategory, 'delete').mockResolvedValue(mockCategory as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/budget-categories/${mockCategory.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.expense.updateMany).toHaveBeenCalledWith({
        where: { categoryId: mockCategory.id },
        data: { categoryId: null },
      });
    });
  });

  // ==========================================
  // Expense Management Tests
  // ==========================================
  describe('Expense Management', () => {
    it('should create an expense and assign it to a category', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.budgetCategory, 'findUnique').mockResolvedValue(mockCategory as any);
      vi.spyOn(prisma.expense, 'create').mockResolvedValue(mockExpense as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/expenses`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          categoryId: mockCategory.id,
          title: 'Welcome Dinner Buffet',
          estimatedAmount: 120000,
          actualAmount: 130000,
          paymentStatus: 'paid',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Welcome Dinner Buffet');
      expect(res.body.data.actualAmount).toBe(130000);
    });

    it('should reject negative expense amounts', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/expenses`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Invalid Negative Expense',
          estimatedAmount: -100,
        });

      expect(res.status).toBe(400);
    });

    it('should update expense payment status and amount', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.expense, 'findUnique').mockResolvedValue(mockExpense as any);
      vi.spyOn(prisma.expense, 'update').mockResolvedValue({
        ...mockExpense,
        actualAmount: 140000 as any,
        paymentStatus: 'paid',
      } as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/expenses/${mockExpense.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ actualAmount: 140000, paymentStatus: 'paid' });

      expect(res.status).toBe(200);
      expect(res.body.data.actualAmount).toBe(140000);
    });

    it('should delete an expense', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.expense, 'findUnique').mockResolvedValue(mockExpense as any);
      vi.spyOn(prisma.expense, 'delete').mockResolvedValue(mockExpense as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/expenses/${mockExpense.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  // ==========================================
  // Budget Summary & Calculations Tests
  // ==========================================
  describe('Budget Summary & Calculations', () => {
    it('should calculate budget summary, utilization, variance, and detect overspending', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue({
        ...eventUserA,
        budget: 100000 as any, // 100k budget
      } as any);

      const categoryOverspent = {
        id: '77777777-7777-7777-7777-777777777777',
        name: 'Photography',
        allocatedAmount: 20000 as any,
        color: '#f59e0b',
        expenses: [
          { estimatedAmount: 22000 as any, actualAmount: 25000 as any },
        ],
      };

      const categoryNormal = {
        id: '88888888-8888-8888-8888-888888888888',
        name: 'Venue',
        allocatedAmount: 50000 as any,
        color: '#3b82f6',
        expenses: [
          { estimatedAmount: 45000 as any, actualAmount: 45000 as any },
        ],
      };

      const allExpenses = [
        { id: '99999999-9999-9999-9999-999999999991', categoryId: categoryOverspent.id, estimatedAmount: 22000, actualAmount: 25000 },
        { id: '99999999-9999-9999-9999-999999999992', categoryId: categoryNormal.id, estimatedAmount: 45000, actualAmount: 45000 },
        { id: '99999999-9999-9999-9999-999999999993', categoryId: null, estimatedAmount: 35000, actualAmount: 35000 }, // uncategorized
      ];

      vi.spyOn(prisma.budgetCategory, 'findMany').mockResolvedValue([categoryOverspent, categoryNormal] as any);
      vi.spyOn(prisma.expense, 'findMany').mockResolvedValue(allExpenses as any);

      const res = await request(app)
        .get(`/api/events/${eventUserA.id}/budget-summary`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      const summary = res.body.data;
      expect(summary.totalBudget).toBe(100000);
      expect(summary.totalAllocated).toBe(70000);
      expect(summary.totalActualExpenses).toBe(105000); // 25k + 45k + 35k
      expect(summary.remainingBudget).toBe(-5000); // 100k - 105k
      expect(summary.budgetUtilization).toBe(105);
      expect(summary.warnings.length).toBeGreaterThanOrEqual(2);
      expect(summary.warnings.some((w: string) => w.includes('Photography'))).toBe(true);
      expect(summary.warnings.some((w: string) => w.includes('exceeds the overall event budget'))).toBe(true);
    });

    it('should handle zero budget safely without division by zero', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue({
        ...eventUserA,
        budget: 0 as any,
      } as any);

      vi.spyOn(prisma.budgetCategory, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.expense, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get(`/api/events/${eventUserA.id}/budget-summary`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.budgetUtilization).toBe(0);
      expect(res.body.data.totalBudget).toBe(0);
      expect(res.body.data.remainingBudget).toBe(0);
    });
  });

  // ==========================================
  // Authorization & Cross-Event Isolation Tests
  // ==========================================
  describe('Authorization & Isolation Rules', () => {
    it('should reject User A attempting to view or modify User B event budget', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      // User B owns eventUserB
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .get(`/api/events/${eventUserB.id}/budget-summary`)
        .set('Authorization', 'Bearer token-user-a');

      // Return 404 to avoid leaking existence of another user's event
      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Event not found');
    });

    it('should reject User A attempting to add an expense to User B event', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .post(`/api/events/${eventUserB.id}/expenses`)
        .set('Authorization', 'Bearer token-user-a')
        .send({
          title: 'Intruder Expense',
          estimatedAmount: 5000,
        });

      expect(res.status).toBe(404);
    });

    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get(`/api/events/${eventUserA.id}/budget-summary`);
      expect(res.status).toBe(401);
    });
  });
});
