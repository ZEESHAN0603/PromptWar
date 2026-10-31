import { Request, Response, NextFunction } from 'express';
import { GuestService } from '../services/guest.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getParam } from '../utils/params.js';
import {
  createGuestSchema,
  updateGuestSchema,
  listGuestsQuerySchema,
} from '../validators/guest.validator.js';

export class GuestController {
  static async createGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const validatedInput = createGuestSchema.parse(req.body);
      const result = await GuestService.createGuest(req.user.id, eventId, validatedInput);
      ApiResponse.created(res, result, 'Guest added successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listGuests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const query = listGuestsQuerySchema.parse(req.query);
      const result = await GuestService.listGuests(req.user.id, eventId, query);
      ApiResponse.success(res, result, 'Guests retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getGuestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const guestId = getParam(req, 'guestId');
      const result = await GuestService.getGuestById(req.user.id, eventId, guestId);
      ApiResponse.success(res, result, 'Guest retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const guestId = getParam(req, 'guestId');
      const validatedInput = updateGuestSchema.parse(req.body);
      const result = await GuestService.updateGuest(req.user.id, eventId, guestId, validatedInput);
      ApiResponse.success(res, result, 'Guest updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteGuest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const guestId = getParam(req, 'guestId');
      const result = await GuestService.deleteGuest(req.user.id, eventId, guestId);
      ApiResponse.success(res, result, 'Guest deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getGuestSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const result = await GuestService.getGuestSummary(req.user.id, eventId);
      ApiResponse.success(res, result, 'Guest summary retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
