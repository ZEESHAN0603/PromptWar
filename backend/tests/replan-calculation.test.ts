import { describe, it, expect } from 'vitest';
import {
  ReplanCalculationService,
  EventCalculationContext,
  BudgetCategoryData,
  ExpenseData,
  GuestData,
  TaskData,
  TimelineData,
} from '../src/services/replan-calculation.service.js';

describe('Deterministic Re-Planning Calculation Engine (Phase 6.2)', () => {
  const baseEvent: EventCalculationContext = {
    id: 'evt-100',
    name: 'Roy & Aditi Grand Celebration',
    date: '2026-12-15T00:00:00.000Z',
    budget: 800000,
    currency: 'INR',
    guestCount: 200,
  };

  const sampleCategories: BudgetCategoryData[] = [
    {
      id: 'cat-venue',
      name: 'Venue & Lawns',
      allocatedAmount: 300000,
      expenses: [
        { estimatedAmount: 300000, actualAmount: 280000 },
      ],
    },
    {
      id: 'cat-catering',
      name: 'Catering & Dining',
      allocatedAmount: 250000,
      expenses: [
        { estimatedAmount: 250000, actualAmount: 100000 },
      ],
    },
    {
      id: 'cat-decor',
      name: 'Decor & Florals',
      allocatedAmount: 150000,
      expenses: [
        { estimatedAmount: 150000, actualAmount: null },
      ],
    },
    {
      id: 'cat-photo',
      name: 'Photography',
      allocatedAmount: 100000,
      expenses: [
        { estimatedAmount: 100000, actualAmount: 50000 },
      ],
    },
  ];

  const sampleExpenses: ExpenseData[] = [
    { id: 'exp-1', categoryId: 'cat-venue', estimatedAmount: 300000, actualAmount: 280000 },
    { id: 'exp-2', categoryId: 'cat-catering', estimatedAmount: 250000, actualAmount: 100000 },
    { id: 'exp-3', categoryId: 'cat-decor', estimatedAmount: 150000, actualAmount: null },
    { id: 'exp-4', categoryId: 'cat-photo', estimatedAmount: 100000, actualAmount: 50000 },
  ];

  const sampleGuests: GuestData[] = [
    { id: 'g-1', fullName: 'Aarav Patel', rsvpStatus: 'attending', plusOneAllowed: true, plusOneCount: 1 },
    { id: 'g-2', fullName: 'Diya Sharma', rsvpStatus: 'attending', plusOneAllowed: false, plusOneCount: 0 },
    { id: 'g-3', fullName: 'Rohan Joshi', rsvpStatus: 'declined', plusOneAllowed: false, plusOneCount: 0 },
    { id: 'g-4', fullName: 'Ananya Roy', rsvpStatus: 'pending', plusOneAllowed: true, plusOneCount: 1 },
  ];

  describe('Budget Calculations', () => {
    // 1. Budget difference
    it('1. should calculate exact budget difference (new - old)', () => {
      const { analysis } = ReplanCalculationService.calculateBudgetImpact(
        800000,
        700000,
        sampleCategories,
        sampleExpenses
      );
      expect(analysis.budgetDifference).toBe(-100000);
      expect(analysis.existingBudget).toBe(800000);
      expect(analysis.proposedBudget).toBe(700000);
    });

    // 2. Budget percentage
    it('2. should calculate accurate percentage change rounded to two decimals', () => {
      const { analysis } = ReplanCalculationService.calculateBudgetImpact(
        800000,
        700000,
        sampleCategories,
        sampleExpenses
      );
      expect(analysis.percentageChange).toBe(-12.5);

      const increase = ReplanCalculationService.calculateBudgetImpact(
        500000,
        600000,
        [],
        []
      );
      expect(increase.analysis.percentageChange).toBe(20);
    });

    // 3. Remaining budget
    it('3. should calculate remaining budget against actual expenses accurately', () => {
      // Total actual = 280,000 + 100,000 + 50,000 = 430,000
      const { analysis } = ReplanCalculationService.calculateBudgetImpact(
        800000,
        600000,
        sampleCategories,
        sampleExpenses
      );
      expect(analysis.totalActualExpenses).toBe(430000);
      expect(analysis.existingRemainingBudget).toBe(800000 - 430000); // 370,000
      expect(analysis.proposedRemainingBudget).toBe(600000 - 430000); // 170,000
      expect(analysis.isDeficit).toBe(false);
    });

    // 4. Zero-budget handling
    it('4. should safely handle zero and edge-case initial budget without dividing by zero', () => {
      const { analysis } = ReplanCalculationService.calculateBudgetImpact(
        0,
        200000,
        [],
        []
      );
      expect(analysis.existingBudget).toBe(0);
      expect(analysis.proposedBudget).toBe(200000);
      expect(analysis.percentageChange).toBe(100);
      expect(Number.isFinite(analysis.percentageChange)).toBe(true);
    });

    // 5. Missing-budget handling & deficit detection
    it('5. should detect critical deficit when proposed budget is lower than committed actual expenses', () => {
      // Actual expenses = 430,000. Proposed budget = 350,000. Deficit = 80,000.
      const { analysis, items } = ReplanCalculationService.calculateBudgetImpact(
        800000,
        350000,
        sampleCategories,
        sampleExpenses
      );
      expect(analysis.isDeficit).toBe(true);
      expect(analysis.deficitAmount).toBe(80000);
      expect(analysis.conflicts.length).toBeGreaterThan(0);
      expect(items.some((i) => i.id === 'budget-deficit' && i.severity === 'critical')).toBe(true);
    });

    // 6. Category allocation conflicts
    it('6. should detect when allocated category sums exceed the proposed budget', () => {
      // Total allocated = 300k + 250k + 150k + 100k = 800,000.
      // Proposed budget = 750,000. Overage = 50,000.
      const { analysis, items } = ReplanCalculationService.calculateBudgetImpact(
        800000,
        750000,
        sampleCategories,
        sampleExpenses
      );
      expect(analysis.isAllocationOverBudget).toBe(true);
      expect(analysis.allocationOverageAmount).toBe(50000);
      expect(items.some((i) => i.id === 'budget-over-allocation' && i.classification === 'ADJUSTMENT_RECOMMENDED')).toBe(true);
    });
  });

  describe('Guest Count Calculations', () => {
    // 7. Guest count difference
    it('7. should calculate guest headcount difference accurately', () => {
      const { analysis } = ReplanCalculationService.calculateGuestImpact(
        200,
        250,
        sampleGuests,
        sampleCategories
      );
      expect(analysis.guestDifference).toBe(50);
      expect(analysis.existingGuestCount).toBe(200);
      expect(analysis.proposedGuestCount).toBe(250);
    });

    // 8. Guest count percentage
    it('8. should calculate guest percentage change accurately', () => {
      const { analysis } = ReplanCalculationService.calculateGuestImpact(
        200,
        150,
        sampleGuests,
        sampleCategories
      );
      expect(analysis.guestDifference).toBe(-50);
      expect(analysis.percentageChange).toBe(-25);
    });

    // 9. Zero or unknown guest count safely
    it('9. should safely handle zero initial guests without division errors', () => {
      const { analysis } = ReplanCalculationService.calculateGuestImpact(
        0,
        100,
        [],
        []
      );
      expect(analysis.existingGuestCount).toBe(0);
      expect(analysis.proposedGuestCount).toBe(100);
      expect(analysis.percentageChange).toBe(100);
      expect(Number.isFinite(analysis.percentageChange)).toBe(true);
    });

    // Unit-cost catering calculation and confirmed headcount conflict
    it('should calculate catering impact and detect conflict if proposed count < confirmed attendees', () => {
      // sampleGuests: 2 attending (Aarav + 1 plusOne = 2, Diya = 1). Total attending headcount = 3.
      // If proposed guest target is 2, it should flag a conflict.
      const { analysis, items } = ReplanCalculationService.calculateGuestImpact(
        200,
        2,
        sampleGuests,
        sampleCategories
      );
      expect(analysis.totalAttendingHeadcount).toBe(3);
      expect(analysis.capacityStatus).toBe('exceeded');
      expect(items.some((i) => i.id === 'guest-headcount-conflict' && i.severity === 'critical')).toBe(true);
    });
  });

  describe('Date and Timeline Calculations', () => {
    const fixedNow = new Date('2026-10-01T00:00:00.000Z');

    const sampleTasks: TaskData[] = [
      {
        id: 't-1',
        title: 'Book Venue Contract',
        dueDate: '2026-10-15T00:00:00.000Z',
        priority: 'high',
        status: 'completed',
      },
      {
        id: 't-2',
        title: 'Tasting Session with Caterer',
        dueDate: '2026-11-01T00:00:00.000Z',
        priority: 'medium',
        status: 'todo',
      },
      {
        id: 't-3',
        title: 'Final Headcount & Table Placement',
        dueDate: '2026-12-10T00:00:00.000Z',
        priority: 'high',
        status: 'todo',
      },
      {
        id: 't-4',
        title: 'Post-Event Photo Album Selection',
        dueDate: '2026-12-25T00:00:00.000Z',
        priority: 'low',
        status: 'todo',
      },
      {
        id: 't-overdue',
        title: 'Send Save-the-Dates',
        dueDate: '2026-09-15T00:00:00.000Z', // Past fixedNow
        priority: 'urgent',
        status: 'todo',
      },
    ];

    const sampleTimeline: TimelineData[] = [
      {
        id: 'tl-1',
        title: 'Baraat & Welcome Drinks',
        startTime: '2026-12-15T16:00:00.000Z',
        category: 'Ceremony',
        status: 'scheduled',
      },
      {
        id: 'tl-2',
        title: 'Reception Dinner',
        startTime: '2026-12-15T20:00:00.000Z',
        category: 'Catering',
        status: 'scheduled',
      },
    ];

    // 10. Date difference
    it('10. should calculate exact days difference when event is advanced or postponed', () => {
      // Advancing from Dec 15 to Dec 01 = 14 days earlier (>0)
      const { analysis } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        sampleTasks,
        sampleTimeline,
        fixedNow
      );
      expect(analysis.daysDifference).toBe(14);

      // Postponing from Dec 15 to Dec 25 = -10 days (<0)
      const postponed = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-25T00:00:00.000Z',
        sampleTasks,
        sampleTimeline,
        fixedNow
      );
      expect(postponed.analysis.daysDifference).toBe(-10);
    });

    // 11. Days remaining
    it('11. should calculate days remaining until the proposed event date', () => {
      // From 2026-10-01 to 2026-12-01 = 61 days
      const { analysis } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        sampleTasks,
        sampleTimeline,
        fixedNow
      );
      expect(analysis.daysRemainingProposed).toBe(61);
    });

    // 12. Overdue task detection
    it('12. should detect overdue incomplete tasks relative to reference date', () => {
      const { analysis } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        sampleTasks,
        sampleTimeline,
        fixedNow
      );
      expect(analysis.overdueTasks.some((t) => t.taskId === 't-overdue')).toBe(true);
    });

    // 13. Task deadline conflicts
    it('13. should flag tasks whose deadlines fall after the new event date', () => {
      // If proposed date is 2026-12-01, task t-3 (Dec 10) and t-4 (Dec 25) fall after the event!
      const { analysis, items } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        sampleTasks,
        sampleTimeline,
        fixedNow
      );
      expect(analysis.tasksAfterProposedDate.length).toBe(2);
      expect(analysis.tasksAfterProposedDate.map((t) => t.taskId)).toEqual(['t-3', 't-4']);
      expect(items.some((i) => i.id === 'task-t-3-after-event' && i.classification === 'POTENTIAL_CONFLICT')).toBe(true);
    });

    // 14. Task dependency conflicts
    it('14. should detect task dependency violations when prerequisite deadline is after dependent task', () => {
      const tasksWithDeps: TaskData[] = [
        {
          id: 't-dependent',
          title: 'Print Place Cards',
          dueDate: '2026-11-10T00:00:00.000Z',
          priority: 'medium',
          status: 'todo',
          dependencies: [
            {
              id: 'dep-1',
              dependsOnTaskId: 't-prereq',
              dependsOnTask: {
                id: 't-prereq',
                title: 'Finalize Guest Seating Chart',
                dueDate: '2026-11-15T00:00:00.000Z', // After dependent due date!
              },
            },
          ],
        },
        {
          id: 't-prereq',
          title: 'Finalize Guest Seating Chart',
          dueDate: '2026-11-15T00:00:00.000Z',
          priority: 'high',
          status: 'todo',
        },
      ];

      const { analysis, items } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        tasksWithDeps,
        [],
        fixedNow
      );

      expect(analysis.taskDependencyConflicts.length).toBe(1);
      expect(analysis.taskDependencyConflicts[0].taskId).toBe('t-dependent');
      expect(analysis.taskDependencyConflicts[0].prerequisiteTaskId).toBe('t-prereq');
      expect(items.some((i) => i.id === 'task-dep-t-dependent-t-prereq')).toBe(true);
    });

    // 15. Timeline milestone conflicts
    it('15. should identify timeline items that need shifting when event date changes', () => {
      const { analysis, items } = ReplanCalculationService.calculateDateImpact(
        '2026-12-15T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        [],
        sampleTimeline,
        fixedNow
      );

      expect(analysis.timelineConflicts.length).toBe(2);
      expect(analysis.timelineConflicts[0].timelineItemId).toBe('tl-1');
      expect(items.some((i) => i.id === 'timeline-tl-1-shift')).toBe(true);
    });
  });

  describe('Combined Master Analysis', () => {
    it('should aggregate multi-dimensional changes into a comprehensive deterministic report', () => {
      const report = ReplanCalculationService.analyzeCombinedImpact(
        baseEvent,
        sampleCategories,
        sampleExpenses,
        sampleGuests,
        [],
        [],
        {
          budget: { proposed: 700000 },
          guestCount: { proposed: 250 },
          eventDate: { proposed: '2026-12-01T00:00:00.000Z' },
        }
      );

      expect(report.summary.hasBudgetChange).toBe(true);
      expect(report.summary.hasGuestChange).toBe(true);
      expect(report.summary.hasDateChange).toBe(true);
      expect(report.budgetImpact).not.toBeNull();
      expect(report.guestImpact).not.toBeNull();
      expect(report.dateImpact).not.toBeNull();
      expect(report.impactItems.length).toBeGreaterThan(0);
    });
  });
});

