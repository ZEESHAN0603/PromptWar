import { ApiError } from '../utils/ApiError.js';
import { CopilotContextService } from './copilot-context.service.js';
import { CopilotToolName, AllowlistedToolDefinition } from '../types/copilot.types.js';

export const ALLOWLISTED_TOOLS: Record<CopilotToolName, AllowlistedToolDefinition> = {
  getEventOverview: {
    name: 'getEventOverview',
    description: 'Retrieves fundamental event details including type, date, location, overall budget, and status.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getBudgetSummary: {
    name: 'getBudgetSummary',
    description: 'Retrieves budget allocations, recorded expenses, remaining balance, and overage warnings.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getGuestSummary: {
    name: 'getGuestSummary',
    description: 'Retrieves guest statistics, confirmed attending count, pending invitations, and headcounts.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getTaskSummary: {
    name: 'getTaskSummary',
    description: 'Retrieves task counts, overdue tasks, pending urgent milestones, and recent checklist items.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getTimelineSummary: {
    name: 'getTimelineSummary',
    description: 'Retrieves the run-of-show schedule, milestones, and chronological event activities.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getApprovedVendors: {
    name: 'getApprovedVendors',
    description: 'Retrieves approved community vendors and vendors currently assigned to this event workspace.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getSavedIdeas: {
    name: 'getSavedIdeas',
    description: 'Retrieves personalized celebration ideas bookmarked or generated for this event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
  getReplanningHistory: {
    name: 'getReplanningHistory',
    description: 'Retrieves previous adaptive re-planning proposals, approval statuses, and version snapshots.',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string', description: 'The UUID of the event' },
      },
      required: ['eventId'],
    },
  },
};

export class CopilotToolsService {
  /**
   * Executes an allowlisted context tool with strict server-side validation.
   */
  public static async executeTool(
    toolName: string,
    args: Record<string, any>,
    userId: string,
    authorizedEventId: string
  ): Promise<any> {
    if (!toolName || !(toolName in ALLOWLISTED_TOOLS)) {
      throw ApiError.badRequest(`Tool "${toolName}" is not an allowlisted tool`);
    }

    // Strict validation: enforce that the target eventId matches the authorized event
    const targetEventId = args?.eventId || authorizedEventId;
    if (targetEventId !== authorizedEventId) {
      throw ApiError.forbidden('Cannot execute tool against an unauthorized event ID');
    }

    switch (toolName as CopilotToolName) {
      case 'getEventOverview':
        return CopilotContextService.getEventOverview(userId, targetEventId);

      case 'getBudgetSummary':
        return CopilotContextService.getBudgetSummary(userId, targetEventId);

      case 'getGuestSummary':
        return CopilotContextService.getGuestSummary(userId, targetEventId);

      case 'getTaskSummary':
        return CopilotContextService.getTaskSummary(userId, targetEventId);

      case 'getTimelineSummary':
        return CopilotContextService.getTimelineSummary(userId, targetEventId);

      case 'getApprovedVendors':
        return CopilotContextService.getApprovedVendors(userId, targetEventId);

      case 'getSavedIdeas':
        return CopilotContextService.getSavedIdeas(userId, targetEventId);

      case 'getReplanningHistory':
        return CopilotContextService.getReplanningHistory(userId, targetEventId);

      default:
        throw ApiError.badRequest(`Unhandled allowlisted tool: ${toolName}`);
    }
  }
}

