import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { simulatePlanImpact } from '../../services/adaptivePlanningService';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface AdaptivePlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdaptivePlanningModal: React.FC<AdaptivePlanningModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    getCurrentEvent,
    getCurrentBudgets,
    getCurrentTasks,
    getCurrentVendors,
    updateEvent,
    setBudgetCategories,
    setTasks,
    savePlanVersion,
    currency,
  } = useAppStore();

  const currentEvent = getCurrentEvent();
  const currentBudgets = getCurrentBudgets();
  const currentTasks = getCurrentTasks();
  const currentVendors = getCurrentVendors();

  // Form inputs for what to change (declared unconditionally at top level)
  const [newBudget, setNewBudget] = useState<number>(currentEvent?.totalBudget ?? 800000);
  const [newGuests, setNewGuests] = useState<number>(currentEvent?.expectedGuests ?? 200);
  const [newDate, setNewDate] = useState<string>(currentEvent?.date ?? '2026-11-28');
  const [reason, setReason] = useState<string>('Client requirements modification');

  // Preview / Simulation state
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Sync state whenever currentEvent changes or modal opens
  useEffect(() => {
    if (currentEvent && isOpen) {
      setNewBudget(currentEvent.totalBudget);
      setNewGuests(currentEvent.expectedGuests);
      setNewDate(currentEvent.date);
      setReason('Client requirements modification');
      setHasSimulated(false);
      setAppliedSuccess(false);
    }
  }, [currentEvent?.id, currentEvent?.totalBudget, currentEvent?.expectedGuests, currentEvent?.date, isOpen]);

  if (!isOpen || !currentEvent) return null;

  // Pre-load Challenge 5 scenario
  const handleLoadDemoScenario = () => {
    // Current event date minus 14 days (2 weeks earlier)
    const oldDate = new Date(currentEvent.date + 'T00:00:00');
    const earlierDate = new Date(oldDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dateStr = earlierDate.toISOString().split('T')[0];

    setNewBudget(700000);
    setNewGuests(250);
    setNewDate(dateStr);
    setReason('Budget decreased to ₹7L, 250 guests expected, date advanced by 2 weeks (Challenge 5 scenario)');
    setHasSimulated(true);
  };

  const simulation = simulatePlanImpact(
    currentEvent,
    currentBudgets,
    currentTasks,
    currentVendors,
    {
      newBudget,
      newGuestCount: newGuests,
      newDate,
    }
  );

  const { report, adjustedBudgets, adjustedTasks } = simulation;

  const handleApplyChanges = () => {
    // 1. Update event details
    updateEvent(currentEvent.id, {
      totalBudget: newBudget,
      expectedGuests: newGuests,
      date: newDate,
    });

    // 2. Update budgets
    setBudgetCategories(currentEvent.id, adjustedBudgets);

    // 3. Update tasks with shifted dates
    setTasks(currentEvent.id, adjustedTasks);

    // 4. Save audit version
    const changes = report.changesDetected.map((c) => ({
      field: c.field,
      oldValue: c.from,
      newValue: c.to,
      impactDescription: `Adjusted to ${c.to} (${c.difference})`,
    }));

    savePlanVersion(currentEvent.id, {
      reason,
      changes,
      totalBudget: newBudget,
      allocatedBudget: newBudget,
      expectedGuests: newGuests,
      eventDate: newDate,
      notes: `Adaptive replanning executed with ${report.timelineImpact.urgentTasks.length} rescheduled tasks and rebalanced catering allocations.`,
    });

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if unavailable
    }

    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5 sm:gap-2 truncate">
                <span className="truncate">Adaptive Re-Planning Engine</span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded uppercase">
                  Connected
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Simulate ripples across budget, tasks, and catering.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4 sm:space-y-6">
          {/* Quick Scenario Preset */}
          <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Preset Demonstration Scenario (Challenge 5)</span>
              </div>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/70 mt-0.5">
                "Budget decreased to ₹7,00,000, 250 guests expected, date moved 2 weeks earlier."
              </p>
            </div>
            <button
              onClick={handleLoadDemoScenario}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shrink-0 transition-colors shadow-2xs"
            >
              Load Challenge 5 Scenario
            </button>
          </div>

          {/* Input Modification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Budget ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  value={newBudget}
                  onChange={(e) => {
                    setNewBudget(Number(e.target.value));
                    setHasSimulated(true);
                  }}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Current: <span className="font-mono">{formatCurrency(currentEvent.totalBudget, currency)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Guests
              </label>
              <input
                type="number"
                step="5"
                value={newGuests}
                onChange={(e) => {
                  setNewGuests(Number(e.target.value));
                  setHasSimulated(true);
                }}
                className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Current: <span className="font-mono">{currentEvent.expectedGuests} attendees</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setHasSimulated(true);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-[11px] text-slate-500 mt-1">
                Current: {formatDate(currentEvent.date)}
              </div>
            </div>
          </div>

          {/* SIMULATED IMPACT REPORT */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Deterministic Impact Analysis
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                  report.budgetImpact.feasibilityScore === 'healthy'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : report.budgetImpact.feasibilityScore === 'tight'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                }`}
              >
                Plan Feasibility: {report.budgetImpact.feasibilityScore}
              </span>
            </div>

            <div className="p-4 space-y-5 text-xs">
              {/* Section A: Changes Detected */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  A. Detected Adjustments
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {report.changesDetected.length === 0 ? (
                    <div className="col-span-3 text-slate-500 italic">No parameters changed yet. Adjust inputs above.</div>
                  ) : (
                    report.changesDetected.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="text-[11px] text-slate-500">{ch.field}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-slate-900 dark:text-white font-mono">
                          <span className="text-slate-400 line-through">
                            {typeof ch.from === 'number' ? formatCurrency(ch.from, currency) : ch.from}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-indigo-600 dark:text-indigo-400">
                            {typeof ch.to === 'number' ? formatCurrency(ch.to, currency) : ch.to}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">{ch.difference}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Section B: Budget Impact & Reallocation */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>B. Budget Rebalancing & Compromises</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-normal">
                    Net Delta: {report.budgetImpact.difference > 0 ? '+' : ''}
                    {formatCurrency(report.budgetImpact.difference, currency)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {report.budgetImpact.reallocatedCategories.map((item, idx) => {
                    const hasChanged = item.delta !== 0;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          hasChanged
                            ? 'bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800'
                            : 'text-slate-500'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {item.category}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.adjustmentReason}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.newAmount, currency)}
                          </div>
                          {hasChanged && (
                            <div
                              className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${
                                item.delta < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                              }`}
                            >
                              {item.delta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              <span>
                                {item.delta > 0 ? '+' : ''}
                                {formatCurrency(item.delta, currency)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Timeline Impact */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>C. Timeline Compression & Urgent Tasks</span>
                  <span className="text-slate-500">
                    {report.timelineImpact.daysShift > 0
                      ? `Compressed by ${report.timelineImpact.daysShift} days (${report.timelineImpact.compressedWeeks} wks)`
                      : 'Date unchanged or extended'}
                  </span>
                </div>
                {report.timelineImpact.urgentTasks.length > 0 ? (
                  <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-2">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{report.timelineImpact.urgentTasks.length} tasks shifted into high-urgency status</span>
                    </div>
                    <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                      {report.timelineImpact.urgentTasks.map((t) => (
                        <li key={t.id} className="flex items-center justify-between">
                          <span className="truncate max-w-[280px] sm:max-w-md">• {t.title}</span>
                          <span className="font-mono text-[11px] shrink-0 text-amber-700 dark:text-amber-400">
                            Old: {formatDate(t.oldDue)} → <strong className="text-amber-900 dark:text-amber-200">{formatDate(t.newDue)}</strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-slate-500">No overdue risks detected for this timeline.</div>
                )}
              </div>

              {/* Section D: Guest and Catering Impact */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  D. Guest & Catering Feasibility
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {report.guestAndCateringImpact.recommendation}
                  {!report.guestAndCateringImpact.venueCapacityAdequate && (
                    <div className="text-red-600 dark:text-red-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warning: 250 guests approaches the Royal Orchid max capacity. Confirm floor plan immediately.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section E & F: Vendor Action Items & Recommendations */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    E. Immediate Vendor Actions
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {report.vendorImpact.actionItems.map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    F. Smart Recommendations
                  </div>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    {report.recommendedAlternatives.map((alt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                        <span>{alt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section G: Unchanged Decisions Preserved */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  G. User Decisions Preserved (No Data Loss)
                </div>
                <div className="text-slate-500 text-xs flex flex-wrap gap-x-4 gap-y-1">
                  {report.unchangedSummary.map((u, i) => (
                    <span key={i} className="inline-flex items-center gap-1">
                      <span className="text-emerald-500">✓</span> {u}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Revision Log Notes (Saved to Plan History)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Budget decreased, extra family guests added, date moved earlier"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyChanges}
              disabled={appliedSuccess}
              className={`px-5 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-sm flex items-center gap-2 ${
                appliedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
              }`}
            >
              {appliedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Plan Successfully Revised!</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Apply & Save New Plan Version</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
