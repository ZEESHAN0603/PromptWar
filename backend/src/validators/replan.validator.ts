import { z } from 'zod';

/**
 * Zod schema for re-planning request input
 */
export const createReplanProposalSchema = z
  .object({
    changes: z.object({
      budget: z
        .object({
          proposed: z.number().min(0, 'Proposed budget must be greater than or equal to 0'),
        })
        .optional(),
      guestCount: z
        .object({
          proposed: z.number().int().min(0, 'Proposed guest count must be greater than or equal to 0'),
        })
        .optional(),
      eventDate: z
        .object({
          proposed: z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Proposed event date must be a valid ISO date string',
          }),
        })
        .optional(),
    }),
    reason: z.string().max(500, 'Reason must not exceed 500 characters').optional().nullable(),
  })
  .refine(
    (data) =>
      data.changes.budget !== undefined ||
      data.changes.guestCount !== undefined ||
      data.changes.eventDate !== undefined,
    {
      message: 'At least one change dimension (budget, guestCount, or eventDate) must be specified',
      path: ['changes'],
    }
  );

export type CreateReplanProposalInput = z.infer<typeof createReplanProposalSchema>;

/**
 * Zod schema for selectively applying proposal changes
 */
export const applyReplanProposalSchema = z.object({
  approvedChanges: z.object({
    budget: z.boolean().default(false),
    guestCount: z.boolean().default(false),
    eventDate: z.boolean().default(false),
  }),
  approvedTaskChanges: z
    .array(
      z.object({
        taskId: z.string().min(1, 'Task ID is required'),
        proposedDueDate: z.string(),
      })
    )
    .default([]),
  approvedTimelineChanges: z
    .array(
      z.object({
        timelineItemId: z.string().min(1, 'Timeline item ID is required'),
        proposedStartTime: z.string(),
      })
    )
    .default([]),
});

export type ApplyReplanProposalInput = z.infer<typeof applyReplanProposalSchema>;

/**
 * Strict Zod schema for validating Gemini AI Re-Planning response
 */
export const geminiReplanRecommendationSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  reason: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedImpact: z.union([z.string(), z.number(), z.null()]).optional().default(null),
  requiresUserApproval: z.boolean().default(true),
});

export const geminiReplanResponseSchema = z.object({
  summary: z.string().min(1),
  impactLevel: z.enum(['low', 'moderate', 'high', 'critical']).default('moderate'),
  recommendations: z.array(geminiReplanRecommendationSchema).default([]),
  warnings: z.array(z.string()).default([]),
  alternatives: z.array(z.string()).default([]),
});

export type GeminiReplanResponse = z.infer<typeof geminiReplanResponseSchema>;
