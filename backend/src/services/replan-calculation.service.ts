/**
 * Deterministic Re-Planning Impact Engine
 *
 * Implements authoritative mathematical and logical impact calculations
 * independent of any LLM. All financial values, deadline delta calculations,
 * and dependency validations are 100% deterministic, testable, and verifiable.
 */

export type ImpactSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type ImpactClassification =
  | 'NO_CHANGE_REQUIRED'
  | 'REVIEW_RECOMMENDED'
  | 'ADJUSTMENT_RECOMMENDED'
  | 'POTENTIAL_CONFLICT'
  | 'INSUFFICIENT_DATA';

export interface ImpactItem {
  id: string;
  module: 'budget' | 'guest' | 'task' | 'timeline' | 'vendor';
  recordId?: string | null;
  recordTitle?: string | null;
  classification: ImpactClassification;
  severity: ImpactSeverity;
  reason: string;
  currentValue?: any;
  proposedValue?: any;
  recommendedAction: string;
}

export interface BudgetImpactAnalysis {
  existingBudget: number;
  proposedBudget: number;
  budgetDifference: number;
  percentageChange: number;
  totalAllocated: number;
  totalActualExpenses: number;
  totalEstimatedExpenses: number;
  existingRemainingBudget: number;
  proposedRemainingBudget: number;
  existingUnallocated: number;
  proposedUnallocated: number;
  isDeficit: boolean;
  deficitAmount: number;
  isAllocationOverBudget: boolean;
  allocationOverageAmount: number;
  categoryDifferences: Array<{
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    actualSpent: number;
    estimatedTotal: number;
    variance: number;
    status: ImpactClassification;
    suggestedAllocation?: number;
  }>;
  conflicts: string[];
}

export interface GuestImpactAnalysis {
  existingGuestCount: number;
  proposedGuestCount: number;
  guestDifference: number;
  percentageChange: number;
  confirmedGuestCount: number;
  totalAttendingHeadcount: number;
  estimatedPlateCost: number | null;
  estimatedCateringImpact: number | null;
  capacityStatus: 'sufficient' | 'constrained' | 'exceeded' | 'unknown';
  impactedAreas: string[];
  conflicts: string[];
}

export interface TaskRescheduleSuggestion {
  taskId: string;
  title: string;
  currentDueDate: string | null;
  proposedDueDate: string | null;
  priority: string;
  status: string;
  reason: string;
  conflictType?: 'deadline_after_event' | 'overdue' | 'dependency_violation';
}

export interface DateImpactAnalysis {
  existingEventDate: string;
  proposedEventDate: string;
  daysDifference: number; // positive = earlier (event moved up), negative = postponed
  daysRemainingProposed: number;
  tasksAfterProposedDate: Array<{
    taskId: string;
    title: string;
    dueDate: string;
    status: string;
    priority: string;
  }>;
  overdueTasks: Array<{
    taskId: string;
    title: string;
    dueDate: string;
    priority: string;
  }>;
  taskDependencyConflicts: Array<{
    taskId: string;
    taskTitle: string;
    prerequisiteTaskId: string;
    prerequisiteTitle: string;
    reason: string;
  }>;
  timelineConflicts: Array<{
    timelineItemId: string;
    title: string;
    currentStartTime: string;
    suggestedStartTime: string;
    reason: string;
  }>;
  taskRescheduleSuggestions: TaskRescheduleSuggestion[];
  conflicts: string[];
}

export interface DeterministicImpactReport {
  summary: {
    hasBudgetChange: boolean;
    hasGuestChange: boolean;
    hasDateChange: boolean;
    overallImpactLevel: 'low' | 'moderate' | 'high' | 'critical';
    totalConflicts: number;
    totalAdjustmentsRecommended: number;
  };
  budgetImpact: BudgetImpactAnalysis | null;
  guestImpact: GuestImpactAnalysis | null;
  dateImpact: DateImpactAnalysis | null;
  impactItems: ImpactItem[];
}

// Input data shapes for pure calculations
export interface EventCalculationContext {
  id: string;
  name: string;
  date: Date | string;
  budget: number;
  currency: string;
  guestCount: number;
}

export interface BudgetCategoryData {
  id: string;
  name: string;
  allocatedAmount: number;
  expenses: Array<{
    estimatedAmount: number;
    actualAmount: number | null;
  }>;
}

export interface ExpenseData {
  id: string;
  categoryId?: string | null;
  estimatedAmount: number;
  actualAmount: number | null;
}

export interface GuestData {
  id: string;
  fullName: string;
  rsvpStatus: string;
  plusOneAllowed: boolean;
  plusOneCount: number;
}

export interface TaskData {
  id: string;
  title: string;
  dueDate: Date | string | null;
  priority: string;
  status: string;
  dependencies?: Array<{
    id: string;
    dependsOnTaskId: string;
    dependsOnTask?: {
      id: string;
      title: string;
      dueDate: Date | string | null;
    };
  }>;
}

export interface TimelineData {
  id: string;
  title: string;
  startTime: Date | string;
  endTime?: Date | string | null;
  category?: string | null;
  status: string;
}

export class ReplanCalculationService {
  /**
   * 1. Deterministic Budget Impact Calculation
   */
  public static calculateBudgetImpact(
    currentBudget: number,
    proposedBudget: number,
    categories: BudgetCategoryData[],
    expenses: ExpenseData[]
  ): { analysis: BudgetImpactAnalysis; items: ImpactItem[] } {
    const existingBudget = Number(currentBudget) || 0;
    const safeProposedBudget = Math.max(0, Number(proposedBudget) || 0);
    const budgetDifference = safeProposedBudget - existingBudget;

    let percentageChange = 0;
    if (existingBudget > 0) {
      percentageChange = Math.round(((safeProposedBudget - existingBudget) / existingBudget) * 10000) / 100;
    } else if (safeProposedBudget > 0) {
      percentageChange = 100;
    }

    const totalAllocated = categories.reduce((sum, c) => sum + Number(c.allocatedAmount || 0), 0);
    const totalActualExpenses = expenses.reduce((sum, e) => sum + Number(e.actualAmount || 0), 0);
    const totalEstimatedExpenses = expenses.reduce((sum, e) => sum + Number(e.estimatedAmount || 0), 0);

    const existingRemainingBudget = existingBudget - totalActualExpenses;
    const proposedRemainingBudget = safeProposedBudget - totalActualExpenses;

    const existingUnallocated = Math.max(0, existingBudget - totalAllocated);
    const proposedUnallocated = safeProposedBudget - totalAllocated;

    const isDeficit = proposedRemainingBudget < 0;
    const deficitAmount = isDeficit ? Math.abs(proposedRemainingBudget) : 0;

    const isAllocationOverBudget = safeProposedBudget < totalAllocated;
    const allocationOverageAmount = isAllocationOverBudget ? totalAllocated - safeProposedBudget : 0;

    const conflicts: string[] = [];
    const items: ImpactItem[] = [];

    // General budget impact item
    if (isDeficit) {
      conflicts.push(
        `Proposed budget of ₹${safeProposedBudget.toLocaleString()} is insufficient to cover ₹${totalActualExpenses.toLocaleString()} in already recorded actual expenses (deficit: ₹${deficitAmount.toLocaleString()})`
      );
      items.push({
        id: 'budget-deficit',
        module: 'budget',
        classification: 'POTENTIAL_CONFLICT',
        severity: 'critical',
        reason: `Proposed budget is less than already recorded actual expenses by ₹${deficitAmount.toLocaleString()}`,
        currentValue: existingBudget,
        proposedValue: safeProposedBudget,
        recommendedAction: `Increase proposed budget to at least ₹${totalActualExpenses.toLocaleString()} or review vendor commitments`,
      });
    } else if (isAllocationOverBudget) {
      conflicts.push(
        `Total category allocations (₹${totalAllocated.toLocaleString()}) exceed proposed budget by ₹${allocationOverageAmount.toLocaleString()}`
      );
      items.push({
        id: 'budget-over-allocation',
        module: 'budget',
        classification: 'ADJUSTMENT_RECOMMENDED',
        severity: 'high',
        reason: `Allocated categories exceed the new budget limit by ₹${allocationOverageAmount.toLocaleString()}`,
        currentValue: totalAllocated,
        proposedValue: safeProposedBudget,
        recommendedAction: 'Rebalance category allocations to fit the new total budget',
      });
    } else if (budgetDifference !== 0) {
      items.push({
        id: 'budget-change-notice',
        module: 'budget',
        classification: 'REVIEW_RECOMMENDED',
        severity: 'medium',
        reason: `Event budget will change by ${percentageChange > 0 ? '+' : ''}${percentageChange}% (₹${budgetDifference.toLocaleString()})`,
        currentValue: existingBudget,
        proposedValue: safeProposedBudget,
        recommendedAction: 'Review category allocations and unallocated reserves',
      });
    }

    // Category breakdown and overages
    const categoryDifferences = categories.map((cat) => {
      const allocated = Number(cat.allocatedAmount || 0);
      const actualSpent = cat.expenses.reduce((s, e) => s + Number(e.actualAmount || 0), 0);
      const estimatedTotal = cat.expenses.reduce((s, e) => s + Number(e.estimatedAmount || 0), 0);
      const variance = allocated - actualSpent;

      let status: ImpactClassification = 'NO_CHANGE_REQUIRED';
      if (actualSpent > allocated) {
        status = 'POTENTIAL_CONFLICT';
        items.push({
          id: `cat-${cat.id}-overspent`,
          module: 'budget',
          recordId: cat.id,
          recordTitle: cat.name,
          classification: 'POTENTIAL_CONFLICT',
          severity: 'high',
          reason: `Category "${cat.name}" has recorded expenses (₹${actualSpent.toLocaleString()}) exceeding allocation (₹${allocated.toLocaleString()})`,
          currentValue: allocated,
          proposedValue: actualSpent,
          recommendedAction: `Allocate at least ₹${actualSpent.toLocaleString()} to "${cat.name}"`,
        });
      } else if (safeProposedBudget < existingBudget && allocated > 0) {
        status = 'REVIEW_RECOMMENDED';
      }

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        allocatedAmount: allocated,
        actualSpent,
        estimatedTotal,
        variance,
        status,
      };
    });

    const analysis: BudgetImpactAnalysis = {
      existingBudget,
      proposedBudget: safeProposedBudget,
      budgetDifference,
      percentageChange,
      totalAllocated,
      totalActualExpenses,
      totalEstimatedExpenses,
      existingRemainingBudget,
      proposedRemainingBudget,
      existingUnallocated,
      proposedUnallocated,
      isDeficit,
      deficitAmount,
      isAllocationOverBudget,
      allocationOverageAmount,
      categoryDifferences,
      conflicts,
    };

    return { analysis, items };
  }

  /**
   * 2. Deterministic Guest Count Impact Calculation
   */
  public static calculateGuestImpact(
    currentGuestCount: number,
    proposedGuestCount: number,
    guests: GuestData[],
    categories: BudgetCategoryData[]
  ): { analysis: GuestImpactAnalysis; items: ImpactItem[] } {
    const existingGuestCount = Math.max(0, Number(currentGuestCount) || 0);
    const safeProposedGuestCount = Math.max(0, Number(proposedGuestCount) || 0);
    const guestDifference = safeProposedGuestCount - existingGuestCount;

    let percentageChange = 0;
    if (existingGuestCount > 0) {
      percentageChange = Math.round(((safeProposedGuestCount - existingGuestCount) / existingGuestCount) * 10000) / 100;
    } else if (safeProposedGuestCount > 0) {
      percentageChange = 100;
    }

    const confirmedGuests = guests.filter((g) => g.rsvpStatus.toLowerCase() === 'attending');
    const confirmedCount = confirmedGuests.length;
    const totalAttendingHeadcount = confirmedGuests.reduce(
      (sum, g) => sum + 1 + (g.plusOneAllowed ? g.plusOneCount || 0 : 0),
      0
    );

    // Identify catering category to check unit cost if available
    const cateringCategory = categories.find(
      (c) =>
        c.name.toLowerCase().includes('cater') ||
        c.name.toLowerCase().includes('food') ||
        c.name.toLowerCase().includes('dining')
    );

    let estimatedPlateCost: number | null = null;
    let estimatedCateringImpact: number | null = null;

    if (cateringCategory && existingGuestCount > 0 && cateringCategory.allocatedAmount > 0) {
      estimatedPlateCost = Math.round(Number(cateringCategory.allocatedAmount) / existingGuestCount);
      estimatedCateringImpact = guestDifference * estimatedPlateCost;
    }

    const conflicts: string[] = [];
    const items: ImpactItem[] = [];
    const impactedAreas: string[] = [];

    let capacityStatus: 'sufficient' | 'constrained' | 'exceeded' | 'unknown' = 'sufficient';

    // Conflict: Proposed headcount is lower than confirmed attendees
    if (safeProposedGuestCount < totalAttendingHeadcount) {
      capacityStatus = 'exceeded';
      const excess = totalAttendingHeadcount - safeProposedGuestCount;
      conflicts.push(
        `Proposed guest target (${safeProposedGuestCount}) is lower than currently confirmed headcount (${totalAttendingHeadcount} attending across ${confirmedCount} guests with plus-ones)`
      );
      items.push({
        id: 'guest-headcount-conflict',
        module: 'guest',
        classification: 'POTENTIAL_CONFLICT',
        severity: 'critical',
        reason: `Target of ${safeProposedGuestCount} is below confirmed headcount of ${totalAttendingHeadcount}`,
        currentValue: totalAttendingHeadcount,
        proposedValue: safeProposedGuestCount,
        recommendedAction: `Increase proposed guest count to at least ${totalAttendingHeadcount} or adjust RSVP confirmations`,
      });
    }

    if (guestDifference !== 0) {
      impactedAreas.push('Catering & Dining', 'Seating Layout', 'Invitations & RSVPs', 'Guest Favors');

      items.push({
        id: 'guest-count-change',
        module: 'guest',
        classification: guestDifference > 0 ? 'ADJUSTMENT_RECOMMENDED' : 'REVIEW_RECOMMENDED',
        severity: Math.abs(guestDifference) > 50 ? 'high' : 'medium',
        reason: `Guest count changing by ${guestDifference > 0 ? '+' : ''}${guestDifference} (${percentageChange > 0 ? '+' : ''}${percentageChange}%)`,
        currentValue: existingGuestCount,
        proposedValue: safeProposedGuestCount,
        recommendedAction:
          guestDifference > 0
            ? 'Verify venue capacity limits, table layouts, and request catering headcount revision'
            : 'Review minimum guarantee plates with venue and caterer to optimize costs',
      });

      if (estimatedCateringImpact !== null) {
        items.push({
          id: 'catering-cost-impact',
          module: 'budget',
          classification: 'ADJUSTMENT_RECOMMENDED',
          severity: 'medium',
          reason: `Estimated catering variance of ₹${estimatedCateringImpact.toLocaleString()} based on current per-plate allocation (~₹${estimatedPlateCost}/guest)`,
          currentValue: cateringCategory?.allocatedAmount,
          proposedValue: (cateringCategory?.allocatedAmount || 0) + estimatedCateringImpact,
          recommendedAction:
            guestDifference > 0
              ? 'Allocate additional budget to Catering or explore menu adjustments'
              : 'Review potential catering savings with vendor',
        });
      }
    }

    const analysis: GuestImpactAnalysis = {
      existingGuestCount,
      proposedGuestCount: safeProposedGuestCount,
      guestDifference,
      percentageChange,
      confirmedGuestCount: confirmedCount,
      totalAttendingHeadcount,
      estimatedPlateCost,
      estimatedCateringImpact,
      capacityStatus,
      impactedAreas,
      conflicts,
    };

    return { analysis, items };
  }

  /**
   * 3. Deterministic Date & Timeline Impact Calculation
   */
  public static calculateDateImpact(
    currentDateStr: string | Date,
    proposedDateStr: string | Date,
    tasks: TaskData[],
    timeline: TimelineData[],
    referenceDate: Date = new Date()
  ): { analysis: DateImpactAnalysis; items: ImpactItem[] } {
    const oldDate = new Date(currentDateStr);
    const newDate = new Date(proposedDateStr);

    const oldUtc = Date.UTC(oldDate.getFullYear(), oldDate.getMonth(), oldDate.getDate());
    const newUtc = Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
    const refUtc = Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDifference = Math.round((oldUtc - newUtc) / msPerDay); // >0 = earlier, <0 = later
    const daysRemainingProposed = Math.round((newUtc - refUtc) / msPerDay);

    const conflicts: string[] = [];
    const items: ImpactItem[] = [];

    // Date change notice
    if (daysDifference !== 0) {
      const isEarlier = daysDifference > 0;
      items.push({
        id: 'date-change-notice',
        module: 'timeline',
        classification: isEarlier ? 'ADJUSTMENT_RECOMMENDED' : 'REVIEW_RECOMMENDED',
        severity: isEarlier && daysDifference > 14 ? 'high' : 'medium',
        reason: `Event date changed from ${oldDate.toISOString().split('T')[0]} to ${newDate.toISOString().split('T')[0]} (${Math.abs(daysDifference)} days ${isEarlier ? 'earlier' : 'later'})`,
        currentValue: oldDate.toISOString().split('T')[0],
        proposedValue: newDate.toISOString().split('T')[0],
        recommendedAction: isEarlier
          ? 'Compress preparation schedule and expedite critical task deadlines'
          : 'Notify contracted vendors of updated event date',
      });
    }

    // Critical check: Proposed date is in the past
    if (daysRemainingProposed < 0) {
      conflicts.push(
        `Proposed event date (${newDate.toISOString().split('T')[0]}) is in the past (${Math.abs(daysRemainingProposed)} days ago)`
      );
      items.push({
        id: 'date-in-past-conflict',
        module: 'timeline',
        classification: 'POTENTIAL_CONFLICT',
        severity: 'critical',
        reason: 'Event date cannot be set in the past',
        currentValue: oldDate.toISOString().split('T')[0],
        proposedValue: newDate.toISOString().split('T')[0],
        recommendedAction: 'Select a valid future date for the celebration',
      });
    }

    // Tasks with deadlines after proposed event date
    const tasksAfterProposedDate: DateImpactAnalysis['tasksAfterProposedDate'] = [];
    const overdueTasks: DateImpactAnalysis['overdueTasks'] = [];
    const taskRescheduleSuggestions: TaskRescheduleSuggestion[] = [];

    for (const task of tasks) {
      if (!task.dueDate) continue;

      const taskDate = new Date(task.dueDate);
      const taskUtc = Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
      const isCompleted = task.status.toLowerCase() === 'completed' || task.status.toLowerCase() === 'cancelled';

      // Check overdue against today
      if (!isCompleted && taskUtc < refUtc) {
        overdueTasks.push({
          taskId: task.id,
          title: task.title,
          dueDate: taskDate.toISOString().split('T')[0],
          priority: task.priority,
        });
      }

      // Check task deadline falls AFTER the new event date
      if (taskUtc > newUtc) {
        tasksAfterProposedDate.push({
          taskId: task.id,
          title: task.title,
          dueDate: taskDate.toISOString().split('T')[0],
          status: task.status,
          priority: task.priority,
        });

        conflicts.push(
          `Task "${task.title}" has due date (${taskDate.toISOString().split('T')[0]}) after the proposed event date (${newDate.toISOString().split('T')[0]})`
        );

        items.push({
          id: `task-${task.id}-after-event`,
          module: 'task',
          recordId: task.id,
          recordTitle: task.title,
          classification: 'POTENTIAL_CONFLICT',
          severity: 'high',
          reason: `Due date (${taskDate.toISOString().split('T')[0]}) falls after the new event date`,
          currentValue: taskDate.toISOString().split('T')[0],
          proposedValue: newDate.toISOString().split('T')[0],
          recommendedAction: `Reschedule "${task.title}" to on or before ${newDate.toISOString().split('T')[0]}`,
        });
      }

      // Calculate suggested rescheduled task date if event date changed
      if (daysDifference !== 0 && !isCompleted) {
        // Shift task date proportionally or by daysDifference
        const shiftedUtc = taskUtc - daysDifference * msPerDay;
        const proposedTaskDue = new Date(shiftedUtc).toISOString().split('T')[0];

        taskRescheduleSuggestions.push({
          taskId: task.id,
          title: task.title,
          currentDueDate: taskDate.toISOString().split('T')[0],
          proposedDueDate: proposedTaskDue,
          priority: task.priority,
          status: task.status,
          reason: daysDifference > 0
            ? `Advanced by ${daysDifference} days to match earlier celebration date`
            : `Extended by ${Math.abs(daysDifference)} days to match postponed date`,
        });
      }
    }

    // Task dependency conflict analysis
    const taskMap = new Map<string, TaskData>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    const taskDependencyConflicts: DateImpactAnalysis['taskDependencyConflicts'] = [];

    for (const task of tasks) {
      if (!task.dependencies || task.dependencies.length === 0) continue;
      if (!task.dueDate) continue;

      const taskDate = new Date(task.dueDate);

      for (const dep of task.dependencies) {
        const prereq = taskMap.get(dep.dependsOnTaskId);
        if (!prereq || !prereq.dueDate) continue;

        const prereqDate = new Date(prereq.dueDate);

        // Prerequisite should finish on or before dependent task
        if (prereqDate.getTime() > taskDate.getTime()) {
          taskDependencyConflicts.push({
            taskId: task.id,
            taskTitle: task.title,
            prerequisiteTaskId: prereq.id,
            prerequisiteTitle: prereq.title,
            reason: `Prerequisite "${prereq.title}" due date (${prereqDate.toISOString().split('T')[0]}) is after dependent task "${task.title}" due date (${taskDate.toISOString().split('T')[0]})`,
          });

          conflicts.push(
            `Dependency violation: Prerequisite "${prereq.title}" is due after dependent task "${task.title}"`
          );

          items.push({
            id: `task-dep-${task.id}-${prereq.id}`,
            module: 'task',
            recordId: task.id,
            recordTitle: task.title,
            classification: 'POTENTIAL_CONFLICT',
            severity: 'high',
            reason: `Prerequisite "${prereq.title}" has deadline after dependent task`,
            currentValue: taskDate.toISOString().split('T')[0],
            proposedValue: prereqDate.toISOString().split('T')[0],
            recommendedAction: `Ensure "${prereq.title}" completes before "${task.title}" starts`,
          });
        }
      }
    }

    // Timeline item conflict analysis
    const timelineConflicts: DateImpactAnalysis['timelineConflicts'] = [];

    for (const item of timeline) {
      const itemStart = new Date(item.startTime);
      const itemStartUtc = Date.UTC(itemStart.getFullYear(), itemStart.getMonth(), itemStart.getDate());

      // If timeline item was scheduled on the original event date, calculate suggested shift
      if (daysDifference !== 0) {
        const shiftedStartUtc = itemStart.getTime() - daysDifference * msPerDay;
        const suggestedStartTime = new Date(shiftedStartUtc).toISOString();

        timelineConflicts.push({
          timelineItemId: item.id,
          title: item.title,
          currentStartTime: item.startTime.toString(),
          suggestedStartTime,
          reason: `Milestone scheduled for old date; should shift by ${Math.abs(daysDifference)} days`,
        });

        items.push({
          id: `timeline-${item.id}-shift`,
          module: 'timeline',
          recordId: item.id,
          recordTitle: item.title,
          classification: 'ADJUSTMENT_RECOMMENDED',
          severity: 'medium',
          reason: `Timeline milestone "${item.title}" needs realignment with new event date`,
          currentValue: itemStart.toISOString(),
          proposedValue: suggestedStartTime,
          recommendedAction: `Update start time to ${new Date(suggestedStartTime).toISOString().split('T')[0]}`,
        });
      }
    }

    const analysis: DateImpactAnalysis = {
      existingEventDate: oldDate.toISOString().split('T')[0],
      proposedEventDate: newDate.toISOString().split('T')[0],
      daysDifference,
      daysRemainingProposed,
      tasksAfterProposedDate,
      overdueTasks,
      taskDependencyConflicts,
      timelineConflicts,
      taskRescheduleSuggestions,
      conflicts,
    };

    return { analysis, items };
  }

  /**
   * 4. Master Deterministic Impact Analysis Orchestrator
   */
  public static analyzeCombinedImpact(
    currentEvent: EventCalculationContext,
    categories: BudgetCategoryData[],
    expenses: ExpenseData[],
    guests: GuestData[],
    tasks: TaskData[],
    timeline: TimelineData[],
    proposedChanges: {
      budget?: { proposed: number };
      guestCount?: { proposed: number };
      eventDate?: { proposed: string };
    }
  ): DeterministicImpactReport {
    const hasBudgetChange = proposedChanges.budget !== undefined && proposedChanges.budget !== null;
    const hasGuestChange = proposedChanges.guestCount !== undefined && proposedChanges.guestCount !== null;
    const hasDateChange = proposedChanges.eventDate !== undefined && proposedChanges.eventDate !== null;

    let budgetImpact: BudgetImpactAnalysis | null = null;
    let guestImpact: GuestImpactAnalysis | null = null;
    let dateImpact: DateImpactAnalysis | null = null;

    const allItems: ImpactItem[] = [];
    const allConflicts: string[] = [];

    if (hasBudgetChange) {
      const budgetRes = this.calculateBudgetImpact(
        currentEvent.budget,
        proposedChanges.budget!.proposed,
        categories,
        expenses
      );
      budgetImpact = budgetRes.analysis;
      allItems.push(...budgetRes.items);
      allConflicts.push(...budgetRes.analysis.conflicts);
    }

    if (hasGuestChange) {
      const guestRes = this.calculateGuestImpact(
        currentEvent.guestCount,
        proposedChanges.guestCount!.proposed,
        guests,
        categories
      );
      guestImpact = guestRes.analysis;
      allItems.push(...guestRes.items);
      allConflicts.push(...guestRes.analysis.conflicts);
    }

    if (hasDateChange) {
      const dateRes = this.calculateDateImpact(
        currentEvent.date,
        proposedChanges.eventDate!.proposed,
        tasks,
        timeline
      );
      dateImpact = dateRes.analysis;
      allItems.push(...dateRes.items);
      allConflicts.push(...dateRes.analysis.conflicts);
    }

    // Determine overall impact level
    let overallImpactLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';

    const hasCritical = allItems.some((i) => i.severity === 'critical');
    const hasHigh = allItems.some((i) => i.severity === 'high');
    const hasMedium = allItems.some((i) => i.severity === 'medium');

    if (hasCritical) {
      overallImpactLevel = 'critical';
    } else if (hasHigh || allConflicts.length >= 2) {
      overallImpactLevel = 'high';
    } else if (hasMedium || allItems.length >= 3) {
      overallImpactLevel = 'moderate';
    }

    const totalAdjustmentsRecommended = allItems.filter(
      (i) => i.classification === 'ADJUSTMENT_RECOMMENDED' || i.classification === 'REVIEW_RECOMMENDED'
    ).length;

    return {
      summary: {
        hasBudgetChange,
        hasGuestChange,
        hasDateChange,
        overallImpactLevel,
        totalConflicts: allConflicts.length,
        totalAdjustmentsRecommended,
      },
      budgetImpact,
      guestImpact,
      dateImpact,
      impactItems: allItems,
    };
  }
}

