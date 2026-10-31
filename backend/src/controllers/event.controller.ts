import { Request, Response, NextFunction } from 'express';
import { EventService } from '../services/event.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createEventSchema,
  updateEventSchema,
  listEventsQuerySchema,
} from '../validators/event.validator.js';

export class EventController {
  /**
   * POST /api/events
   * Creates a new event for the authenticated user.
   */
  static async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validatedInput = createEventSchema.parse(req.body);
      const created = await EventService.createEvent(req.user.id, validatedInput);

      ApiResponse.created(res, created, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events
   * Lists events owned by the authenticated user with pagination and filters.
   */
  static async listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const query = listEventsQuerySchema.parse(req.query);
      const result = await EventService.listEvents(req.user.id, query);

      ApiResponse.success(res, result, 'Events retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId
   * Retrieves single event details, enforcing ownership isolation.
   */
  static async getEventDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId } = req.params;
      if (!eventId || typeof eventId !== 'string') {
        throw ApiError.badRequest('Valid event ID is required');
      }

      const event = await EventService.getEventById(req.user.id, eventId);
      ApiResponse.success(res, event, 'Event retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/events/:eventId
   * Partially updates an event owned by the authenticated user.
   */
  static async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId } = req.params;
      if (!eventId || typeof eventId !== 'string') {
        throw ApiError.badRequest('Valid event ID is required');
      }

      const validatedInput = updateEventSchema.parse(req.body);
      const updated = await EventService.updateEvent(req.user.id, eventId, validatedInput);

      ApiResponse.success(res, updated, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/events/:eventId
   * Deletes an event owned by the authenticated user.
   */
  static async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId } = req.params;
      if (!eventId || typeof eventId !== 'string') {
        throw ApiError.badRequest('Valid event ID is required');
      }

      const result = await EventService.deleteEvent(req.user.id, eventId);
      ApiResponse.success(res, result, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

