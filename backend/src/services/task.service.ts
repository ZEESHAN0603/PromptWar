import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
  CreateTaskDependencyInput,
} from '../validators/task.validator.js';

export class TaskService {
  static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return event;
  }

  // ==========================================
  // Task Operations
  // ==========================================

  static async createTask(userId: string, eventId: string, input: CreateTaskInput) {
    await this.verifyEventOwnership(userId, eventId);

    const task = await prisma.task.create({
      data: {
        eventId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        priority: input.priority,
        status: input.status,
        assignedTo: input.assignedTo,
      },
    });

    return {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      dependencies: [],
      prerequisites: [],
    };
  }

  static async listTasks(userId: string, eventId: string, query: ListTasksQuery) {
    await this.verifyEventOwnership(userId, eventId);

    const where: Record<string, any> = { eventId };

    if (query.status && query.status !== 'All') {
      where.status = query.status;
    }

    if (query.priority && query.priority !== 'All') {
      where.priority = query.priority;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { assignedTo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderByMap: Record<string, any> = {
      dueDate_asc: { dueDate: 'asc' },
      dueDate_desc: { dueDate: 'desc' },
      priority_desc: { priority: 'desc' },
      created_desc: { createdAt: 'desc' },
      title_asc: { title: 'asc' },
    };

    const orderBy = orderByMap[query.sortBy] || { dueDate: 'asc' };
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, tasks] = await prisma.$transaction([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: {
          dependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, title: true, status: true, priority: true },
              },
            },
          },
          prerequisitesOf: {
            include: {
              task: {
                select: { id: true, title: true, status: true },
              },
            },
          },
        },
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      tasks: tasks.map((t) => ({
        id: t.id,
        eventId: t.eventId,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        dependencies: t.dependencies.map((d) => ({
          dependencyId: d.id,
          taskId: d.dependsOnTask.id,
          title: d.dependsOnTask.title,
          status: d.dependsOnTask.status,
          priority: d.dependsOnTask.priority,
        })),
        prerequisiteFor: t.prerequisitesOf.map((p) => ({
          dependencyId: p.id,
          taskId: p.task.id,
          title: p.task.title,
          status: p.task.status,
        })),
      })),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  static async getTaskById(userId: string, eventId: string, taskId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
        prerequisitesOf: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!task || task.eventId !== eventId) {
      throw ApiError.notFound('Task not found');
    }

    return {
      id: task.id,
      eventId: task.eventId,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dependencies: task.dependencies.map((d) => ({
        dependencyId: d.id,
        taskId: d.dependsOnTask.id,
        title: d.dependsOnTask.title,
        status: d.dependsOnTask.status,
        priority: d.dependsOnTask.priority,
      })),
      prerequisiteFor: task.prerequisitesOf.map((p) => ({
        dependencyId: p.id,
        taskId: p.task.id,
        title: p.task.title,
        status: p.task.status,
      })),
    };
  }

  static async updateTask(
    userId: string,
    eventId: string,
    taskId: string,
    input: UpdateTaskInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
      },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Task not found');
    }

    // Dependency Rule: If marking as completed, check incomplete prerequisites unless overridden
    if (input.status === 'completed' && !input.overrideIncompletePrerequisites) {
      const incompletePrerequisites = existing.dependencies.filter(
        (dep) => dep.dependsOnTask.status !== 'completed'
      );

      if (incompletePrerequisites.length > 0) {
        const titles = incompletePrerequisites.map((p) => `"${p.dependsOnTask.title}"`).join(', ');
        throw ApiError.badRequest(
          `Cannot mark task as completed because prerequisite task(s) [${titles}] are not completed. Use overrideIncompletePrerequisites to bypass.`
        );
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
      },
      include: {
        dependencies: {
          include: {
            dependsOnTask: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      title: updated.title,
      description: updated.description,
      dueDate: updated.dueDate ? updated.dueDate.toISOString() : null,
      priority: updated.priority,
      status: updated.status,
      assignedTo: updated.assignedTo,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      dependencies: updated.dependencies.map((d) => ({
        dependencyId: d.id,
        taskId: d.dependsOnTask.id,
        title: d.dependsOnTask.title,
        status: d.dependsOnTask.status,
      })),
    };
  }

  static async deleteTask(userId: string, eventId: string, taskId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Task not found');
    }

    // Cascade removes TaskDependency entries due to foreign keys onDelete: Cascade
    await prisma.task.delete({
      where: { id: taskId },
    });

    return {
      id: taskId,
      deleted: true,
    };
  }

  // ==========================================
  // Task Dependency Operations
  // ==========================================

  static async createDependency(
    userId: string,
    eventId: string,
    taskId: string,
    input: CreateTaskDependencyInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const { dependsOnTaskId } = input;

    // Rule 1: Self-dependency rejected
    if (taskId === dependsOnTaskId) {
      throw ApiError.badRequest('A task cannot depend on itself');
    }

    // Rule 2: Both tasks must belong to the same event
    const [subjectTask, prerequisiteTask] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.task.findUnique({ where: { id: dependsOnTaskId } }),
    ]);

    if (!subjectTask || subjectTask.eventId !== eventId) {
      throw ApiError.notFound('Subject task not found for this event');
    }

    if (!prerequisiteTask || prerequisiteTask.eventId !== eventId) {
      throw ApiError.badRequest('Prerequisite task not found or belongs to a different event');
    }

    // Rule 3: Reject duplicate dependency
    const existingDep = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnTaskId: {
          taskId,
          dependsOnTaskId,
        },
      },
    });

    if (existingDep) {
      throw ApiError.conflict('This task dependency relationship already exists');
    }

    // Rule 4: Cycle detection
    // Does dependsOnTaskId transitively depend on taskId?
    const hasCycle = await this.detectCycle(dependsOnTaskId, taskId, eventId);
    if (hasCycle) {
      throw ApiError.badRequest('Dependency cycle detected: adding this dependency would create a circular loop');
    }

    const created = await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
      },
      include: {
        task: { select: { id: true, title: true } },
        dependsOnTask: { select: { id: true, title: true } },
      },
    });

    return {
      id: created.id,
      taskId: created.taskId,
      taskTitle: created.task.title,
      dependsOnTaskId: created.dependsOnTaskId,
      prerequisiteTitle: created.dependsOnTask.title,
      createdAt: created.createdAt,
    };
  }

  static async listDependencies(userId: string, eventId: string, taskId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.eventId !== eventId) {
      throw ApiError.notFound('Task not found');
    }

    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId },
      include: {
        dependsOnTask: {
          select: { id: true, title: true, status: true, priority: true, dueDate: true },
        },
      },
    });

    return dependencies.map((d) => ({
      id: d.id,
      taskId: d.taskId,
      dependsOnTaskId: d.dependsOnTaskId,
      dependsOnTask: {
        ...d.dependsOnTask,
        dueDate: d.dependsOnTask.dueDate ? d.dependsOnTask.dueDate.toISOString() : null,
      },
      createdAt: d.createdAt,
    }));
  }

  static async deleteDependency(
    userId: string,
    eventId: string,
    taskId: string,
    dependencyId: string
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const dep = await prisma.taskDependency.findUnique({
      where: { id: dependencyId },
      include: { task: true },
    });

    if (!dep || dep.taskId !== taskId || dep.task.eventId !== eventId) {
      throw ApiError.notFound('Task dependency relationship not found');
    }

    await prisma.taskDependency.delete({
      where: { id: dependencyId },
    });

    return {
      id: dependencyId,
      deleted: true,
    };
  }

  /**
   * Helper: Traverse dependency tree to check if startTaskId depends on targetTaskId.
   */
  private static async detectCycle(
    startTaskId: string,
    targetTaskId: string,
    eventId: string
  ): Promise<boolean> {
    const visited = new Set<string>();
    const queue: string[] = [startTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetTaskId) {
        return true;
      }

      if (!visited.has(current)) {
        visited.add(current);
        const deps = await prisma.taskDependency.findMany({
          where: { taskId: current },
          select: { dependsOnTaskId: true },
        });

        for (const dep of deps) {
          if (!visited.has(dep.dependsOnTaskId)) {
            queue.push(dep.dependsOnTaskId);
          }
        }
      }
    }

    return false;
  }
}

