import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { CreateEventInput, UpdateEventInput, ListEventsQuery } from '../validators/event.validator.js';
import { formatEvent } from '../utils/event-formatter.js';

export class EventService {
  /**
   * Creates an event owned exclusively by the authenticated user.
   */
  static async createEvent(userId: string, input: CreateEventInput) {
    // Ensure profile exists in our database (e.g. if profile was not yet synced)
    const existingProfile = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          id: userId,
          email: `${userId}@eventpilot.user`,
          fullName: 'Event Host',
        },
      });
    }

    const created = await prisma.event.create({
      data: {
        userId,
        name: input.name,
        type: input.type,
        date: input.date,
        location: input.location,
        guestCount: input.guestCount,
        budget: input.budget,
        currency: input.currency,
        description: input.description,
        theme: input.theme,
        status: input.status,
      },
    });

    return formatEvent(created);
  }

  /**
   * Lists events owned exclusively by the authenticated user with pagination, filtering, and sorting.
   */
  static async listEvents(userId: string, query: ListEventsQuery) {
    const where: Record<string, any> = { userId };

    const typeFilter = query.eventType || query.type;
    if (typeFilter && typeFilter !== 'All') {
      where.type = {
        equals: typeFilter,
        mode: 'insensitive',
      };
    }

    if (query.status && query.status !== 'All') {
      where.status = query.status;
    }

    const orderByMap: Record<string, any> = {
      date_asc: { date: 'asc' },
      date_desc: { date: 'desc' },
      created_asc: { createdAt: 'asc' },
      created_desc: { createdAt: 'desc' },
      budget_desc: { budget: 'desc' },
      budget_asc: { budget: 'asc' },
    };

    const orderBy = orderByMap[query.sortBy] || { date: 'asc' };
    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    const [total, events] = await prisma.$transaction([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
    ]);

    return {
      events: events.map(formatEvent),
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Retrieves single event by ID, enforcing strict user ownership.
   */
  static async getEventById(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return formatEvent(event);
  }

  /**
   * Partially updates an event owned by the authenticated user.
   */
  static async updateEvent(userId: string, eventId: string, input: UpdateEventInput) {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: input,
    });

    return formatEvent(updated);
  }

  /**
   * Safely deletes an event owned by the authenticated user.
   */
  static async deleteEvent(userId: string, eventId: string) {
    const existing = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existing || existing.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return {
      id: eventId,
      deleted: true,
    };
  }
}

