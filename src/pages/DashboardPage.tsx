import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Wallet,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Edit2,
  Trash2,
  MapPin,
  Sparkles,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowUpDown,
  PartyPopper,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDate, getDaysRemaining } from '../utils/formatters';
import { EventCategory, EventModel } from '../types';

interface DashboardPageProps {
  onOpenAdaptiveModal?: () => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  Wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  Birthday: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
  Anniversary: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
  Engagement: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80',
  'Baby shower': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
  'Corporate event': 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
  'Community gathering': 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=600&q=80',
  Festival: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  Graduation: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80',
  Other: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenAdaptiveModal }) => {
  const navigate = useNavigate();
  const {
    user,
    events,
    currentEventId,
    eventsLoading,
    fetchUserEvents,
    selectEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    budgets,
    tasks,
    currency,
  } = useAppStore();

  // Load events from backend on mount
  useEffect(() => {
    fetchUserEvents();
  }, [fetchUserEvents]);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'created_desc' | 'budget_desc'>('date_asc');

  // Modals state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventModel | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Dynamic Statistics
  const todayStr = new Date().toISOString().split('T')[0];
  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.date >= todayStr && e.status !== 'completed' && e.status !== 'archived').length;
    const inProgress = events.filter((e) => e.status === 'in_progress' || e.status === 'planning').length;
    const completed = events.filter((e) => e.status === 'completed').length;
    const totalBudget = events.reduce((sum, e) => sum + (e.totalBudget || 0), 0);
    const totalGuests = events.reduce((sum, e) => sum + (e.expectedGuests || 0), 0);
    return { total, upcoming, inProgress, completed, totalBudget, totalGuests };
  }, [events, todayStr]);

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        const nameStr = (evt.name || '').toLowerCase();
        const locStr = (evt.location || '').toLowerCase();
        const catStr = (evt.category || '').toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          nameStr.includes(q) ||
          locStr.includes(q) ||
          catStr.includes(q);
        const matchesCategory = categoryFilter === 'All' || evt.category === categoryFilter;
        const matchesStatus =
          statusFilter === 'All' ||
          (statusFilter === 'planning' && evt.status === 'planning') ||
          (statusFilter === 'in_progress' && evt.status === 'in_progress') ||
          (statusFilter === 'completed' && evt.status === 'completed') ||
          (statusFilter === 'archived' && evt.status === 'archived');
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'created_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'budget_desc') return b.totalBudget - a.totalBudget;
        return 0;
      });
  }, [events, searchQuery, categoryFilter, statusFilter, sortBy]);

  const handleDuplicate = (id: string, name: string) => {
    const newId = duplicateEvent(id);
    if (newId) {
      showToast(`Successfully duplicated celebration: "Copy of ${name}"`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingEventId) return;
    const target = events.find((e) => e.id === deletingEventId);
    deleteEvent(deletingEventId);
    setDeletingEventId(null);
    showToast(`Deleted celebration "${target?.name || ''}". Isolated data cleared.`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    updateEvent(editingEvent.id, {
      name: editingEvent.name,
      category: editingEvent.category,
      date: editingEvent.date,
      location: editingEvent.location,
      totalBudget: Number(editingEvent.totalBudget) || 0,
      expectedGuests: Number(editingEvent.expectedGuests) || 0,
      status: editingEvent.status,
      occasionDescription: editingEvent.occasionDescription,
    });
    setEditingEvent(null);
    showToast(`Updated "${editingEvent.name}"`);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-slate-700 dark:border-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. MY CELEBRATIONS HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Celebration Central</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            My Celebrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            All your celebrations, plans and special moments in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate(currentEventId ? `/app/events/${currentEventId}/vendors` : '/app/vendors')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Recommended Vendors</span>
          </button>
          <button
            onClick={() => navigate('/app/events/new')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Celebration</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC STATISTICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Total Celebrations</span>
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active and archived records
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Upcoming Events</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {stats.upcoming}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Occurring in the future
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">In Active Progress</span>
            <TrendingUp className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {stats.inProgress}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Planning & coordination active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-medium">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Successfully concluded
          </div>
        </div>
      </div>

      {/* 3. SEARCH, FILTERS & CONTROLS */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, city, or event type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Engagement">Engagement</option>
              <option value="Corporate event">Corporate</option>
              <option value="Festival">Festival</option>
              <option value="Baby shower">Baby shower</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="date_asc">Date (Earliest First)</option>
              <option value="date_desc">Date (Latest First)</option>
              <option value="created_desc">Recently Created</option>
              <option value="budget_desc">Budget (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. EVENT CARDS GRID */}
      {eventsLoading ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full" />
          <p className="text-xs text-slate-500">Loading your celebrations from Supabase...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No celebrations found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'All' || statusFilter !== 'All'
              ? 'Try resetting your search filters to see all celebrations.'
              : 'Start by creating your first celebration plan with our intelligent wizard.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('All');
              setStatusFilter('All');
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((evt) => {
            const countdown = getDaysRemaining(evt.date);
            const coverImg = CATEGORY_IMAGES[evt.category] || CATEGORY_IMAGES.Other;

            return (
              <div
                key={evt.id}
                className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-indigo-400/80 transition-all group"
              >
                <div>
                  {/* Card Cover Image with Overlays */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={coverImg}
                      alt={evt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-slate-900/70 backdrop-blur-xs px-2.5 py-1 rounded-md border border-white/10">
                        {evt.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md backdrop-blur-xs border ${
                          evt.status === 'completed'
                            ? 'bg-emerald-950/70 text-emerald-200 border-emerald-500/30'
                            : evt.status === 'in_progress'
                            ? 'bg-indigo-950/70 text-indigo-200 border-indigo-500/30'
                            : 'bg-amber-950/70 text-amber-200 border-amber-500/30'
                        }`}
                      >
                        {evt.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1.5 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-white shrink-0">
                        {countdown.label}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        {evt.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                      {evt.occasionDescription || `Celebration scheduled in ${evt.location}.`}
                    </p>

                    {/* Key Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Date</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {formatDate(evt.date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Guests</div>
                        <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {evt.expectedGuests} pax
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-medium">Budget</div>
                        <div className="font-semibold font-mono text-slate-800 dark:text-slate-200 truncate">
                          {formatCurrency(evt.totalBudget, evt.currency)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Milestone Progress</span>
                        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                          {evt.completionPercentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${evt.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 pt-0 sm:p-5 sm:pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-3 pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      selectEvent(evt.id);
                      navigate(`/app/events/${evt.id}/overview`);
                    }}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingEvent(evt)}
                      title="Edit Event"
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(evt.id, evt.name)}
                      title="Duplicate Event"
                      className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEventId(evt.id)}
                      title="Delete Event"
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Celebration Details
                </h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingEvent.name}
                  onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={editingEvent.category}
                    onChange={(e) => setEditingEvent({ ...editingEvent, category: e.target.value as EventCategory })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Baby shower">Baby shower</option>
                    <option value="Corporate event">Corporate event</option>
                    <option value="Festival">Festival</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingEvent.status}
                    onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Budget ({editingEvent.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingEvent.totalBudget}
                    onChange={(e) => setEditingEvent({ ...editingEvent, totalBudget: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingEvent.expectedGuests}
                    onChange={(e) => setEditingEvent({ ...editingEvent, expectedGuests: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={editingEvent.occasionDescription}
                  onChange={(e) => setEditingEvent({ ...editingEvent, occasionDescription: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-full bg-red-50 dark:bg-red-950/50">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete This Celebration?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
              Deleting this celebration will permanently purge isolated budgets, timeline tasks, guest lists, and private vendor selections.
              <br />
              <strong className="text-slate-900 dark:text-white mt-1 block">
                Note: Shared community vendors will remain untouched.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeletingEventId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs"
              >
                Yes, Delete Celebration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
