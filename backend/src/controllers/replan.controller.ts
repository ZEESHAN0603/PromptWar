import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  createReplanProposalSchema,
  applyReplanProposalSchema,
} from '../validators/replan.validator.js';
import { ReplanService } from '../services/replan.service.js';

export class ReplanController {
  /**
   * POST /api/events/:eventId/replan
   * Analyzes impact deterministically and synthesizes Gemini recommendations.
   */
  static async createProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const eventId = req.params.eventId as string;
      const parsed = createReplanProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest('Invalid re-planning request', parsed.error.errors);
      }

      const proposal = await ReplanService.createProposal(userId, eventId, parsed.data);
      ApiResponse.created(res, proposal, 'Re-planning proposal generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/replan/:proposalId
   * Retrieves proposal with stale detection.
   */
  static async getProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId, proposalId } = req.params as { eventId: string; proposalId: string };
      const proposal = await ReplanService.getProposal(userId, eventId, proposalId);
      ApiResponse.success(res, proposal, 'Proposal retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/events/:eventId/replan/:proposalId/apply
   * Atomically applies selectively approved changes.
   */
  static async applyProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId, proposalId } = req.params as { eventId: string; proposalId: string };
      const parsed = applyReplanProposalSchema.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest('Invalid approval request payload', parsed.error.errors);
      }

      const result = await ReplanService.applyProposal(userId, eventId, proposalId, parsed.data);
      ApiResponse.success(res, result, 'Approved re-planning changes applied successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/events/:eventId/replan/:proposalId/reject
   * Rejects proposal.
   */
  static async rejectProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId, proposalId } = req.params as { eventId: string; proposalId: string };
      const result = await ReplanService.rejectProposal(userId, eventId, proposalId);
      ApiResponse.success(res, result, 'Proposal rejected successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/versions
   * Retrieves all historical plan versions.
   */
  static async listVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId } = req.params as { eventId: string };
      const versions = await ReplanService.listVersions(userId, eventId);
      ApiResponse.success(res, { versions }, 'Plan versions retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/versions/:versionId
   * Retrieves single plan version snapshot.
   */
  static async getVersionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId, versionId } = req.params as { eventId: string; versionId: string };
      const version = await ReplanService.getVersionById(userId, eventId, versionId);
      ApiResponse.success(res, version, 'Plan version retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/events/:eventId/versions/compare?from=:fromId&to=:toId
   * Compares two plan versions.
   */
  static async compareVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw ApiError.unauthorized('Authentication required');
      }

      const { eventId } = req.params as { eventId: string };
      const { from, to } = req.query as { from?: string; to?: string };

      if (!from || !to) {
        throw ApiError.badRequest('Both "from" and "to" version query parameters are required for comparison');
      }

      const comparison = await ReplanService.compareVersions(userId, eventId, from, to);
      ApiResponse.success(res, comparison, 'Version comparison generated successfully');
    } catch (error) {
      next(error);
    }
  }
}

