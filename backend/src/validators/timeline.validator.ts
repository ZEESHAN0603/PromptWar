import { z } from 'zod';

export const createTimelineItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Timeline activity title is required').max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    startTime: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Start time must be a valid ISO date string'),
    endTime: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        'End time must be a valid ISO date string'
      ),
    location: z.string().trim().max(200).optional().nullable(),
    category: z.string().trim().max(100).default('Other').optional().nullable(),
    status: z.string().trim().max(50).default('scheduled'),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() >= new Date(data.startTime).getTime();
      }
      return true;
    },
    {
      message: 'End time must be later than or equal to start time',
      path: ['endTime'],
    }
  );

export const updateTimelineItemSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty').max(200).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    startTime: z
      .string()
      .optional()
      .refine((val) => !val || !isNaN(Date.parse(val)), 'Start time must be a valid ISO date string'),
    endTime: z
      .string()
      .optional()
      .nullable()
      .refine(
        (val) => !val || !isNaN(Date.parse(val)),
        'End time must be a valid ISO date string'
      ),
    location: z.string().trim().max(200).optional().nullable(),
    category: z.string().trim().max(100).optional().nullable(),
    status: z.string().trim().max(50).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return new Date(data.endTime).getTime() >= new Date(data.startTime).getTime();
      }
      return true;
    },
    {
      message: 'End time must be later than or equal to start time',
      path: ['endTime'],
    }
  );

export const listTimelineQuerySchema = z.object({
  category: z.string().trim().optional(),
  status: z.string().trim().optional(),
  sortBy: z.enum(['startTime_asc', 'startTime_desc']).default('startTime_asc'),
});

export type CreateTimelineItemInput = z.infer<typeof createTimelineItemSchema>;
export type UpdateTimelineItemInput = z.infer<typeof updateTimelineItemSchema>;
export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;

