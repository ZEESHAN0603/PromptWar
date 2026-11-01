import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import {
  CreateReplanProposalInput,
  ApplyReplanProposalInput,
} from '../validators/replan.validator.js';
import {
  ReplanCalculationService,
  EventCalculationContext,
} from './replan-calculation.service.js';
import { geminiService } from './gemini.service.js';
import { formatEvent } from '../utils/event-formatter.js';

export class ReplanService {
  /**
   * Helper: verify event existence and ownership.
   */
  public static async verifyEventOwnership(userId: string, eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.userId !== userId) {
      throw ApiError.notFound('Event not found');
    }

    return event;
  }

  /**
   * 1. Generate a Re-planning Proposal
   */
  public static async createProposal(
    userId: string,
    eventId: string,
    input: CreateReplanProposalInput
  ) {
    const event = await this.verifyEventOwnership(userId, eventId);

    // Fetch related event entities needed for deterministic calculations
    const [categories, expenses, guests, tasks, timeline] = await Promise.all([
      prisma.budgetCategory.findMany({
        where: { eventId },
        include: {
          expenses: {
            select: { estimatedAmount: true, actualAmount: true },
          },
        },
      }),
      prisma.expense.findMany({
        where: { eventId },
        select: { id: true, categoryId: true, estimatedAmount: true, actualAmount: true },
      }),
      prisma.guest.findMany({
        where: { eventId },
        select: {
          id: true,
          fullName: true,
          rsvpStatus: true,
          plusOneAllowed: true,
          plusOneCount: true,
        },
      }),
      prisma.task.findMany({
        where: { eventId },
        include: {
          dependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, title: true, dueDate: true },
              },
            },
          },
        },
      }),
      prisma.timelineItem.findMany({
        where: { eventId },
        select: { id: true, title: true, startTime: true, endTime: true, category: true, status: true },
      }),
    ]);

    // Format contexts for calculation service
    const eventContext: EventCalculationContext = {
      id: event.id,
      name: event.name,
      date: event.date,
      budget: Number(event.budget),
      currency: event.currency,
      guestCount: event.guestCount,
    };

    const formattedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      allocatedAmount: Number(c.allocatedAmount),
      expenses: c.expenses.map((e) => ({
        estimatedAmount: Number(e.estimatedAmount || 0),
        actualAmount: e.actualAmount !== null ? Number(e.actualAmount) : null,
      })),
    }));

    const formattedExpenses = expenses.map((e) => ({
      id: e.id,
      categoryId: e.categoryId,
      estimatedAmount: Number(e.estimatedAmount || 0),
      actualAmount: e.actualAmount !== null ? Number(e.actualAmount) : null,
    }));

    // Run authoritative deterministic calculation engine
    const impactReport = ReplanCalculationService.analyzeCombinedImpact(
      eventContext,
      formattedCategories,
      formattedExpenses,
      guests,
      tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
        status: t.status,
        dependencies: t.dependencies.map((d) => ({
          id: d.id,
          dependsOnTaskId: d.dependsOnTaskId,
          dependsOnTask: d.dependsOnTask ? {
            id: d.dependsOnTask.id,
            title: d.dependsOnTask.title,
            dueDate: d.dependsOnTask.dueDate,
          } : undefined,
        })),
      })),
      timeline,
      input.changes
    );

    // Generate intelligent AI explanations and trade-offs using Gemini
    let aiRecommendations: any = null;
    try {
      aiRecommendations = await geminiService.generateReplanRecommendations(
        {
          id: event.id,
          name: event.name,
          type: event.type,
          date: event.date,
          location: event.location,
          guestCount: event.guestCount,
          budget: Number(event.budget),
          currency: event.currency,
          theme: event.theme,
          description: event.description,
        },
        input.changes,
        impactReport,
        input.reason
      );
    } catch (aiErr: any) {
      logger.warn(
        { eventId, error: aiErr.message },
        'Gemini re-planning intelligence call failed or unavailable; persisting deterministic impact without AI'
      );
      // AI failure must not block the user: deterministic calculations remain available
      aiRecommendations = null;
    }

    // Persist proposal into Supabase PostgreSQL
    const proposal = await prisma.eventReplanProposal.create({
      data: {
        eventId,
        userId,
        status: 'READY_FOR_REVIEW',
        proposedChanges: input.changes as any,
        impactReport: impactReport as any,
        aiRecommendations: aiRecommendations as any,
        baseEventUpdatedAt: event.updatedAt,
        reason: input.reason || null,
      },
    });

    return {
      proposalId: proposal.id,
      eventId: proposal.eventId,
      status: proposal.status,
      proposedChanges: proposal.proposedChanges,
      impactReport: proposal.impactReport,
      aiRecommendations: proposal.aiRecommendations,
      baseEventUpdatedAt: proposal.baseEventUpdatedAt.toISOString(),
      reason: proposal.reason,
      createdAt: proposal.createdAt.toISOString(),
    };
  }

  /**
   * 2. Retrieve a Proposal with Stale Detection
   */
  public static async getProposal(userId: string, eventId: string, proposalId: string) {
    const event = await this.verifyEventOwnership(userId, eventId);

    const proposal = await prisma.eventReplanProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.eventId !== eventId || proposal.userId !== userId) {
      throw ApiError.notFound('Re-planning proposal not found');
    }

    // Detect stale proposal: Event was modified after proposal was generated
    const isStale = event.updatedAt.getTime() > proposal.baseEventUpdatedAt.getTime();

    return {
      proposalId: proposal.id,
      eventId: proposal.eventId,
      status: proposal.status,
      proposedChanges: proposal.proposedChanges,
      impactReport: proposal.impactReport,
      aiRecommendations: proposal.aiRecommendations,
      baseEventUpdatedAt: proposal.baseEventUpdatedAt.toISOString(),
      currentEventUpdatedAt: event.updatedAt.toISOString(),
      isStale,
      reason: proposal.reason,
      createdAt: proposal.createdAt.toISOString(),
      appliedAt: proposal.appliedAt ? proposal.appliedAt.toISOString() : null,
    };
  }

  /**
   * 3. Selectively Apply Approved Proposal Changes in Atomic Transaction
   */
  public static async applyProposal(
    userId: string,
    eventId: string,
    proposalId: string,
    input: ApplyReplanProposalInput
  ) {
    const event = await this.verifyEventOwnership(userId, eventId);

    const proposal = await prisma.eventReplanProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.eventId !== eventId || proposal.userId !== userId) {
      throw ApiError.notFound('Re-planning proposal not found');
    }

    // Rule: Duplicate application prevention
    if (proposal.status === 'APPLIED') {
      throw ApiError.conflict('This re-planning proposal has already been applied');
    }

    if (proposal.status === 'REJECTED') {
      throw ApiError.badRequest('Cannot apply a rejected re-planning proposal');
    }

    // Rule: Stale proposal protection
    if (event.updatedAt.getTime() > proposal.baseEventUpdatedAt.getTime()) {
      throw ApiError.conflict(
        'The celebration was modified after this re-planning proposal was generated. Please review current details and generate a fresh proposal.'
      );
    }

    const proposedChanges = proposal.proposedChanges as any;
    const { approvedChanges, approvedTaskChanges, approvedTimelineChanges } = input;

    // Execute atomic transaction: All operations succeed or entirely rollback
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Capture pre-application state snapshot for version history
      const [currentCategories, currentTasks, currentTimeline, currentExpenses] = await Promise.all([
        tx.budgetCategory.findMany({ where: { eventId } }),
        tx.task.findMany({ where: { eventId } }),
        tx.timelineItem.findMany({ where: { eventId } }),
        tx.expense.findMany({ where: { eventId } }),
      ]);

      const preSnapshot = {
        event: {
          id: event.id,
          name: event.name,
          date: event.date.toISOString(),
          budget: Number(event.budget),
          guestCount: event.guestCount,
          location: event.location,
          status: event.status,
        },
        budgetCategories: currentCategories.map((c) => ({
          id: c.id,
          name: c.name,
          allocatedAmount: Number(c.allocatedAmount),
        })),
        tasks: currentTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
          status: t.status,
          priority: t.priority,
        })),
        timelineItems: currentTimeline.map((tl) => ({
          id: tl.id,
          title: tl.title,
          startTime: tl.startTime.toISOString(),
          endTime: tl.endTime ? tl.endTime.toISOString() : null,
        })),
        expensesSummary: {
          totalActual: currentExpenses.reduce((s, e) => s + Number(e.actualAmount || 0), 0),
          totalEstimated: currentExpenses.reduce((s, e) => s + Number(e.estimatedAmount || 0), 0),
          count: currentExpenses.length,
        },
      };

      // Step B: Determine next sequential version number
      const versionCount = await tx.eventPlanVersion.count({ where: { eventId } });
      const versionNumber = versionCount + 1;

      // Step C: Apply selectively approved core event changes
      const eventUpdates: Record<string, any> = {};

      if (approvedChanges.budget && proposedChanges.budget) {
        eventUpdates.budget = proposedChanges.budget.proposed;
      }
      if (approvedChanges.guestCount && proposedChanges.guestCount) {
        eventUpdates.guestCount = proposedChanges.guestCount.proposed;
      }
      if (approvedChanges.eventDate && proposedChanges.eventDate) {
        eventUpdates.date = new Date(proposedChanges.eventDate.proposed);
      }

      let updatedEvent = event;
      if (Object.keys(eventUpdates).length > 0) {
        updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: eventUpdates,
        });
      }

      // Step D: Apply approved task due date adjustments
      if (approvedTaskChanges && approvedTaskChanges.length > 0) {
        for (const taskChange of approvedTaskChanges) {
          const existingTask = await tx.task.findUnique({ where: { id: taskChange.taskId } });
          if (existingTask && existingTask.eventId === eventId) {
            await tx.task.update({
              where: { id: taskChange.taskId },
              data: { dueDate: new Date(taskChange.proposedDueDate) },
            });
          }
        }
      }

      // Step E: Apply approved timeline milestone adjustments
      if (approvedTimelineChanges && approvedTimelineChanges.length > 0) {
        for (const tlChange of approvedTimelineChanges) {
          const existingItem = await tx.timelineItem.findUnique({ where: { id: tlChange.timelineItemId } });
          if (existingItem && existingItem.eventId === eventId) {
            await tx.timelineItem.update({
              where: { id: tlChange.timelineItemId },
              data: { startTime: new Date(tlChange.proposedStartTime) },
            });
          }
        }
      }

      // Step F: Record immutable plan version history snapshot
      const changeSummary = {
        approvedChanges,
        appliedTaskCount: approvedTaskChanges?.length || 0,
        appliedTimelineCount: approvedTimelineChanges?.length || 0,
        reason: proposal.reason || 'Client re-planning adjustment',
        sourceProposalId: proposal.id,
        appliedAt: new Date().toISOString(),
      };

      const planVersion = await tx.eventPlanVersion.create({
        data: {
          eventId,
          userId,
          versionNumber,
          snapshot: preSnapshot as any,
          changeSummary: changeSummary as any,
          sourceProposalId: proposal.id,
        },
      });

      // Step G: Mark proposal as APPLIED
      await tx.eventReplanProposal.update({
        where: { id: proposal.id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedChanges: {
            approvedChanges,
            approvedTaskChanges,
            approvedTimelineChanges,
          } as any,
        },
      });

      return {
        event: formatEvent(updatedEvent),
        versionNumber: planVersion.versionNumber,
        versionId: planVersion.id,
        appliedChanges: approvedChanges,
      };
    });

    return result;
  }

  /**
   * 4. Reject a Re-planning Proposal
   */
  public static async rejectProposal(userId: string, eventId: string, proposalId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const proposal = await prisma.eventReplanProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal || proposal.eventId !== eventId || proposal.userId !== userId) {
      throw ApiError.notFound('Re-planning proposal not found');
    }

    if (proposal.status === 'APPLIED') {
      throw ApiError.badRequest('Cannot reject a proposal that has already been applied');
    }

    const updated = await prisma.eventReplanProposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED' },
    });

    return {
      proposalId: updated.id,
      status: updated.status,
      message: 'Proposal successfully rejected',
    };
  }

  /**
   * 5. Retrieve Event Version History
   */
  public static async listVersions(userId: string, eventId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const versions = await prisma.eventPlanVersion.findMany({
      where: { eventId },
      orderBy: { versionNumber: 'desc' },
      include: {
        sourceProposal: {
          select: {
            id: true,
            status: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      eventId: v.eventId,
      versionNumber: v.versionNumber,
      versionLabel: `v${v.versionNumber}.0`,
      snapshot: v.snapshot,
      changeSummary: v.changeSummary,
      sourceProposalId: v.sourceProposalId,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  /**
   * 6. Retrieve Single Version Details
   */
  public static async getVersionById(userId: string, eventId: string, versionId: string) {
    await this.verifyEventOwnership(userId, eventId);

    const version = await prisma.eventPlanVersion.findUnique({
      where: { id: versionId },
      include: {
        sourceProposal: true,
      },
    });

    if (!version || version.eventId !== eventId || version.userId !== userId) {
      throw ApiError.notFound('Event plan version not found');
    }

    return {
      id: version.id,
      eventId: version.eventId,
      versionNumber: version.versionNumber,
      versionLabel: `v${version.versionNumber}.0`,
      snapshot: version.snapshot,
      changeSummary: version.changeSummary,
      sourceProposal: version.sourceProposal ? {
        id: version.sourceProposal.id,
        status: version.sourceProposal.status,
        proposedChanges: version.sourceProposal.proposedChanges,
        reason: version.sourceProposal.reason,
      } : null,
      createdAt: version.createdAt.toISOString(),
    };
  }

  /**
   * 7. Deterministic Version-to-Version Comparison
   */
  public static async compareVersions(
    userId: string,
    eventId: string,
    fromVersionId: string,
    toVersionId: string
  ) {
    await this.verifyEventOwnership(userId, eventId);

    const [fromVersion, toVersion] = await Promise.all([
      prisma.eventPlanVersion.findUnique({ where: { id: fromVersionId } }),
      prisma.eventPlanVersion.findUnique({ where: { id: toVersionId } }),
    ]);

    if (!fromVersion || fromVersion.eventId !== eventId) {
      throw ApiError.notFound('From-version not found');
    }
    if (!toVersion || toVersion.eventId !== eventId) {
      throw ApiError.notFound('To-version not found');
    }

    const fromSnap = fromVersion.snapshot as any;
    const toSnap = toVersion.snapshot as any;

    const diffs: Array<{
      field: string;
      fromValue: any;
      toValue: any;
      difference: any;
    }> = [];

    // Compare budget
    const fromBudget = Number(fromSnap.event?.budget || 0);
    const toBudget = Number(toSnap.event?.budget || 0);
    if (fromBudget !== toBudget) {
      diffs.push({
        field: 'Budget',
        fromValue: fromBudget,
        toValue: toBudget,
        difference: toBudget - fromBudget,
      });
    }

    // Compare guest count
    const fromGuests = Number(fromSnap.event?.guestCount || 0);
    const toGuests = Number(toSnap.event?.guestCount || 0);
    if (fromGuests !== toGuests) {
      diffs.push({
        field: 'Guest Count',
        fromValue: fromGuests,
        toValue: toGuests,
        difference: toGuests - fromGuests,
      });
    }

    // Compare date
    const fromDate = fromSnap.event?.date;
    const toDate = toSnap.event?.date;
    if (fromDate && toDate && fromDate !== toDate) {
      diffs.push({
        field: 'Event Date',
        fromValue: fromDate,
        toValue: toDate,
        difference: `${fromDate.split('T')[0]} → ${toDate.split('T')[0]}`,
      });
    }

    return {
      fromVersion: {
        id: fromVersion.id,
        versionNumber: fromVersion.versionNumber,
        label: `v${fromVersion.versionNumber}.0`,
        createdAt: fromVersion.createdAt.toISOString(),
      },
      toVersion: {
        id: toVersion.id,
        versionNumber: toVersion.versionNumber,
        label: `v${toVersion.versionNumber}.0`,
        createdAt: toVersion.createdAt.toISOString(),
      },
      differences: diffs,
    };
  }
}
