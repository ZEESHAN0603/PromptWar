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
  ShieldCheck,
  History,
  GitCompare,
  ChevronRight,
  RefreshCw,
  Check,
  FileText,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  BackendReplanProposal,
  BackendPlanVersion,
  VersionComparisonResult,
} from '../../types';

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
    getCurrentExpenses,
    getCurrentTasks,
    currency,
    createReplanProposal,
    applyReplanProposal,
    rejectReplanProposal,
    fetchPlanVersions,
    comparePlanVersions,
    isAnalyzingReplan,
    isApplyingReplan,
    serverPlanVersions,
  } = useAppStore();

  const currentEvent = getCurrentEvent();
  const currentBudgets = getCurrentBudgets();
  const currentExpenses = getCurrentExpenses();
  const currentTasks = getCurrentTasks();

  // Active top-level tab: 'replan' | 'history'
  const [activeTab, setActiveTab] = useState<'replan' | 'history'>('replan');

  // Change dimension selection toggles
  const [modifyBudget, setModifyBudget] = useState(true);
  const [modifyGuests, setModifyGuests] = useState(true);
  const [modifyDate, setModifyDate] = useState(false);

  // Form inputs
  const [proposedBudget, setProposedBudget] = useState<number>(currentEvent?.totalBudget ?? 800000);
  const [proposedGuests, setProposedGuests] = useState<number>(currentEvent?.expectedGuests ?? 200);
  const [proposedDate, setProposedDate] = useState<string>(currentEvent?.date ?? '2026-12-15');
  const [reason, setReason] = useState<string>('Client celebration requirements modification');

  // Proposal and review state
  const [proposal, setProposal] = useState<BackendReplanProposal | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] = useState<any | null>(null);

  // Selective approval checkboxes
  const [approveBudget, setApproveBudget] = useState(true);
  const [approveGuests, setApproveGuests] = useState(true);
  const [approveDate, setApproveDate] = useState(true);
  const [approvedTasks, setApprovedTasks] = useState<Record<string, boolean>>({});
  const [approvedTimelines, setApprovedTimelines] = useState<Record<string, boolean>>({});

  // Confirmation dialog modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Version history & comparison state
  const [versionList, setVersionList] = useState<BackendPlanVersion[]>([]);
  const [selectedVersionForSnapshot, setSelectedVersionForSnapshot] = useState<BackendPlanVersion | null>(null);
  const [compareFromId, setCompareFromId] = useState<string>('');
  const [compareToId, setCompareToId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<VersionComparisonResult | null>(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Sync state whenever currentEvent changes or modal opens
  useEffect(() => {
    if (currentEvent && isOpen) {
      setProposedBudget(currentEvent.totalBudget);
      setProposedGuests(currentEvent.expectedGuests);
      setProposedDate(currentEvent.date ? currentEvent.date.split('T')[0] : '2026-12-15');
      setReason('Client celebration requirements modification');
      setProposal(null);
      setErrorMsg(null);
      setAppliedResult(null);
      setShowConfirmModal(false);

      // Load server plan versions
      if (currentEvent.id) {
        setIsLoadingVersions(true);
        fetchPlanVersions(currentEvent.id)
          .then((vers) => {
            setVersionList(vers || []);
            if (vers && vers.length >= 2) {
              setCompareFromId(vers[1].id);
              setCompareToId(vers[0].id);
            }
          })
          .finally(() => setIsLoadingVersions(false));
      }
    }
  }, [currentEvent?.id, currentEvent?.totalBudget, currentEvent?.expectedGuests, currentEvent?.date, isOpen]);

  if (!isOpen || !currentEvent) return null;

  // Total recorded actual expenses
  const recordedActualExpenses = currentExpenses.reduce(
    (sum, e) => sum + (e.actualAmount !== null && e.actualAmount !== undefined ? Number(e.actualAmount) : 0),
    0
  );

  // Handle generating re-planning proposal
  const handleAnalyzeImpact = async () => {
    setErrorMsg(null);
    const changesPayload: any = {};

    if (modifyBudget) {
      changesPayload.budget = { proposed: proposedBudget };
    }
    if (modifyGuests) {
      changesPayload.guestCount = { proposed: proposedGuests };
    }
    if (modifyDate) {
      changesPayload.eventDate = { proposed: proposedDate };
    }

    if (Object.keys(changesPayload).length === 0) {
      setErrorMsg('Please select at least one change dimension (Budget, Guests, or Event Date).');
      return;
    }

    try {
      const generated = await createReplanProposal(currentEvent.id, {
        changes: changesPayload,
        reason,
      });

      setProposal(generated);
      setApproveBudget(Boolean(modifyBudget));
      setApproveGuests(Boolean(modifyGuests));
      setApproveDate(Boolean(modifyDate));

      // Initialize task reschedule checkboxes
      const taskCheckMap: Record<string, boolean> = {};
      generated.impactReport?.dateImpact?.taskRescheduleSuggestions?.forEach((t) => {
        taskCheckMap[t.taskId] = true;
      });
      setApprovedTasks(taskCheckMap);

      // Initialize timeline reschedule checkboxes
      const tlCheckMap: Record<string, boolean> = {};
      generated.impactReport?.dateImpact?.timelineConflicts?.forEach((tl) => {
        tlCheckMap[tl.timelineItemId] = true;
      });
      setApprovedTimelines(tlCheckMap);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate re-planning proposal. Please try again.');
    }
  };

  // Handle selective application of approved changes
  const handleConfirmAndApply = async () => {
    if (!proposal) return;

    const taskChangesPayload = (proposal.impactReport?.dateImpact?.taskRescheduleSuggestions || [])
      .filter((t) => approvedTasks[t.taskId] && t.proposedDueDate)
      .map((t) => ({
        taskId: t.taskId,
        proposedDueDate: t.proposedDueDate!,
      }));

    const timelineChangesPayload = (proposal.impactReport?.dateImpact?.timelineConflicts || [])
      .filter((tl) => approvedTimelines[tl.timelineItemId] && tl.suggestedStartTime)
      .map((tl) => ({
        timelineItemId: tl.timelineItemId,
        proposedStartTime: tl.suggestedStartTime,
      }));

    try {
      const result = await applyReplanProposal(currentEvent.id, proposal.proposalId, {
        approvedChanges: {
          budget: approveBudget,
          guestCount: approveGuests,
          eventDate: approveDate,
        },
        approvedTaskChanges: taskChangesPayload,
        approvedTimelineChanges: timelineChangesPayload,
      });

      setAppliedResult(result);
      setShowConfirmModal(false);

      // Confetti celebration
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // Refresh version list
      fetchPlanVersions(currentEvent.id).then((v) => setVersionList(v || []));
    } catch (err: any) {
      setShowConfirmModal(false);
      setErrorMsg(err.message || 'Failed to apply re-planning changes. Please check if the event was modified.');
    }
  };

  // Handle reject proposal
  const handleRejectProposal = async () => {
    if (!proposal) return;
    try {
      await rejectReplanProposal(currentEvent.id, proposal.proposalId);
      setProposal(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject proposal.');
    }
  };

  // Handle version comparison
  const handleRunComparison = async () => {
    if (!compareFromId || !compareToId) return;
    try {
      const res = await comparePlanVersions(currentEvent.id, compareFromId, compareToId);
      setComparisonResult(res);
    } catch (err: any) {
      setErrorMsg('Failed to compare versions: ' + err.message);
    }
  };

  // Demo Challenge 5 preset helper
  const handleLoadDemoScenario = () => {
    const oldDate = new Date(currentEvent.date ? currentEvent.date.split('T')[0] : '2026-12-15');
    const earlierDate = new Date(oldDate.getTime() - 14 * 24 * 60 * 60 * 1000);

    setModifyBudget(true);
    setModifyGuests(true);
    setModifyDate(true);
    setProposedBudget(700000);
    setProposedGuests(250);
    setProposedDate(earlierDate.toISOString().split('T')[0]);
    setReason('Budget adjusted to ₹7,00,000, 250 guests anticipated, celebration date advanced by 2 weeks.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Adaptive Re-Planning Engine
                </h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  Phase 6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Modify celebration requirements and review intelligent, practical trade-offs before applying.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Top Navigation Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
              <button
                onClick={() => setActiveTab('replan')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'replan'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Re-Plan</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Version History</span>
                {versionList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-mono">
                    {versionList.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'replan' ? (
            /* TAB 1: RE-PLAN EVENT WORKFLOW */
            appliedResult ? (
              /* SUCCESS VIEW POST APPLICATION */
              <div className="py-8 text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Celebration Re-Plan Applied Successfully!
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                    Version <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">v{appliedResult.versionNumber}.0</span> has been recorded in immutable history. All approved changes have persisted to Supabase.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-200">Applied Updates Summary:</div>
                  {appliedResult.appliedChanges?.budget && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Total Budget:</span>
                      <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(appliedResult.event?.budget || proposedBudget, currency)}
                      </span>
                    </div>
                  )}
                  {appliedResult.appliedChanges?.guestCount && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Expected Guests:</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {appliedResult.event?.guestCount || proposedGuests} guests
                      </span>
                    </div>
                  )}
                  {appliedResult.appliedChanges?.eventDate && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Celebration Date:</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        {appliedResult.event?.date ? appliedResult.event.date.split('T')[0] : proposedDate}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Actual recorded expenses ({formatCurrency(recordedActualExpenses, currency)}) were strictly preserved.</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-3">
                  <button
                    onClick={() => {
                      setAppliedResult(null);
                      setProposal(null);
                      setActiveTab('history');
                    }}
                    className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View in Version History</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Return to Workspace
                  </button>
                </div>
              </div>
            ) : !proposal ? (
              /* STEP 1 & 2: SELECT DIMENSIONS AND ENTER REQUIREMENTS */
              <div className="space-y-6">
                {/* Demo Scenario Preset Banner */}
                <div className="p-3.5 rounded-xl bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Looking to test the engine? Load the realistic multi-dimensional scenario (-₹1L budget, +50 guests, 2 weeks earlier).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoScenario}
                    className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 shrink-0 transition-colors shadow-2xs"
                  >
                    Load Scenario
                  </button>
                </div>

                {/* Step 1: Dimension Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                    1. Select What Changed
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setModifyBudget(!modifyBudget)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        modifyBudget
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Total Budget</div>
                          <div className="text-[10px] text-slate-500">Current: {formatCurrency(currentEvent.totalBudget, currency)}</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modifyBudget ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {modifyBudget && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModifyGuests(!modifyGuests)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        modifyGuests
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Guest Count</div>
                          <div className="text-[10px] text-slate-500">Current: {currentEvent.expectedGuests} guests</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modifyGuests ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {modifyGuests && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModifyDate(!modifyDate)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        modifyDate
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <div className="text-xs font-bold">Event Date</div>
                          <div className="text-[10px] text-slate-500">Current: {currentEvent.date ? currentEvent.date.split('T')[0] : 'N/A'}</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${modifyDate ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                        {modifyDate && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Step 2: Input Requirements */}
                <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    2. Specify New Target Requirements
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {modifyBudget && (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Proposed Total Budget</span>
                          <span className={`text-[10px] font-mono ${proposedBudget - currentEvent.totalBudget < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {proposedBudget - currentEvent.totalBudget >= 0 ? '+' : ''}
                            {formatCurrency(proposedBudget - currentEvent.totalBudget, currency)}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono">₹</span>
                          <input
                            type="number"
                            value={proposedBudget}
                            onChange={(e) => setProposedBudget(Math.max(0, Number(e.target.value)))}
                            className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Committed actual expenses: {formatCurrency(recordedActualExpenses, currency)} (cannot be cut)
                        </div>
                      </div>
                    )}

                    {modifyGuests && (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Proposed Guest Count</span>
                          <span className={`text-[10px] font-mono ${proposedGuests - currentEvent.expectedGuests > 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
                            {proposedGuests - currentEvent.expectedGuests >= 0 ? '+' : ''}
                            {proposedGuests - currentEvent.expectedGuests} guests
                          </span>
                        </div>
                        <input
                          type="number"
                          value={proposedGuests}
                          onChange={(e) => setProposedGuests(Math.max(0, parseInt(e.target.value, 10) || 0))}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Affects seating layouts, catering headcount & favors
                        </div>
                      </div>
                    )}

                    {modifyDate && (
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          <span>Proposed Celebration Date</span>
                        </div>
                        <input
                          type="date"
                          value={proposedDate}
                          onChange={(e) => setProposedDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="text-[10px] text-slate-400 mt-1">
                          Shifts timeline milestones and compresses deadlines
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Reason for Re-Planning (Optional)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Budget decreased, venue change, family schedule..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isAnalyzingReplan || (!modifyBudget && !modifyGuests && !modifyDate)}
                    onClick={handleAnalyzeImpact}
                    className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-600/20"
                  >
                    {isAnalyzingReplan ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing with Deterministic Engine & Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Analyze Impact & Synthesize Proposal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 3 & 4: BEFORE-AND-AFTER COMPARISON & SELECTIVE APPROVAL */
              <div className="space-y-6">
                {/* Proposal Status Bar */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      proposal.impactReport.summary.overallImpactLevel === 'critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : proposal.impactReport.summary.overallImpactLevel === 'high'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {proposal.impactReport.summary.overallImpactLevel} Impact
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {proposal.impactReport.summary.totalConflicts > 0
                        ? `${proposal.impactReport.summary.totalConflicts} potential conflict(s) detected`
                        : 'All changes within feasible planning tolerances'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProposal(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Adjust Inputs</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectProposal}
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    >
                      Reject Proposal
                    </button>
                  </div>
                </div>

                {/* Stale Warning Banner if applicable */}
                {proposal.isStale && (
                  <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Warning: The celebration was updated after this proposal was generated. Please re-run analysis.</span>
                  </div>
                )}

                {/* 1. Before & After Overview Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Event Overview Comparison
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Field</th>
                          <th className="px-4 py-2.5">Existing Plan</th>
                          <th className="px-4 py-2.5">Proposed Plan</th>
                          <th className="px-4 py-2.5">Difference</th>
                          <th className="px-4 py-2.5 text-right">Approve Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {proposal.proposedChanges.budget && (
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <TrendingDown className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Total Budget</span>
                            </td>
                            <td className="px-4 py-3 font-mono">{formatCurrency(currentEvent.totalBudget, currency)}</td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {formatCurrency(proposal.proposedChanges.budget.proposed, currency)}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {proposal.impactReport.budgetImpact?.budgetDifference !== undefined ? (
                                <span className={proposal.impactReport.budgetImpact.budgetDifference < 0 ? 'text-amber-600' : 'text-emerald-600'}>
                                  {proposal.impactReport.budgetImpact.budgetDifference > 0 ? '+' : ''}
                                  {formatCurrency(proposal.impactReport.budgetImpact.budgetDifference, currency)} ({proposal.impactReport.budgetImpact.percentageChange}%)
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="checkbox"
                                checked={approveBudget}
                                onChange={(e) => setApproveBudget(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        )}

                        {proposal.proposedChanges.guestCount && (
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Expected Guests</span>
                            </td>
                            <td className="px-4 py-3 font-mono">{currentEvent.expectedGuests} guests</td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {proposal.proposedChanges.guestCount.proposed} guests
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {proposal.impactReport.guestImpact?.guestDifference !== undefined ? (
                                <span className={proposal.impactReport.guestImpact.guestDifference > 0 ? 'text-indigo-600' : 'text-slate-500'}>
                                  {proposal.impactReport.guestImpact.guestDifference > 0 ? '+' : ''}
                                  {proposal.impactReport.guestImpact.guestDifference} guests ({proposal.impactReport.guestImpact.percentageChange}%)
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="checkbox"
                                checked={approveGuests}
                                onChange={(e) => setApproveGuests(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        )}

                        {proposal.proposedChanges.eventDate && (
                          <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Celebration Date</span>
                            </td>
                            <td className="px-4 py-3 font-mono">{currentEvent.date ? currentEvent.date.split('T')[0] : 'N/A'}</td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {proposal.proposedChanges.eventDate.proposed.split('T')[0]}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {proposal.impactReport.dateImpact?.daysDifference !== undefined ? (
                                <span>
                                  {Math.abs(proposal.impactReport.dateImpact.daysDifference)} days {proposal.impactReport.dateImpact.daysDifference > 0 ? 'earlier' : 'later'}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="checkbox"
                                checked={approveDate}
                                onChange={(e) => setApproveDate(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Deterministic Financial Facts */}
                {proposal.impactReport.budgetImpact && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deterministic Financial Analysis</span>
                      </h4>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Actual Expenses Preserved ({formatCurrency(proposal.impactReport.budgetImpact.totalActualExpenses, currency)})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500">Proposed Budget</div>
                        <div className="font-bold font-mono mt-0.5">{formatCurrency(proposal.impactReport.budgetImpact.proposedBudget, currency)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500">Recorded Spent</div>
                        <div className="font-bold font-mono mt-0.5">{formatCurrency(proposal.impactReport.budgetImpact.totalActualExpenses, currency)}</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500">Remaining Budget</div>
                        <div className="font-bold font-mono mt-0.5 text-emerald-600">
                          {formatCurrency(proposal.impactReport.budgetImpact.proposedRemainingBudget, currency)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500">Total Allocated</div>
                        <div className="font-bold font-mono mt-0.5">{formatCurrency(proposal.impactReport.budgetImpact.totalAllocated, currency)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Task Rescheduling Recommendations */}
                {proposal.impactReport.dateImpact?.taskRescheduleSuggestions && proposal.impactReport.dateImpact.taskRescheduleSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Task Deadline Adjustments ({proposal.impactReport.dateImpact.taskRescheduleSuggestions.length})
                      </h4>
                      <span className="text-[10px] text-slate-400">Select tasks to automatically shift</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {proposal.impactReport.dateImpact.taskRescheduleSuggestions.map((t) => (
                        <div
                          key={t.taskId}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">{t.title}</div>
                            <div className="text-[10px] text-slate-400">
                              Current: {t.currentDueDate || 'None'} → <span className="font-bold text-indigo-600 dark:text-indigo-400">Proposed: {t.proposedDueDate}</span> ({t.reason})
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(approvedTasks[t.taskId])}
                            onChange={(e) => setApprovedTasks({ ...approvedTasks, [t.taskId]: e.target.checked })}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Gemini AI Strategic Recommendations */}
                {proposal.aiRecommendations && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Gemini AI Strategic Recommendations
                      </h4>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200">
                      {proposal.aiRecommendations.summary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {proposal.aiRecommendations.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {rec.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              rec.priority === 'critical' || rec.priority === 'high'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {rec.priority} priority
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{rec.description}</p>
                          {rec.estimatedImpact && (
                            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Impact: {rec.estimatedImpact}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {proposal.aiRecommendations.alternatives?.length > 0 && (
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Creative Alternatives: </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {proposal.aiRecommendations.alternatives.join(' • ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Selective Approval Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">
                    Review and confirm which changes to commit to the celebration plan.
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProposal(null)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isApplyingReplan || (!approveBudget && !approveGuests && !approveDate)}
                      onClick={() => setShowConfirmModal(true)}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Review & Approve Selected Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* TAB 2: VERSION HISTORY AND COMPARISON */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Celebration Plan Version History
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each applied re-plan preserves an immutable snapshot of previous requirements and allocations.
                  </p>
                </div>
              </div>

              {/* Version Comparison Section */}
              {versionList.length >= 2 && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Compare Two Versions</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={compareFromId}
                      onChange={(e) => setCompareFromId(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {versionList.map((v) => (
                        <option key={v.id} value={v.id}>
                          From: {v.versionLabel} ({new Date(v.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>

                    <span className="text-xs text-slate-400">vs</span>

                    <select
                      value={compareToId}
                      onChange={(e) => setCompareToId(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                    >
                      {versionList.map((v) => (
                        <option key={v.id} value={v.id}>
                          To: {v.versionLabel} ({new Date(v.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleRunComparison}
                      disabled={compareFromId === compareToId}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Compare
                    </button>
                  </div>

                  {comparisonResult && (
                    <div className="mt-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                      <div className="font-semibold text-slate-700 dark:text-slate-200">
                        Differences between {comparisonResult.fromVersion.label} and {comparisonResult.toVersion.label}:
                      </div>
                      {comparisonResult.differences.length === 0 ? (
                        <div className="text-slate-500">No differences found between selected versions.</div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {comparisonResult.differences.map((d, i) => (
                            <div key={i} className="py-1.5 flex justify-between">
                              <span className="font-medium text-slate-600 dark:text-slate-400">{d.field}</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {String(d.fromValue)} → {String(d.toValue)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Version List */}
              {isLoadingVersions ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span>Loading version history...</span>
                </div>
              ) : versionList.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <History className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <span>No previous plan versions recorded yet. Your first approved re-plan will appear here.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {versionList.map((ver) => (
                    <div
                      key={ver.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                            {ver.versionLabel}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(ver.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {ver.changeSummary?.reason || 'Re-planning adjustment'}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedVersionForSnapshot(ver)}
                        className="px-3 py-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Snapshot</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Snapshot Viewer Drawer / Modal */}
        {selectedVersionForSnapshot && (
          <div className="absolute inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white">
                  Snapshot: {selectedVersionForSnapshot.versionLabel}
                </div>
                <button
                  onClick={() => setSelectedVersionForSnapshot(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Event Snapshot Values:</div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 font-mono text-[11px] space-y-1">
                  <div>Budget: {formatCurrency(selectedVersionForSnapshot.snapshot?.event?.budget || 0, currency)}</div>
                  <div>Guests: {selectedVersionForSnapshot.snapshot?.event?.guestCount} guests</div>
                  <div>Date: {selectedVersionForSnapshot.snapshot?.event?.date ? selectedVersionForSnapshot.snapshot.event.date.split('T')[0] : 'N/A'}</div>
                </div>

                <div className="font-semibold text-slate-700 dark:text-slate-300 pt-2">Recorded At:</div>
                <div className="text-slate-500">{new Date(selectedVersionForSnapshot.createdAt).toLocaleString()}</div>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setSelectedVersionForSnapshot(null)}
                  className="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog before applying */}
        {showConfirmModal && (
          <div className="absolute inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Confirm Re-Planning Approval</h4>
                  <p className="text-xs text-slate-500">Explicit user verification</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-semibold text-slate-800 dark:text-slate-200">The following changes will persist:</div>
                {approveBudget && proposal?.proposedChanges.budget && (
                  <div>• Update Total Budget to <span className="font-bold font-mono">{formatCurrency(proposal.proposedChanges.budget.proposed, currency)}</span></div>
                )}
                {approveGuests && proposal?.proposedChanges.guestCount && (
                  <div>• Update Expected Guests to <span className="font-bold font-mono">{proposal.proposedChanges.guestCount.proposed} guests</span></div>
                )}
                {approveDate && proposal?.proposedChanges.eventDate && (
                  <div>• Update Event Date to <span className="font-bold font-mono">{proposal.proposedChanges.eventDate.proposed.split('T')[0]}</span></div>
                )}
                <div>• Create an immutable version history record</div>
                <div className="text-emerald-600 font-semibold pt-1">
                  ✔ All recorded actual expenses remain strictly untouched
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isApplyingReplan}
                  onClick={handleConfirmAndApply}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5"
                >
                  {isApplyingReplan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Confirm & Commit Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
