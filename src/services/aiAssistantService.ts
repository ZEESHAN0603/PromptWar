import { apiClient } from './apiClient';
import {
  AIMessage,
  EventModel,
  BudgetCategoryItem,
  TaskItem,
  VendorItem,
  CopilotActionPreview,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface AIResponsePayload {
  reply: string;
  suggestedAction?: AIMessage['suggestedAction'];
  recommendations?: string[];
  actionPreview?: CopilotActionPreview | null;
  eventContextSummary?: any;
  conversationId?: string;
  messageId?: string;
}

/**
 * Sends chat query to backend Context-Aware AI Co-Pilot API.
 * Connects directly to authenticated Express backend with real PostgreSQL & Gemini context.
 */
export async function processAIChat(
  query: string,
  event?: EventModel | null,
  _budgets?: BudgetCategoryItem[],
  _tasks?: TaskItem[],
  _vendors?: VendorItem[],
  conversationId?: string | null
): Promise<AIResponsePayload> {
  try {
    const res = await apiClient.copilotChat({
      message: query,
      eventId: event?.id || null,
      conversationId: conversationId || null,
    });

    return {
      reply: res.reply,
      suggestedAction: res.actionPreview
        ? {
            type: res.actionPreview.actionType as any,
            label: res.actionPreview.title,
            payload: res.actionPreview.proposedData,
          }
        : undefined,
      recommendations: res.recommendations || [],
      actionPreview: res.actionPreview || null,
      eventContextSummary: res.eventContextSummary || null,
      conversationId: res.conversationId,
      messageId: res.messageId,
    };
  } catch (error: any) {
    // If backend returns an error or network is offline, provide graceful deterministic guidance
    const fallbackReply = event
      ? `### Notice\nI encountered a connection issue reaching the backend Co-Pilot service. Here is your current offline status for **${event.name}**:\n\n• **Date**: ${formatDate(event.date)}\n• **Planned Budget**: ${formatCurrency(event.totalBudget, event.currency)}\n• **Expected Guests**: ${event.expectedGuests} attendees\n\nPlease check your server connection or retry your question.`
      : 'I encountered an issue reaching the AI Co-Pilot service. Please verify your connection and retry.';

    return {
      reply: fallbackReply,
      recommendations: [
        'Analyze my remaining budget',
        'What tasks are overdue?',
        'Show confirmed guest count',
      ],
      actionPreview: null,
    };
  }
}
