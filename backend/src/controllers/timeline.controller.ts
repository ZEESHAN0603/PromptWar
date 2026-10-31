import { Request, Response, NextFunction } from 'express';
import { TimelineService } from '../services/timeline.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { getParam } from '../utils/params.js';
import {
  createTimelineItemSchema,
  updateTimelineItemSchema,
  listTimelineQuerySchema,
} from '../validators/timeline.validator.js';

export class TimelineController {
  static async createTimelineItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const validatedInput = createTimelineItemSchema.parse(req.body);
      const result = await TimelineService.createTimelineItem(req.user.id, eventId, validatedInput);
      ApiResponse.created(res, result, 'Timeline activity created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async listTimelineItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const query = listTimelineQuerySchema.parse(req.query);
      const result = await TimelineService.listTimelineItems(req.user.id, eventId, query);
      ApiResponse.success(res, result, 'Timeline activities retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTimelineItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const timelineItemId = getParam(req, 'timelineItemId');
      const result = await TimelineService.getTimelineItemById(req.user.id, eventId, timelineItemId);
      ApiResponse.success(res, result, 'Timeline activity retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTimelineItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const timelineItemId = getParam(req, 'timelineItemId');
      const validatedInput = updateTimelineItemSchema.parse(req.body);
      const result = await TimelineService.updateTimelineItem(
        req.user.id,
        eventId,
        timelineItemId,
        validatedInput
      );
      ApiResponse.success(res, result, 'Timeline activity updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimelineItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('Authentication required');
      const eventId = getParam(req, 'eventId');
      const timelineItemId = getParam(req, 'timelineItemId');
      const result = await TimelineService.deleteTimelineItem(req.user.id, eventId, timelineItemId);
      ApiResponse.success(res, result, 'Timeline activity deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
