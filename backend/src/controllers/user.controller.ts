import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { updateProfileSchema } from '../validators/user.validator.js';

export class UserController {
  /**
   * GET /api/users/me
   * Retrieves or automatically provisions the profile for the authenticated user.
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const profile = await UserService.getOrCreateProfile(req.user);
      ApiResponse.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/me
   * Updates permitted profile fields.
   */
  static async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const updated = await UserService.updateProfile(req.user.id, validatedData);
      ApiResponse.success(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me/events
   * Returns all events owned by the authenticated user.
   */
  static async getMyEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const events = await UserService.getUserEvents(req.user.id);
      ApiResponse.success(res, events, 'User events retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

