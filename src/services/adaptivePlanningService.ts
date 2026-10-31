import {
  EventModel,
  BudgetCategoryItem,
  TaskItem,
  VendorItem,
  AdaptiveImpactReport,
  PriorityLevel,
} from '../types';

export interface PlanModificationRequest {
  newBudget?: number;
  newGuestCount?: number;
  newDate?: string; // YYYY-MM-DD
  notes?: string;
  foodPreferenceAdjustments?: string;
  decorPreferenceAdjustments?: string;
}

export function simulatePlanImpact(
  currentEvent: EventModel,
  currentBudgets: BudgetCategoryItem[],
  currentTasks: TaskItem[],
  currentVendors: VendorItem[],
  request: PlanModificationRequest
): {
  report: AdaptiveImpactReport;
  adjustedBudgets: BudgetCategoryItem[];
  adjustedTasks: TaskItem[];
} {
  const newBudget = request.newBudget ?? currentEvent.totalBudget;
  const newGuests = request.newGuestCount ?? currentEvent.expectedGuests;
  const newDateStr = request.newDate ?? currentEvent.date;

  const budgetDelta = newBudget - currentEvent.totalBudget;
  const guestDelta = newGuests - currentEvent.expectedGuests;

  // 1. Calculate Date / Timeline Shift
  const oldEventTimestamp = new Date(currentEvent.date + 'T00:00:00').getTime();
  const newEventTimestamp = new Date(newDateStr + 'T00:00:00').getTime();
  const daysShift = Math.round((oldEventTimestamp - newEventTimestamp) / (1000 * 60 * 60 * 24)); // > 0 means shifted earlier

  // 2. Changes Detected
  const changesDetected: AdaptiveImpactReport['changesDetected'] = [];
  if (budgetDelta !== 0) {
    changesDetected.push({
      field: 'Total Budget',
      from: currentEvent.totalBudget,
      to: newBudget,
      difference: (budgetDelta > 0 ? '+' : '') + budgetDelta,
    });
  }
  if (guestDelta !== 0) {
    changesDetected.push({
      field: 'Expected Guests',
      from: currentEvent.expectedGuests,
      to: newGuests,
      difference: (guestDelta > 0 ? '+' : '') + guestDelta,
    });
  }
  if (daysShift !== 0) {
    changesDetected.push({
      field: 'Event Date',
      from: currentEvent.date,
      to: newDateStr,
      difference: daysShift > 0 ? `${daysShift} days earlier` : `${Math.abs(daysShift)} days later`,
    });
  }

  // 3. Deterministic Budget Reallocation
  // If budget decreases or guests increase, catering needs protection (cost per plate),
  // while non-essential categories like decoration, entertainment, or contingency can absorb reductions.
  const adjustedBudgets: BudgetCategoryItem[] = [];
  const reallocatedCategories: AdaptiveImpactReport['budgetImpact']['reallocatedCategories'] = [];

  const currentTotalAllocated = currentBudgets.reduce((sum, b) => sum + b.allocated, 0);
  const scalingRatio = currentTotalAllocated > 0 ? newBudget / currentTotalAllocated : 1;

  // Weightings based on event priorities
  // Higher priority items (Venue, Catering) take less reduction; decoration/entertainment take more if budget drops.
  for (const cat of currentBudgets) {
    const isCatering = cat.name.toLowerCase().includes('cater') || cat.name.toLowerCase().includes('food');
    const isVenue = cat.name.toLowerCase().includes('venue');
    const isContingency = cat.name.toLowerCase().includes('contingency');
    const isDecor = cat.name.toLowerCase().includes('decor');
    const isEntertainment = cat.name.toLowerCase().includes('entertainment');

    let newAllocated = cat.allocated;

    if (budgetDelta < 0) {
      // Budget dropped
      if (isCatering && guestDelta > 0) {
        // Guest increased while budget dropped: Catering must actually be maintained or adjusted carefully
        // E.g., slight per-plate menu streamlining (-5% instead of -15%)
        newAllocated = Math.round(cat.allocated * 0.95);
      } else if (isVenue) {
        // Venue contracts are usually fixed, minimize cut
        newAllocated = Math.round(cat.allocated * 0.93);
      } else if (isContingency) {
        // Contingency takes a direct buffer reduction
        newAllocated = Math.max(15000, Math.round(cat.allocated * 0.7));
      } else if (isDecor || isEntertainment) {
        // Flexible categories absorb bigger cut
        newAllocated = Math.round(cat.allocated * 0.78);
      } else {
        newAllocated = Math.round(cat.allocated * scalingRatio);
      }
    } else if (budgetDelta > 0) {
      // Budget increased
      if (isCatering || isVenue || isDecor) {
        newAllocated = Math.round(cat.allocated * 1.15);
      } else {
        newAllocated = Math.round(cat.allocated * (newBudget / currentEvent.totalBudget));
      }
    } else if (guestDelta > 0 && isCatering) {
      // Same budget but more guests: reallocate a bit to catering from non-essentials
      newAllocated = Math.round(cat.allocated * (1 + (guestDelta / currentEvent.expectedGuests) * 0.5));
    }

    // Ensure round numbers to hundreds
    newAllocated = Math.round(newAllocated / 500) * 500;

    const delta = newAllocated - cat.allocated;
    let adjustmentReason = 'Preserved baseline estimate';
    if (delta < 0) {
      adjustmentReason = isDecor
        ? 'Streamlined floral installations & lighting package to absorb budget constraint'
        : isEntertainment
        ? 'Opted for acoustic ensemble or DJ package revision'
        : isContingency
        ? 'Adjusted safety reserve to prioritize core guest hospitality'
        : 'Optimized package pricing with vendor negotiation target';
    } else if (delta > 0) {
      adjustmentReason = isCatering
        ? `Expanded per-plate allocation to accommodate +${guestDelta} additional attendees`
        : 'Enhanced experience tier allocation';
    }

    reallocatedCategories.push({
      category: cat.name,
      oldAmount: cat.allocated,
      newAmount: newAllocated,
      delta,
      adjustmentReason,
    });

    adjustedBudgets.push({
      ...cat,
      allocated: newAllocated,
    });
  }

  // Adjust total allocated to sum cleanly to newBudget if discrepancy
  const totalAdjusted = adjustedBudgets.reduce((acc, c) => acc + c.allocated, 0);
  const differenceToBudget = newBudget - totalAdjusted;
  if (adjustedBudgets.length > 0 && differenceToBudget !== 0) {
    adjustedBudgets[0].allocated += differenceToBudget;
    const found = reallocatedCategories.find((r) => r.category === adjustedBudgets[0].name);
    if (found) {
      found.newAmount += differenceToBudget;
      found.delta = found.newAmount - found.oldAmount;
    }
  }

  // 4. Deterministic Timeline & Task Recalculation
  const adjustedTasks: TaskItem[] = [];
  const urgentTasks: AdaptiveImpactReport['timelineImpact']['urgentTasks'] = [];
  let overdueRiskCount = 0;
  const now = new Date().getTime();

  for (const task of currentTasks) {
    let newTaskDateStr = task.dueDate;
    if (daysShift !== 0 && task.status !== 'completed') {
      const taskOldTime = new Date(task.dueDate + 'T00:00:00').getTime();
      // Shift task earlier by proportionate or absolute days
      const shiftedTaskTime = taskOldTime - daysShift * (24 * 60 * 60 * 1000);
      const shiftedDate = new Date(shiftedTaskTime);
      newTaskDateStr = shiftedDate.toISOString().split('T')[0];

      // Check if newly urgent (within 7 days or past today)
      const diffToNow = shiftedTaskTime - now;
      const daysToNewDue = Math.ceil(diffToNow / (1000 * 60 * 60 * 24));

      if (daysToNewDue <= 7 && daysToNewDue >= 0) {
        urgentTasks.push({
          id: task.id,
          title: task.title,
          oldDue: task.dueDate,
          newDue: newTaskDateStr,
          priority: task.priority,
        });
      } else if (daysToNewDue < 0) {
        overdueRiskCount++;
        urgentTasks.push({
          id: task.id,
          title: task.title,
          oldDue: task.dueDate,
          newDue: newTaskDateStr,
          priority: 'critical' as PriorityLevel,
        });
      }
    }

    adjustedTasks.push({
      ...task,
      dueDate: newTaskDateStr,
      status:
        task.status === 'completed'
          ? 'completed'
          : new Date(newTaskDateStr + 'T00:00:00').getTime() < now
          ? 'overdue'
          : task.status,
    });
  }

  // 5. Guest & Catering Feasibility
  const estPlateCost = currentEvent.totalBudget > 0 ? Math.round(260000 / currentEvent.expectedGuests) : 1200;
  const cateringCostDelta = guestDelta * estPlateCost;
  const venueCapacityAdequate = newGuests <= 220; // Wedding hall threshold in demo

  // 6. Vendor Impact
  const impactedCategories: string[] = [];
  const actionItems: string[] = [];

  if (daysShift > 0) {
    actionItems.push(`Immediately confirm availability with Venue & Catering for the advanced date (${newDateStr})`);
    actionItems.push('Re-send date change notice to Photographer and DJ');
    impactedCategories.push('Venue', 'Catering', 'Photography');
  }
  if (guestDelta > 0) {
    actionItems.push(`Request updated quote from caterer for ${newGuests} plates instead of ${currentEvent.expectedGuests}`);
    actionItems.push(`Verify venue seating arrangement and fire safety capacity for ${newGuests} guests`);
    impactedCategories.push('Catering', 'Venue', 'Decoration');
  }
  if (budgetDelta < 0) {
    actionItems.push(`Negotiate floral package to seasonal local blooms to save ~₹25,000`);
    actionItems.push(`Review stage lighting options with decorator`);
    impactedCategories.push('Decoration', 'Entertainment');
  }

  // 7. Recommended Alternatives
  const recommendedAlternatives: string[] = [
    guestDelta > 0
      ? `Buffet style dinner arrangement with live pasta/chaat counters rather than full plated service to manage ${newGuests} guests efficiently.`
      : 'Maintain multi-course banquet setup.',
    budgetDelta < 0
      ? 'Replace heavy imported florals with local marigold & tuberose architectural installations with fairy light backdrops.'
      : 'Upgrade to premium floral archways.',
    daysShift > 0
      ? 'Digital interactive RSVP cards with instant WhatsApp/SMS reminders to expedite headcount confirmation 3 weeks sooner.'
      : 'Standard physical invitation timeline.',
  ];

  // 8. Unchanged Information
  const unchangedSummary: string[] = [
    `Core ceremony traditions: ${currentEvent.preferences.cultural || 'Traditional rituals & family ceremonies'}`,
    `Photography core priority: ${currentEvent.preferences.photography || 'Candid moments & family portraits'} preserved`,
    `Confirmed guest dietary preferences: ${currentEvent.dietaryPreferences.join(', ') || 'Standard veg / non-veg options'}`,
    `Event location: ${currentEvent.location}`,
  ];

  const report: AdaptiveImpactReport = {
    changesDetected,
    budgetImpact: {
      oldTotal: currentEvent.totalBudget,
      newTotal: newBudget,
      difference: budgetDelta,
      reallocatedCategories,
      feasibilityScore: budgetDelta < -150000 && guestDelta > 50 ? 'critical' : budgetDelta < 0 ? 'tight' : 'healthy',
    },
    timelineImpact: {
      daysShift,
      urgentTasks,
      overdueRiskCount,
      compressedWeeks: Math.max(1, Math.round(daysShift / 7)),
    },
    guestAndCateringImpact: {
      guestDelta,
      estimatedCateringCostDelta: cateringCostDelta,
      venueCapacityAdequate,
      recommendation:
        guestDelta > 0
          ? `With ${guestDelta} more guests (+${Math.round((guestDelta / currentEvent.expectedGuests) * 100)}%), verify table configurations (25 tables of 10 instead of 20). Streamline hors d'oeuvres to 4 varieties to keep per-plate costs within budget.`
          : 'Current catering configuration remains optimal.',
    },
    vendorImpact: {
      impactedCategories: Array.from(new Set(impactedCategories)),
      actionItems,
    },
    recommendedAlternatives,
    unchangedSummary,
  };

  return {
    report,
    adjustedBudgets,
    adjustedTasks,
  };
}
