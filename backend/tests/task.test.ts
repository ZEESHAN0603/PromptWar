import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as supabaseModule from '../src/config/supabase.js';
import { prisma } from '../src/config/database.js';

describe('Task & Dependency Management Endpoints (/api/events/:eventId/tasks)', () => {
  const userA = { id: '11111111-1111-1111-1111-111111111111', email: 'user.a@example.com', fullName: 'User A' };
  const userB = { id: '22222222-2222-2222-2222-222222222222', email: 'user.b@example.com', fullName: 'User B' };

  const eventUserA = { id: '33333333-3333-3333-3333-333333333333', userId: userA.id, name: 'User A Wedding' };
  const eventUserB = { id: '44444444-4444-4444-4444-444444444444', userId: userB.id, name: 'User B Birthday' };

  const task1 = {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    eventId: eventUserA.id,
    title: 'Book Wedding Venue',
    description: 'Finalize resort contract',
    dueDate: new Date('2026-06-01T00:00:00.000Z'),
    priority: 'urgent',
    status: 'in_progress',
    assignedTo: 'Event Planner',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
    dependencies: [],
    prerequisitesOf: [],
  };

  const task2 = {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    eventId: eventUserA.id,
    title: 'Confirm Decoration & Stage Setup',
    description: 'Requires confirmed venue layout first',
    dueDate: new Date('2026-06-15T00:00:00.000Z'),
    priority: 'high',
    status: 'todo',
    assignedTo: 'Florist Lead',
    createdAt: new Date('2026-03-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
    dependencies: [
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        taskId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        dependsOnTaskId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        dependsOnTask: { id: task1.id, title: task1.title, status: task1.status, priority: task1.priority },
      },
    ],
    prerequisitesOf: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // Task CRUD Tests
  // ==========================================
  describe('Task Operations', () => {
    it('should create a task successfully', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.task, 'create').mockResolvedValue(task1 as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Book Wedding Venue',
          dueDate: '2026-06-01',
          priority: 'urgent',
          status: 'in_progress',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Book Wedding Venue');
      expect(res.body.data.priority).toBe('urgent');
    });

    it('should reject task creation with missing title', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '',
        });

      expect(res.status).toBe(400);
    });

    it('should prevent completing a task if its prerequisites are incomplete', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      // task2 depends on task1, which is in_progress (not completed)
      vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(task2 as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/tasks/${task2.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('prerequisite task(s)');
    });

    it('should allow completing a task with incomplete prerequisites if explicitly overridden', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(task2 as any);
      vi.spyOn(prisma.task, 'update').mockResolvedValue({
        ...task2,
        status: 'completed',
      } as any);

      const res = await request(app)
        .patch(`/api/events/${eventUserA.id}/tasks/${task2.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({
          status: 'completed',
          overrideIncompletePrerequisites: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('completed');
    });

    it('should delete a task safely', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(task1 as any);
      vi.spyOn(prisma.task, 'delete').mockResolvedValue(task1 as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/tasks/${task1.id}`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  // ==========================================
  // Task Dependency Tests & Cycle Detection
  // ==========================================
  describe('Task Dependency Rules & Cycle Detection', () => {
    it('should create a valid task dependency', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      // task2 depends on task1
      vi.spyOn(prisma.task, 'findUnique')
        .mockResolvedValueOnce(task2 as any) // subject
        .mockResolvedValueOnce(task1 as any); // prerequisite

      vi.spyOn(prisma.taskDependency, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.taskDependency, 'findMany').mockResolvedValue([]); // no reverse dependencies

      const mockCreatedDep = {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        taskId: task2.id,
        dependsOnTaskId: task1.id,
        createdAt: new Date(),
        task: { id: task2.id, title: task2.title },
        dependsOnTask: { id: task1.id, title: task1.title },
      };
      vi.spyOn(prisma.taskDependency, 'create').mockResolvedValue(mockCreatedDep as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks/${task2.id}/dependencies`)
        .set('Authorization', 'Bearer valid-token')
        .send({ dependsOnTaskId: task1.id });

      expect(res.status).toBe(201);
      expect(res.body.data.taskId).toBe(task2.id);
      expect(res.body.data.dependsOnTaskId).toBe(task1.id);
    });

    it('should reject self-dependency (task depending on itself)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks/${task1.id}/dependencies`)
        .set('Authorization', 'Bearer valid-token')
        .send({ dependsOnTaskId: task1.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('cannot depend on itself');
    });

    it('should reject duplicate dependency', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);
      vi.spyOn(prisma.task, 'findUnique')
        .mockResolvedValueOnce(task2 as any)
        .mockResolvedValueOnce(task1 as any);

      vi.spyOn(prisma.taskDependency, 'findUnique').mockResolvedValue({ id: 'existing' } as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks/${task2.id}/dependencies`)
        .set('Authorization', 'Bearer valid-token')
        .send({ dependsOnTaskId: task1.id });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('already exists');
    });

    it('should reject cross-event dependency (prerequisite belongs to another event)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      const taskForeign = { ...task1, id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', eventId: eventUserB.id };

      vi.spyOn(prisma.task, 'findUnique')
        .mockResolvedValueOnce(task2 as any)
        .mockResolvedValueOnce(taskForeign as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks/${task2.id}/dependencies`)
        .set('Authorization', 'Bearer valid-token')
        .send({ dependsOnTaskId: taskForeign.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('different event');
    });

    it('should detect and reject dependency cycle (A -> B -> A)', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      // Suppose task2 already depends on task1.
      // Now user attempts to make task1 depend on task2!
      vi.spyOn(prisma.task, 'findUnique')
        .mockResolvedValueOnce(task1 as any) // subject: task1
        .mockResolvedValueOnce(task2 as any); // prerequisite: task2

      vi.spyOn(prisma.taskDependency, 'findUnique').mockResolvedValue(null);

      // detectCycle(task2, task1) checks if task2 depends on task1:
      // When querying taskDependency with taskId=task2, returns dependsOnTaskId=task1!
      vi.spyOn(prisma.taskDependency, 'findMany').mockResolvedValueOnce([
        { dependsOnTaskId: task1.id },
      ] as any);

      const res = await request(app)
        .post(`/api/events/${eventUserA.id}/tasks/${task1.id}/dependencies`)
        .set('Authorization', 'Bearer valid-token')
        .send({ dependsOnTaskId: task2.id });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Dependency cycle detected');
    });

    it('should delete a dependency relationship', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserA as any);

      vi.spyOn(prisma.taskDependency, 'findUnique').mockResolvedValue({
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        taskId: task2.id,
        task: { eventId: eventUserA.id },
      } as any);

      vi.spyOn(prisma.taskDependency, 'delete').mockResolvedValue({ id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' } as any);

      const res = await request(app)
        .delete(`/api/events/${eventUserA.id}/tasks/${task2.id}/dependencies/cccccccc-cccc-cccc-cccc-cccccccccccc`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data.deleted).toBe(true);
    });
  });

  // ==========================================
  // Authorization Tests
  // ==========================================
  describe('Task Authorization & Data Isolation', () => {
    it('should reject User A accessing User B tasks', async () => {
      vi.spyOn(supabaseModule, 'verifySupabaseToken').mockResolvedValue(userA);
      vi.spyOn(prisma.event, 'findUnique').mockResolvedValue(eventUserB as any);

      const res = await request(app)
        .get(`/api/events/${eventUserB.id}/tasks`)
        .set('Authorization', 'Bearer token-user-a');

      expect(res.status).toBe(404);
    });
  });
});
