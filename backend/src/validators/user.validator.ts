import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(1, 'Full name cannot be empty').max(100).optional(),
    avatarUrl: z.string().url('Avatar URL must be a valid URL').optional().or(z.literal('')),
    phoneNumber: z.string().trim().max(30).optional().or(z.literal('')),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

