import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Wallet,
  Clock,
  Users,
  Building2,
  SlidersHorizontal,
  Bot,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  History,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/formatters';

interface EventOverviewPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const EventOverviewPage: React.FC<EventOverviewPageProps> = ({ onOpenAdaptiveModal }) => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();

  const {
    getCurrentEvent,
    getCurrentBudgets,
    getCurrentTasks,
    getCurrentVendors,
    getCurrentGuests,
    getCurrentIdeas,
    getCurrentPlanVersions,
    currency,
  } = useAppStore();

  const event = getCurrentEvent();
  const budgets = getCurrentBudgets();
  const tasks = getCurrentTasks();
  const vendors = getCurrentVendors();
  const guests = getCurrentGuests();
  const ideas = getCurrentIdeas();
  const planVersions = getCurrentPlanVersions();

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Event not found.</p>
        <button
          onClick={() => navigate('/app/dashboard')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const countdown = getDaysRemaining(event.date);

  // Financial calculations
  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalActual = budgets.reduce((acc, b) => acc + b.actual, 0);
  const remainingBudget = Math.max(0, event.totalBudget - totalActual);
  const budgetUtilization = event.totalBudget > 0 ? Math.round((totalActual / event.totalBudget) * 100) : 0;

  // Task stats
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  // Vendor stats
  const confirmedVendors = vendors.filter((v) => v.bookingStatus === 'confirmed');

  // Guest RSVP stats
  const confirmedGuests = guests.filter((g) => g.rsvpStatus === 'confirmed');
  const expectedAttendance = confirmedGuests.reduce((sum, g) => sum + 1 + g.accompanyingGuests, 0);

  return (
    <div className="space-y-8">
      {/* 1. HERO EVENT BANNER */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {event.category}
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {event.location}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {event.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {event.occasionDescription || 'Coordinated planning space with connected budget, timeline, and vendors.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{formatDate(event.date)}</span>
                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-1 text-slate-600 dark:text-slate-300">
                  {countdown.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{event.expectedGuests} Guests</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{formatCurrency(event.totalBudget, event.currency)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            {onOpenAdaptiveModal && (
              <button
                onClick={onOpenAdaptiveModal}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-2xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Adaptive Re-plan</span>
              </button>
            )}

            <button
              onClick={() => navigate(`/app/events/${event.id}/assistant`)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-indigo-500" />
              <span>Ask AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 font-medium">Overall Planning Completion</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {event.completionPercentage}% Complete
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${event.completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Budget */}
        <div
          onClick={() => navigate(`/app/events/${event.id}/budget`)}
          className="p-3.5 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="truncate">Budget</span>
            <Wallet className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(totalAllocated, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">Spent: {formatCurrency(totalActual, event.currency)}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">Manage →</span>
          </div>
        </div>

        {/* Tasks */}
        <div
          onClick={() => navigate(`/app/events/${event.id}/timeline`)}
          className="p-3.5 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="truncate">Milestones</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {pendingTasks.length} <span className="text-xs font-normal text-slate-400 font-sans">pending</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">{completedTasks.length} done</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">Timeline →</span>
          </div>
        </div>

        {/* Vendors */}
        <div
          onClick={() => navigate(`/app/events/${event.id}/vendors`)}
          className="p-3.5 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="truncate">Vendors</span>
            <Building2 className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {confirmedVendors.length} <span className="text-xs font-normal text-slate-400 font-sans">/ {vendors.length}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">{vendors.length} quotes</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">Compare →</span>
          </div>
        </div>

        {/* Guests */}
        <div
          onClick={() => navigate(`/app/events/${event.id}/guests`)}
          className="p-3.5 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="truncate">Guests</span>
            <Users className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
          </div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {confirmedGuests.length} <span className="text-xs font-normal text-slate-400 font-sans">parties</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="truncate">~{expectedAttendance} pax</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold hidden sm:inline">Guests →</span>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN SPLIT: IMMEDIATE MILESTONES & RECENT PLAN VERSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Tasks (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Critical Next Tasks
              </h3>
              <p className="text-xs text-slate-500">Dependent milestones needing confirmation</p>
            </div>
            <button
              onClick={() => navigate(`/app/events/${event.id}/timeline`)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              All Tasks
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.slice(0, 4).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Category: {t.category} · Due {formatDate(t.dueDate)}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${
                    t.priority === 'critical'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : t.priority === 'high'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan History & Versions (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Plan Versions & Revisions
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {planVersions.length} versions
            </span>
          </div>

          <div className="space-y-3">
            {planVersions.map((ver, idx) => (
              <div
                key={ver.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {ver.versionNumber}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {formatDate(ver.timestamp.split('T')[0])}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium mt-1">
                  {ver.reason}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                  Budget: {formatCurrency(ver.totalBudget, event.currency)} · Guests: {ver.expectedGuests}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. PERSONALIZED IDEAS PREVIEW STRIP */}
      <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Recommended Celebration Ideas for Your Vision</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tailored to your {event.category} preferences: {event.preferences.atmosphere}
            </p>
          </div>
          <button
            onClick={() => navigate(`/app/events/${event.id}/ideas`)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Explore All Ideas →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ideas.slice(0, 2).map((idea) => (
            <div
              key={idea.id}
              className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white mb-1">
                  <span>{idea.title}</span>
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                    {idea.estimatedBudgetRange}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {idea.description}
                </p>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                  Why it matches: {idea.matchReason}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
