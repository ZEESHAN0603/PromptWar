import { prisma } from '../config/database.js';
import { AuthenticatedUser } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { UpdateProfileInput } from '../validators/user.validator.js';
import { formatEvent } from '../utils/event-formatter.js';

export class UserService {
  /**
   * Idempotently retrieves or creates the profile for the authenticated Supabase user.
   */
  static async getOrCreateProfile(user: AuthenticatedUser) {
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email,
          fullName: user.fullName || null,
          avatarUrl: user.avatarUrl || null,
        },
      });
    }

    return profile;
  }

  /**
   * Updates permitted profile fields (fullName, avatarUrl, phoneNumber).
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const existing = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      throw ApiError.notFound('User profile not found');
    }

    const updated = await prisma.profile.update({
      where: { id: userId },
      data: {
        ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
        ...(input.phoneNumber !== undefined ? { phoneNumber: input.phoneNumber || null } : {}),
      },
    });

    return updated;
  }

  /**
   * Returns all events owned by the user.
   */
  static async getUserEvents(userId: string) {
    const events = await prisma.event.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    return events.map(formatEvent);
  }
}

