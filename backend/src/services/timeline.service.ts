import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import {
  CreateTimelineItemInput,
  UpdateTimelineItemInput,
  ListTimelineQuery,
} from '../validators/timeline.validator.js';

export class TimelineService {
  static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return event;
  }

  static async createTimelineItem(
    userId: string,
    eventId: string,
    input: CreateTimelineItemInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const startTime = new Date(input.startTime);
    const endTime = input.endTime ? new Date(input.endTime) : null;

    if (endTime && endTime.getTime() < startTime.getTime()) {
      throw ApiError.badRequest('End time must be later than or equal to start time');
    }

    const item = await prisma.timelineItem.create({
      data: {
        eventId,
        title: input.title,
        description: input.description,
        startTime,
        endTime,
        location: input.location,
        category: input.category || 'Other',
        status: input.status,
      },
    });

    return {
      ...item,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime ? item.endTime.toISOString() : null,
    };
  }

  static async listTimelineItems(
    userId: string,
    eventId: string,
    query: ListTimelineQuery
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const where: Record<string, any> = { eventId };

    if (query.category && query.category !== 'All') {
      where.category = { equals: query.category, mode: 'insensitive' };
    }

    if (query.status && query.status !== 'All') {
      where.status = query.status;
    }

    const orderBy = query.sortBy === 'startTime_desc' ? { startTime: 'desc' as const } : { startTime: 'asc' as const };

    const items = await prisma.timelineItem.findMany({
      where,
      orderBy,
    });

    return items.map((item) => ({
      id: item.id,
      eventId: item.eventId,
      title: item.title,
      description: item.description,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime ? item.endTime.toISOString() : null,
      location: item.location,
      category: item.category,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  }

  static async getTimelineItemById(
    userId: string,
    eventId: string,
    timelineItemId: string
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const item = await prisma.timelineItem.findUnique({
      where: { id: timelineItemId },
    });

    if (!item || item.eventId !== eventId) {
      throw ApiError.notFound('Timeline item not found');
    }

    return {
      id: item.id,
      eventId: item.eventId,
      title: item.title,
      description: item.description,
      startTime: item.startTime.toISOString(),
      endTime: item.endTime ? item.endTime.toISOString() : null,
      location: item.location,
      category: item.category,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  static async updateTimelineItem(
    userId: string,
    eventId: string,
    timelineItemId: string,
    input: UpdateTimelineItemInput
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.timelineItem.findUnique({
      where: { id: timelineItemId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Timeline item not found');
    }

    const newStart = input.startTime ? new Date(input.startTime) : existing.startTime;
    const newEnd =
      input.endTime !== undefined
        ? input.endTime
          ? new Date(input.endTime)
          : null
        : existing.endTime;

    if (newEnd && newEnd.getTime() < newStart.getTime()) {
      throw ApiError.badRequest('End time must be later than or equal to start time');
    }

    const updated = await prisma.timelineItem.update({
      where: { id: timelineItemId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.startTime !== undefined && { startTime: new Date(input.startTime) }),
        ...(input.endTime !== undefined && {
          endTime: input.endTime ? new Date(input.endTime) : null,
        }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });

    return {
      id: updated.id,
      eventId: updated.eventId,
      title: updated.title,
      description: updated.description,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime ? updated.endTime.toISOString() : null,
      location: updated.location,
      category: updated.category,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  static async deleteTimelineItem(
    userId: string,
    eventId: string,
    timelineItemId: string
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const existing = await prisma.timelineItem.findUnique({
      where: { id: timelineItemId },
    });

    if (!existing || existing.eventId !== eventId) {
      throw ApiError.notFound('Timeline item not found');
    }

    await prisma.timelineItem.delete({
      where: { id: timelineItemId },
    });

    return {
      id: timelineItemId,
      deleted: true,
    };
  }
}

