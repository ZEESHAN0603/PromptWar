import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2,000 characters'),
  eventId: z
    .string()
    .uuid('eventId must be a valid UUID')
    .optional()
    .nullable(),
  conversationId: z
    .string()
    .uuid('conversationId must be a valid UUID')
    .optional()
    .nullable(),
});

export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export const createConversationSchema = z.object({
  eventId: z
    .string()
    .uuid('eventId must be a valid UUID')
    .optional()
    .nullable(),
  title: z
    .string()
    .trim()
    .min(1, 'Title cannot be empty')
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const actionTypeEnum = z.enum([
  'create_task',
  'update_task',
  'add_timeline_item',
  'save_idea',
  'create_replan_proposal',
]);

export const actionPreviewSchema = z.object({
  eventId: z.string().uuid('eventId must be a valid UUID'),
  actionType: actionTypeEnum,
  parameters: z.record(z.any()),
});

export type ActionPreviewInput = z.infer<typeof actionPreviewSchema>;

export const actionConfirmSchema = z.object({
  eventId: z.string().uuid('eventId must be a valid UUID'),
  actionType: actionTypeEnum,
  parameters: z.record(z.any()),
});

export type ActionConfirmInput = z.infer<typeof actionConfirmSchema>;

