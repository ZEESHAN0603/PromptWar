import { z } from 'zod';

export const ALLOWED_IDEA_CATEGORIES = [
  'theme',
  'decoration',
  'decor',
  'food',
  'catering',
  'entertainment',
  'activities',
  'venue',
  'ambience',
  'guest_experience',
  'experience',
] as const;

export const generateIdeasInputSchema = z.object({
  categories: z
    .array(z.string().min(1).max(50))
    .min(1, 'At least one idea category is required')
    .max(10, 'Cannot request more than 10 categories at once')
    .default(['theme', 'decoration', 'food', 'entertainment']),
  preferences: z
    .object({
      preferredColors: z.array(z.string().max(40)).max(10).optional().default([]),
      atmosphere: z.string().max(100).optional(),
      venuePreference: z.enum(['indoor', 'outdoor', 'mixed', 'any']).optional().default('any'),
      style: z.string().max(100).optional(),
      dietaryPreferences: z.string().max(200).optional(),
      culturalPreferences: z.string().max(200).optional(),
      additionalNotes: z.string().max(500).optional(),
    })
    .optional()
    .default({}),
});

export type GenerateIdeasInput = z.infer<typeof generateIdeasInputSchema>;

// Strict Zod schema validating Gemini output structure with resilient numeric coercion
export const ideaCostSchema = z.object({
  min: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }, z.number().nullable().optional())
    .nullable()
    .optional(),
  max: z
    .preprocess((val) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'number') return val;
      const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }, z.number().nullable().optional())
    .nullable()
    .optional(),
  currency: z.string().nullable().optional(),
  basis: z.string().nullable().optional().default('Estimate'),
});

export const generatedSingleIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  reason: z.string().min(1).max(600),
  colorPalette: z.array(z.string().max(50)).optional().default([]),
  estimatedCost: ideaCostSchema.optional(),
  budgetSuitability: z.string().max(200).optional().default('Review estimate with vendors'),
  implementationTips: z.array(z.string().max(400)).optional().default([]),
  alternatives: z.array(z.string().max(400)).optional().default([]),
});

export const generatedCategoryGroupSchema = z.object({
  category: z.string().min(1).max(50),
  ideas: z.array(generatedSingleIdeaSchema).min(1),
});

export const geminiCelebrationIdeasResponseSchema = z.object({
  eventContext: z.object({
    eventType: z.string().optional(),
    budget: z.number().optional(),
    guestCount: z.number().optional(),
  }).optional(),
  categories: z.array(generatedCategoryGroupSchema).min(1),
});

export type GeminiCelebrationIdeasResponse = z.infer<typeof geminiCelebrationIdeasResponseSchema>;

