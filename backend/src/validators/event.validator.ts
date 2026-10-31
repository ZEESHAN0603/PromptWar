import { z } from 'zod';

const eventStatusEnum = z.enum([
  'planning',
  'confirmed',
  'in_progress',
  'completed',
  'archived',
]);

export const createEventSchema = z
  .object({
    eventName: z.string().trim().min(1, 'Event name is required').max(200).optional(),
    name: z.string().trim().min(1, 'Event name is required').max(200).optional(),

    eventType: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    type: z.string().trim().min(1).max(100).optional(),

    eventDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')).optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format')).optional(),

    location: z.string().trim().min(1, 'Location is required').max(300),

    guestCount: z.coerce.number().int().nonnegative('Guest count must be 0 or greater').optional(),
    expectedGuests: z.coerce.number().int().nonnegative('Expected guests must be 0 or greater').optional(),

    budget: z.coerce.number().nonnegative('Budget must be 0 or greater').optional(),
    totalBudget: z.coerce.number().nonnegative('Total budget must be 0 or greater').optional(),

    currency: z.string().trim().min(1).max(10).default('INR'),
    description: z.string().trim().max(2000).optional(),
    occasionDescription: z.string().trim().max(2000).optional(),
    theme: z.string().trim().max(100).optional(),
    status: eventStatusEnum.default('planning'),
  })
  .refine((data) => data.eventName || data.name, {
    message: 'Event name is required',
    path: ['eventName'],
  })
  .refine((data) => data.eventDate || data.date, {
    message: 'Event date is required',
    path: ['eventDate'],
  })
  .transform((data) => {
    const rawDate = (data.eventDate || data.date) as string;
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid event date');
    }

    return {
      name: (data.eventName || data.name)!.trim(),
      type: (data.eventType || data.category || data.type || 'Wedding').trim(),
      date: parsedDate,
      location: data.location.trim(),
      guestCount: data.guestCount ?? data.expectedGuests ?? 0,
      budget: data.budget ?? data.totalBudget ?? 0,
      currency: data.currency || 'INR',
      description: data.description || data.occasionDescription || null,
      theme: data.theme || null,
      status: data.status || 'planning',
    };
  });

export const updateEventSchema = z
  .object({
    eventName: z.string().trim().min(1).max(200).optional(),
    name: z.string().trim().min(1).max(200).optional(),

    eventType: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    type: z.string().trim().min(1).max(100).optional(),

    eventDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),

    location: z.string().trim().min(1).max(300).optional(),

    guestCount: z.coerce.number().int().nonnegative().optional(),
    expectedGuests: z.coerce.number().int().nonnegative().optional(),

    budget: z.coerce.number().nonnegative().optional(),
    totalBudget: z.coerce.number().nonnegative().optional(),

    currency: z.string().trim().min(1).max(10).optional(),
    description: z.string().trim().max(2000).optional(),
    occasionDescription: z.string().trim().max(2000).optional(),
    theme: z.string().trim().max(100).optional(),
    status: eventStatusEnum.optional(),
    // Strictly prevent modifying ownership
    userId: z.never({ message: 'Changing event owner is forbidden' }).optional(),
  })
  .transform((data) => {
    const transformed: Record<string, any> = {};

    if (data.eventName !== undefined || data.name !== undefined) {
      transformed.name = (data.eventName ?? data.name)!.trim();
    }
    if (data.eventType !== undefined || data.category !== undefined || data.type !== undefined) {
      transformed.type = (data.eventType ?? data.category ?? data.type)!.trim();
    }
    if (data.eventDate !== undefined || data.date !== undefined) {
      const raw = (data.eventDate ?? data.date)!;
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) {
        throw new Error('Invalid event date');
      }
      transformed.date = parsed;
    }
    if (data.location !== undefined) {
      transformed.location = data.location.trim();
    }
    if (data.guestCount !== undefined || data.expectedGuests !== undefined) {
      transformed.guestCount = data.guestCount ?? data.expectedGuests;
    }
    if (data.budget !== undefined || data.totalBudget !== undefined) {
      transformed.budget = data.budget ?? data.totalBudget;
    }
    if (data.currency !== undefined) {
      transformed.currency = data.currency;
    }
    if (data.description !== undefined || data.occasionDescription !== undefined) {
      transformed.description = data.description ?? data.occasionDescription;
    }
    if (data.theme !== undefined) {
      transformed.theme = data.theme;
    }
    if (data.status !== undefined) {
      transformed.status = data.status;
    }

    return transformed;
  });

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  eventType: z.string().optional(),
  type: z.string().optional(),
  status: eventStatusEnum.or(z.literal('All')).optional(),
  sortBy: z
    .enum(['date_asc', 'date_desc', 'created_asc', 'created_desc', 'budget_desc', 'budget_asc'])
    .default('date_asc'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
