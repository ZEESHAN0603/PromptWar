/**
 * EventPilot AI — Phase 7 Context-Aware AI Co-Pilot Types
 */

export type CopilotToolName =
  | 'getEventOverview'
  | 'getBudgetSummary'
  | 'getGuestSummary'
  | 'getTaskSummary'
  | 'getTimelineSummary'
  | 'getApprovedVendors'
  | 'getSavedIdeas'
  | 'getReplanningHistory';

export type CopilotActionType =
  | 'create_task'
  | 'update_task'
  | 'add_timeline_item'
  | 'save_idea'
  | 'create_replan_proposal';

export interface CopilotActionPreview {
  actionType: CopilotActionType;
  title: string;
  summary: string;
  targetEntity: string;
  proposedData: Record<string, any>;
  requiresConfirmation: true;
  warnings?: string[];
}

export interface CopilotChatResponse {
  reply: string;
  conversationId: string;
  messageId: string;
  actionPreview?: CopilotActionPreview | null;
  recommendations: string[];
  eventContextSummary?: {
    eventId: string;
    eventName: string;
    eventType: string;
    budgetUtilization: number;
    tasksTotal: number;
    tasksCompleted: number;
    confirmedGuests: number;
  } | null;
}

export interface CopilotConversationDto {
  id: string;
  userId: string;
  eventId: string | null;
  eventName?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface CopilotMessageDto {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  actionPreview?: CopilotActionPreview | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface AllowlistedToolDefinition {
  name: CopilotToolName;
  description: string;
  parameters: Record<string, any>;
}

