import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { CopilotService } from '../services/copilot.service.js';
import {
  chatRequestSchema,
  createConversationSchema,
  actionPreviewSchema,
  actionConfirmSchema,
} from '../validators/copilot.validator.js';

export class CopilotController {
  /**
   * POST /api/copilot/chat
   * Sends user message and receives context-aware AI response.
   */
  public static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validatedInput = chatRequestSchema.parse(req.body);
      const result = await CopilotService.processChat(userId, validatedInput);

      ApiResponse.success(res, result, 'AI response generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/copilot/conversations
   * Retrieves user's planning chat conversations.
   */
  public static async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
      const conversations = await CopilotService.listConversations(userId, eventId);

      ApiResponse.success(res, { conversations }, 'Conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/copilot/conversations
   * Creates a new conversation thread.
   */
  public static async createConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validated = createConversationSchema.parse(req.body);
      const conversation = await CopilotService.createConversation(userId, validated.eventId, validated.title);

      ApiResponse.created(res, { conversation }, 'Conversation created successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/copilot/conversations/:id
   * Retrieves messages for an owned conversation.
   */
  public static async getConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const conversationId = String(req.params.id);
      const result = await CopilotService.getConversationMessages(userId, conversationId);

      ApiResponse.success(res, result, 'Conversation messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/copilot/conversations/:id
   * Deletes an owned conversation thread.
   */
  public static async deleteConversation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const conversationId = String(req.params.id);
      const result = await CopilotService.deleteConversation(userId, conversationId);

      ApiResponse.success(res, result, 'Conversation deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/copilot/actions/preview
   * Generates a validated action preview without mutating data.
   */
  public static async previewAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validated = actionPreviewSchema.parse(req.body);
      const preview = await CopilotService.previewAction(userId, validated);

      ApiResponse.success(res, { actionPreview: preview }, 'Action preview prepared successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/copilot/actions/confirm
   * Explicitly executes an approved action using existing application services.
   */
  public static async confirmAction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const validated = actionConfirmSchema.parse(req.body);
      const result = await CopilotService.confirmAction(userId, validated);

      ApiResponse.success(res, result.data, result.message);
    } catch (error) {
      next(error);
    }
  }
}
