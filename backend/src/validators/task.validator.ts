import { z } from 'zod';

const taskPriorities = ['low', 'medium', 'high', 'urgent', 'critical'] as const;
const taskStatuses = ['todo', 'in_progress', 'completed', 'cancelled', 'pending'] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Due date must be a valid ISO date string'
    ),
  priority: z.enum(taskPriorities).default('medium'),
  status: z.enum(taskStatuses).default('todo'),
  assignedTo: z.string().trim().max(100).optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title cannot be empty').max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Due date must be a valid ISO date string'
    ),
  priority: z.enum(taskPriorities).optional(),
  status: z.enum(taskStatuses).optional(),
  assignedTo: z.string().trim().max(100).optional().nullable(),
  overrideIncompletePrerequisites: z.boolean().optional(),
});

export const listTasksQuerySchema = z.object({
  status: z.enum([...taskStatuses, 'All'] as const).optional(),
  priority: z.enum([...taskPriorities, 'All'] as const).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(['dueDate_asc', 'dueDate_desc', 'priority_desc', 'created_desc', 'title_asc']).default('dueDate_asc'),
});

export const createTaskDependencySchema = z.object({
  dependsOnTaskId: z.string().uuid('Invalid dependsOnTaskId UUID format'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskDependencyInput = z.infer<typeof createTaskDependencySchema>;

