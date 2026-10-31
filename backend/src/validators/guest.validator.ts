import { z } from 'zod';

const rsvpStatuses = ['pending', 'invited', 'attending', 'declined', 'confirmed'] as const;

export const createGuestSchema = z.object({
  fullName: z.string().trim().min(1, 'Guest name is required').max(150),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+0-9\s\-()]{7,25}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  guestCategory: z.string().trim().max(50).default('Others').optional().nullable(),
  rsvpStatus: z.enum(rsvpStatuses).default('pending'),
  plusOneAllowed: z.boolean().default(false),
  plusOneCount: z
    .union([z.number(), z.string()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0 && Number.isInteger(val), 'Plus-one count must be a non-negative integer')
    .default(0),
  dietaryPreference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateGuestSchema = z.object({
  fullName: z.string().trim().min(1, 'Guest name cannot be empty').max(150).optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  phoneNumber: z
    .string()
    .trim()
    .regex(/^[+0-9\s\-()]{7,25}$/, 'Invalid phone number format')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  guestCategory: z.string().trim().max(50).optional().nullable(),
  rsvpStatus: z.enum(rsvpStatuses).optional(),
  plusOneAllowed: z.boolean().optional(),
  plusOneCount: z
    .union([z.number(), z.string()])
    .transform((val) => (val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0 && Number.isInteger(val)), 'Plus-one count must be a non-negative integer')
    .optional(),
  dietaryPreference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export const listGuestsQuerySchema = z.object({
  search: z.string().trim().optional(),
  rsvpStatus: z.enum([...rsvpStatuses, 'All'] as const).optional(),
  guestCategory: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
  sortBy: z.enum(['name_asc', 'name_desc', 'created_desc', 'created_asc']).default('name_asc'),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type ListGuestsQuery = z.infer<typeof listGuestsQuerySchema>;

