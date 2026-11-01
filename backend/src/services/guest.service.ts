import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { EventService } from './event.service.js';
import {
  CreateGuestInput,
  UpdateGuestInput,
  ListGuestsQuery,
} from '../validators/guest.validator.js';

export class GuestService {
  static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return event;
  }

  static async createGuest(userId: string, eventId: string, input: CreateGuestInput) {
    await this.verifyEventOwnership(userId, eventId);

    const guest = await prisma.guest.create({
      data: {
        eventId,
        fullName: input.fullName,
        email: input.email,
        phoneNumber: input.phoneNumber,
        guestCategory: input.guestCategory || 'Others',
        rsvpStatus: input.rsvpStatus,
        plusOneAllowed: input.plusOneAllowed,
        plusOneCount: input.plusOneCount,
        dietaryPreference: input.dietaryPreference,
        notes: input.notes,
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return guest;
  }

  static async listGuests(userId: string, eventId: string, query: ListGuestsQuery) {
    await this.verifyEventOwnership(userId, eventId);

    const where: Record<string, any> = { eventId };

    if (query.rsvpStatus && query.rsvpStatus !== 'All') {
      where.rsvpStatus = query.rsvpStatus;
    }

    if (query.guestCategory && query.guestCategory !== 'All') {
      where.guestCategory = {
        equals: query.guestCategory,
        mode: 'insensitive',
      };
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phoneNumber: { contains: query.search, mode: 'insensitive' } },
        { dietaryPreference: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderByMap: Record<string, any> = {
      name_asc: { fullName: 'asc' },
      name_desc: { fullName: 'desc' },
      created_desc: { createdAt: 'desc' },
      created_asc: { createdAt: 'asc' },
    };

    const orderBy = orderByMap[query.sortBy] || { fullName: 'asc' };
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, guests] = await prisma.$transaction([
      prisma.guest.count({ where }),
      prisma.guest.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      guests,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  static async getGuestById(userId: string, eventId: string, guestId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!guest || guest.eventId !== eventId) {
      throw ApiError.notFound('Guest not found');
    }

    return guest;
  }

  static async updateGuest(
    userId: string,
    eventId: string,
    guestId: string,
    input: UpdateGuestInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Guest not found');
    }

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: {
        ...(input.fullName !== undefined && { fullName: input.fullName }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
        ...(input.guestCategory !== undefined && { guestCategory: input.guestCategory }),
        ...(input.rsvpStatus !== undefined && { rsvpStatus: input.rsvpStatus }),
        ...(input.plusOneAllowed !== undefined && { plusOneAllowed: input.plusOneAllowed }),
        ...(input.plusOneCount !== undefined && { plusOneCount: input.plusOneCount }),
        ...(input.dietaryPreference !== undefined && { dietaryPreference: input.dietaryPreference }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });

    await EventService.touchPlanningRevision(eventId);

    return updated;
  }

  static async deleteGuest(userId: string, eventId: string, guestId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.guest.findUnique({
      where: { id: guestId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Guest not found');
    }

    await prisma.guest.delete({
      where: { id: guestId },
    });

    await EventService.touchPlanningRevision(eventId);

    return {
      id: guestId,
      deleted: true,
    };
  }

  static async getGuestSummary(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const guests = await prisma.guest.findMany({
      where: { eventId },
    });

    const totalGuests = guests.length;
    let totalPermittedPlusOnes = 0;
    let attendingCount = 0;
    let declinedCount = 0;
    let pendingCount = 0;
    let invitedCount = 0;
    let expectedAttendeesHeadcount = 0;

    const categoryBreakdown: Record<string, number> = {};
    const dietaryBreakdown: Record<string, number> = {};

    for (const g of guests) {
      totalPermittedPlusOnes += g.plusOneCount;

      const isAttending = g.rsvpStatus === 'attending' || g.rsvpStatus === 'confirmed';
      if (isAttending) {
        attendingCount++;
        expectedAttendeesHeadcount += 1 + g.plusOneCount;
      } else if (g.rsvpStatus === 'declined') {
        declinedCount++;
      } else if (g.rsvpStatus === 'invited') {
        invitedCount++;
      } else {
        pendingCount++;
      }

      const cat = g.guestCategory || 'Others';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      if (g.dietaryPreference) {
        dietaryBreakdown[g.dietaryPreference] = (dietaryBreakdown[g.dietaryPreference] || 0) + 1;
      }
    }

    return {
      eventId,
      totalGuests,
      attendingCount,
      declinedCount,
      pendingCount,
      invitedCount,
      totalPermittedPlusOnes,
      expectedAttendeesHeadcount,
      categoryBreakdown,
      dietaryBreakdown,
    };
  }
}

