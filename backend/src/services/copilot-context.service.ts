import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { BudgetService } from './budget.service.js';
import { GuestService } from './guest.service.js';
import { TaskService } from './task.service.js';
import { TimelineService } from './timeline.service.js';
import { listEventVendors } from './event-vendor.service.js';
import { getRecommendationsForEvent } from './vendor-recommendation.service.js';
import { getEventIdeas } from './idea.service.js';
import { ReplanService } from './replan.service.js';

export class CopilotContextService {
  /**
   * Verifies that the event exists and is strictly owned by the authenticated user.
   */
  public static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found or access denied');
    }

    return event;
  }

  /**
   * 1. Event Overview
   */
  public static async getEventOverview(userId: string, eventId: string) {
    const event = await this.verifyEventOwnership(userId, eventId);

    return {
      id: event.id,
      name: event.name,
      type: event.type,
      date: event.date.toISOString().split('T')[0],
      location: event.location,
      description: event.description || null,
      budget: Number(event.budget),
      guestCount: event.guestCount,
      theme: event.theme || null,
      currency: event.currency,
      status: event.status,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  /**
   * 2. Budget Summary & Expense Allocations
   */
  public static async getBudgetSummary(userId: string, eventId: string) {
    // Reuses verified BudgetService
    const summary = await BudgetService.getBudgetSummary(userId, eventId);

    return {
      totalBudget: summary.totalBudget,
      totalAllocated: summary.totalAllocated,
      totalActualExpenses: summary.totalActualExpenses,
      totalEstimatedExpenses: summary.totalEstimatedExpenses,
      remainingBudget: summary.remainingBudget,
      budgetUtilization: summary.budgetUtilization,
      currency: summary.currency,
      categories: summary.categoryBreakdown.map((cat) => ({
        name: cat.name,
        allocatedAmount: cat.allocatedAmount,
        actualExpenses: cat.actualExpenses,
        variance: cat.variance,
        isOverspent: cat.isOverspent,
      })),
      uncategorizedExpensesCount: summary.uncategorizedExpensesCount,
      warnings: summary.warnings,
    };
  }

  /**
   * 3. Guest Summary & RSVPs
   */
  public static async getGuestSummary(userId: string, eventId: string) {
    // Reuses verified GuestService
    const summary = await GuestService.getGuestSummary(userId, eventId);

    return {
      totalGuests: summary.totalGuests,
      attendingCount: summary.attendingCount,
      declinedCount: summary.declinedCount,
      pendingCount: summary.pendingCount,
      invitedCount: summary.invitedCount,
      totalPermittedPlusOnes: summary.totalPermittedPlusOnes,
      expectedAttendeesHeadcount: summary.expectedAttendeesHeadcount,
      categoryBreakdown: summary.categoryBreakdown,
      dietaryBreakdown: summary.dietaryBreakdown,
    };
  }

  /**
   * 4. Task Summary & Upcoming Deadlines
   */
  public static async getTaskSummary(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const taskResult = await TaskService.listTasks(userId, eventId, {
      page: 1,
      limit: 100,
      sortBy: 'dueDate_asc',
    });

    const tasks = taskResult.tasks;
    const now = new Date();

    const completed = tasks.filter((t) => t.status === 'completed');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const todo = tasks.filter((t) => t.status === 'todo');
    const overdue = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < now
    );

    const criticalPending = tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        (t.priority === 'urgent' || t.priority === 'high')
    );

    return {
      totalTasks: tasks.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      todoCount: todo.length,
      overdueCount: overdue.length,
      overdueTasks: overdue.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      criticalPendingTasks: criticalPending.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      recentTasks: tasks.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        hasDependencies: (t.dependencies && t.dependencies.length > 0) || false,
      })),
    };
  }

  /**
   * 5. Timeline Milestones & Run-of-Show
   */
  public static async getTimelineSummary(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const items = await TimelineService.listTimelineItems(userId, eventId, {
      sortBy: 'startTime_asc',
    });

    return {
      totalTimelineItems: items.length,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location,
        category: item.category,
        status: item.status,
      })),
    };
  }

  /**
   * 6. Approved Community Vendors & Event Selections
   */
  public static async getApprovedVendors(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const [assignedVendors, recommendedResult] = await Promise.all([
      listEventVendors(eventId, userId),
      getRecommendationsForEvent(eventId, userId).catch(() => []),
    ]);

    // Sanitize vendor records: strip privateNotes or internal submission notes
    const assigned = assignedVendors.map((av: any) => ({
      vendorId: av.vendorId,
      name: av.vendor.name,
      category: av.category,
      selectionStatus: av.selectionStatus,
      contactStatus: av.contactStatus,
      estimatedCost: Number(av.estimatedCost),
      actualCost: av.actualCost !== null ? Number(av.actualCost) : null,
      city: av.vendor.city,
      rating: av.vendor.rating ? Number(av.vendor.rating) : null,
    }));

    const recommendations = (Array.isArray(recommendedResult) ? recommendedResult : []).slice(0, 5).map((rec: any) => ({
      vendorId: rec.vendor?.id,
      name: rec.vendor?.name,
      category: rec.vendor?.category,
      city: rec.vendor?.city,
      matchScore: rec.matchScore,
      rating: rec.vendor?.rating ? Number(rec.vendor.rating) : null,
      reasons: rec.reasons || [],
    }));

    return {
      assignedVendorsCount: assigned.length,
      assignedVendors: assigned,
      topRecommendedVendors: recommendations,
    };
  }

  /**
   * 7. Saved Personalized Ideas
   */
  public static async getSavedIdeas(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const ideas = await getEventIdeas(eventId, userId);
    const saved = ideas.filter((idea: any) => idea.isSaved);

    return {
      totalIdeasGenerated: ideas.length,
      savedIdeasCount: saved.length,
      savedIdeas: saved.map((i: any) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        description: i.description,
        estimatedBudgetRange: i.estimatedBudgetRange,
        matchReason: i.matchReason,
      })),
    };
  }

  /**
   * 8. Adaptive Re-planning History & Versions
   */
  public static async getReplanningHistory(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const [proposals, versions] = await Promise.all([
      ReplanService.listProposals(userId, eventId).catch(() => []),
      ReplanService.listVersions(userId, eventId).catch(() => []),
    ]);

    return {
      totalProposals: proposals.length,
      appliedProposalsCount: proposals.filter((p: any) => p.status === 'APPLIED').length,
      latestProposal: proposals[0]
        ? {
            id: proposals[0].id,
            status: proposals[0].status,
            reason: proposals[0].reason,
            proposedChanges: proposals[0].proposedChanges,
            createdAt: proposals[0].createdAt,
          }
        : null,
      totalVersionsCount: versions.length,
      latestVersion: versions[0]
        ? {
            versionNumber: versions[0].versionNumber,
            changeSummary: versions[0].changeSummary,
            createdAt: versions[0].createdAt,
          }
        : null,
    };
  }

  /**
   * Comprehensive context package for initial AI prompt priming
   */
  public static async getComprehensiveContext(userId: string, eventId: string) {
    const [overview, budget, guests, tasks, timeline, vendors, ideas, replan] =
      await Promise.all([
        this.getEventOverview(userId, eventId),
        this.getBudgetSummary(userId, eventId),
        this.getGuestSummary(userId, eventId),
        this.getTaskSummary(userId, eventId),
        this.getTimelineSummary(userId, eventId),
        this.getApprovedVendors(userId, eventId),
        this.getSavedIdeas(userId, eventId),
        this.getReplanningHistory(userId, eventId),
      ]);

    return {
      overview,
      budget,
      guests,
      tasks,
      timeline,
      vendors,
      ideas,
      replan,
    };
  }
}
