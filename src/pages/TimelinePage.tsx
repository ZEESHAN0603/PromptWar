import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
  PartyPopper,
  SlidersHorizontal,
  RefreshCw,
  GitBranch,
  MapPin,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TaskItem, PriorityLevel, TaskStatus, TimelineActivityItem } from '../types';
import { formatDate, getDaysRemaining, calculateCompletion } from '../utils/formatters';

interface TimelinePageProps {
  onOpenAdaptiveModal?: () => void;
}

export const TimelinePage: React.FC<TimelinePageProps> = ({ onOpenAdaptiveModal }) => {
  const { eventId: routeEventId } = useParams<{ eventId: string }>();
  const {
    events,
    currentEventId,
    selectEvent,
    getCurrentEvent,
    getCurrentTasks,
    getCurrentTimeline,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addTimelineItem,
    updateTimelineItem,
    deleteTimelineItem,
    planningLoading,
    planningError,
    fetchEventPlanningData,
  } = useAppStore();

  const targetEventId = routeEventId || currentEventId;
  const event = events.find((e) => e.id === targetEventId) || getCurrentEvent();
  const tasks = getCurrentTasks();
  const timelineActivities = getCurrentTimeline();

  useEffect(() => {
    if (routeEventId) {
      if (routeEventId !== currentEventId) {
        selectEvent(routeEventId);
      }
      if (routeEventId.startsWith('evt-')) {
        useAppStore.setState({ planningError: null });
      }
    }
  }, [routeEventId, currentEventId, selectEvent]);

  useEffect(() => {
    if (event?.id) {
      fetchEventPlanningData(event.id);
    }
  }, [event?.id]);

  // Main Page Section: Planning Tasks vs. Day-of Run-of-Show
  const [mainTab, setMainTab] = useState<'tasks' | 'day_of_timeline'>('tasks');

  // Tasks View Mode: Step-by-Step Timeline or Monthly Calendar
  const [activeView, setActiveView] = useState<'timeline' | 'calendar'>('timeline');

  // Filters for tasks
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Add Task Modal State
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Venue');
  const [newDueDate, setNewDueDate] = useState(event ? event.date : '');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('high');
  const [newDescription, setNewDescription] = useState('');

  // Edit Task State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Add Day-of Activity Modal State
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActStart, setNewActStart] = useState('09:00');
  const [newActEnd, setNewActEnd] = useState('11:00');
  const [newActLocation, setNewActLocation] = useState('');
  const [newActCategory, setNewActCategory] = useState('Ceremony');
  const [newActDesc, setNewActDesc] = useState('');

  // Edit Activity State
  const [editingActivity, setEditingActivity] = useState<TimelineActivityItem | null>(null);

  // Calendar View State
  const initialDate = event ? new Date(event.date + 'T00:00:00') : new Date();
  const [calendarYear, setCalendarYear] = useState<number>(initialDate.getFullYear() || 2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(event ? event.date : '');

  if (!event) {
    return (
      <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <Clock className="w-8 h-8 text-slate-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Celebration Not Found
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          We could not locate this celebration. Please select an existing celebration from the sidebar or return to your dashboard.
        </p>
        <Link
          to="/app/dashboard"
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-block"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'todo') matchesStatus = t.status !== 'completed';
    if (statusFilter === 'completed') matchesStatus = t.status === 'completed';

    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate progress summary
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = calculateCompletion(tasks);
  const daysUntilEvent = getDaysRemaining(event.date);

  // Group tasks chronologically
  const groupedTimeline = useMemo(() => {
    const sorted = [...filteredTasks].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    const now = new Date().setHours(0, 0, 0, 0);

    const stages = [
      {
        id: 'upcoming_soon',
        title: '🎯 Immediate Focus (Next 30 Days)',
        description: 'Key items to lock in right now',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
        tasks: sorted.filter((t) => {
          if (t.status === 'completed') return false;
          const dueTime = new Date(t.dueDate + 'T00:00:00').getTime();
          const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        }),
      },
      {
        id: 'upcoming_later',
        title: '📅 Planning Ahead (Upcoming Milestones)',
        description: 'Items scheduled for later in your timeline',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
        tasks: sorted.filter((t) => {
          if (t.status === 'completed') return false;
          const dueTime = new Date(t.dueDate + 'T00:00:00').getTime();
          const diffDays = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));
          return diffDays > 30;
        }),
      },
      {
        id: 'completed_milestones',
        title: '✨ Completed Milestones',
        description: 'Tasks you have already taken care of',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        tasks: sorted.filter((t) => t.status === 'completed'),
      },
    ];

    return stages.filter((stage) => stage.tasks.length > 0);
  }, [filteredTasks]);

  // Handle milestone completion with friendly celebration
  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const wasCompleted = task?.status === 'completed';

    toggleTaskComplete(event.id, taskId);

    if (!wasCompleted) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
  };

  // Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask(event.id, {
      title: newTitle.trim(),
      category: newCategory,
      dueDate: newDueDate || event.date,
      priority: newPriority,
      status: 'pending',
      description: newDescription.trim(),
      dependencies: [],
    });

    setNewTitle('');
    setNewDescription('');
    setIsAdding(false);
  };

  // Save Edit Task
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTask(event.id, editingTask.id, {
      title: editingTask.title,
      category: editingTask.category,
      dueDate: editingTask.dueDate,
      priority: editingTask.priority,
      status: editingTask.status,
      description: editingTask.description,
    });

    setEditingTask(null);
  };

  // Create Day-of Activity
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActTitle.trim()) return;

    const baseDate = event.date.split('T')[0];
    const startTimeISO = new Date(`${baseDate}T${newActStart}:00`).toISOString();
    const endTimeISO = newActEnd ? new Date(`${baseDate}T${newActEnd}:00`).toISOString() : null;

    addTimelineItem(event.id, {
      title: newActTitle.trim(),
      startTime: startTimeISO,
      endTime: endTimeISO,
      location: newActLocation.trim() || undefined,
      category: newActCategory,
      description: newActDesc.trim() || undefined,
      status: 'scheduled',
    });

    setNewActTitle('');
    setNewActLocation('');
    setNewActDesc('');
    setIsAddingActivity(false);
  };

  // Calendar Calculations
  const calendarData = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ dayNumber: null, dateStr: null, isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ dayNumber: day, dateStr, isCurrentMonth: true });
    }

    return { monthName, days };
  }, [calendarYear, calendarMonth]);

  const tasksOnSelectedCalendarDate = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return tasks.filter((t) => t.dueDate === selectedCalendarDate);
  }, [tasks, selectedCalendarDate]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. FRIENDLY EVENT BANNER & PROGRESS SUMMARY */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-100 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
              <PartyPopper className="w-3.5 h-3.5" />
              <span>{daysUntilEvent.label}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1.5">
              Event Checklist & Day Timeline
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage preparation milestones, task dependencies, and the run-of-show for <strong className="text-slate-700 dark:text-slate-300">{formatDate(event.date)}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchEventPlanningData(event.id)}
              disabled={planningLoading}
              className="p-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
              title="Refresh Tasks & Timeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${planningLoading ? 'animate-spin' : ''}`} />
            </button>

            {onOpenAdaptiveModal && (
              <button
                onClick={onOpenAdaptiveModal}
                className="px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                <span>Adjust Schedule</span>
              </button>
            )}

            <button
              onClick={() => {
                if (mainTab === 'tasks') setIsAdding(true);
                else setIsAddingActivity(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{mainTab === 'tasks' ? 'Add Checklist Item' : 'Add Day-Of Activity'}</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{completionPercentage}% of preparations completed</span>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {completedTasks} completed • {pendingTasks} remaining
            </span>
          </div>
          <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {event.id === 'evt-wedding-01' && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Sample Celebration Template:</strong> You are viewing preview timeline and checklist data. Create your live celebration to persist milestones and tasks to your Supabase PostgreSQL database.
            </span>
          </div>
          <Link
            to="/app/events/new"
            className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shrink-0"
          >
            Create Event
          </Link>
        </div>
      )}

      {/* DATABASE SYNC NOTICE */}
      {planningError && event?.id && !event.id.startsWith('evt-') && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Database Sync Notice:</strong>{' '}
              {planningError === 'Authorization header is required'
                ? 'Authentication session required. Please sign in to sync with your cloud database.'
                : planningError}
            </span>
          </div>
          {planningError === 'Authorization header is required' && (
            <Link
              to="/login"
              className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shrink-0"
            >
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* 2. MAIN NAVIGATION TABS: PLANNING TASKS VS RUN-OF-SHOW */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setMainTab('tasks')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
            mainTab === 'tasks'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Preparation Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setMainTab('day_of_timeline')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
            mainTab === 'day_of_timeline'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Day-Of Event Timeline ({timelineActivities.length})</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: PREPARATION TASKS */}
      {mainTab === 'tasks' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <button
                onClick={() => setActiveView('timeline')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeView === 'timeline'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Step-by-Step Timeline</span>
              </button>

              <button
                onClick={() => setActiveView('calendar')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeView === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Monthly Calendar</span>
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1 sm:max-w-md sm:ml-auto">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('todo')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'todo'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  To Do
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Done
                </button>
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                <option value="Venue">Venue</option>
                <option value="Catering">Catering</option>
                <option value="Decoration">Decoration</option>
                <option value="Photography">Photography</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Guests">Guests</option>
                <option value="Coordination">Coordination</option>
              </select>
            </div>
          </div>

          {/* Add Task Modal */}
          {isAdding && (
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Add a New Milestone</span>
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    What needs to be done? *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Finalize photography contract"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Venue">Venue</option>
                    <option value="Catering">Catering</option>
                    <option value="Decoration">Decoration</option>
                    <option value="Photography">Photography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Guests">Guests & Invitations</option>
                    <option value="Coordination">Coordination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="critical">Critical (Must do early)</option>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low / Nice to have</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes or Reminders
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor contacts or requirements"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Save Milestone
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Task Modal */}
          {editingTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-indigo-500" />
                    <span>Edit Milestone</span>
                  </h3>
                  <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editingTask.category}
                        onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Venue">Venue</option>
                        <option value="Catering">Catering</option>
                        <option value="Decoration">Decoration</option>
                        <option value="Photography">Photography</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Guests">Guests</option>
                        <option value="Coordination">Coordination</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      rows={3}
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View A: Step-by-Step Chronological Journey */}
          {activeView === 'timeline' && (
            <div className="space-y-6">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  No milestones match your search. Click "Add Checklist Item" to create one.
                </div>
              ) : (
                groupedTimeline.map((stage) => (
                  <div key={stage.id} className="space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {stage.title}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stage.badgeColor}`}>
                          {stage.tasks.length} item{stage.tasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        {stage.description}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {stage.tasks.map((task) => {
                        const isCompleted = task.status === 'completed';
                        const countdown = getDaysRemaining(task.dueDate);

                        return (
                          <div
                            key={task.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isCompleted
                                ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                                : task.priority === 'critical'
                                ? 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-800/80 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <button
                                onClick={() => handleToggleTask(task.id)}
                                title={isCompleted ? 'Click to mark as incomplete' : 'Click to mark as completed'}
                                className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-slate-800'
                                }`}
                              >
                                {isCompleted && <Check className="w-4 h-4 stroke-[2.5]" />}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`text-xs sm:text-sm font-bold ${
                                      isCompleted
                                        ? 'line-through text-slate-400 dark:text-slate-500'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {task.title}
                                  </span>

                                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                    {task.category}
                                  </span>

                                  {task.dependencies && task.dependencies.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded">
                                      <GitBranch className="w-3 h-3" />
                                      <span>{task.dependencies.length} prerequisite{task.dependencies.length > 1 ? 's' : ''}</span>
                                    </span>
                                  )}

                                  {task.priority === 'critical' && !isCompleted && (
                                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                                      Important
                                    </span>
                                  )}
                                </div>

                                {task.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                              <div className="text-right">
                                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {formatDate(task.dueDate)}
                                </div>
                                <div
                                  className={`text-[10px] font-mono ${
                                    isCompleted
                                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                      : countdown.isOverdue
                                      ? 'text-red-500 font-bold'
                                      : countdown.days <= 7
                                      ? 'text-amber-500 font-semibold'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isCompleted ? 'Completed ✓' : countdown.label}
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Edit milestone"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete milestone "${task.title}"?`)) {
                                      deleteTask(event.id, task.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                  title="Delete milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* View B: Monthly Calendar View */}
          {activeView === 'calendar' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {calendarData.monthName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear((y) => y - 1);
                        } else {
                          setCalendarMonth((m) => m - 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const today = new Date();
                        setCalendarYear(today.getFullYear());
                        setCalendarMonth(today.getMonth());
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      Current Month
                    </button>

                    <button
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear((y) => y + 1);
                        } else {
                          setCalendarMonth((m) => m + 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 dark:text-slate-500 uppercase py-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {calendarData.days.map((item, idx) => {
                    if (!item.isCurrentMonth || !item.dateStr) {
                      return (
                        <div
                          key={`empty-${idx}`}
                          className="min-h-[70px] sm:min-h-[85px] rounded-lg bg-slate-50/40 dark:bg-slate-900/40 border border-transparent opacity-30"
                        />
                      );
                    }

                    const dayTasks = tasks.filter((t) => t.dueDate === item.dateStr);
                    const isEventDay = item.dateStr === event.date;
                    const isSelected = item.dateStr === selectedCalendarDate;

                    return (
                      <div
                        key={item.dateStr}
                        onClick={() => setSelectedCalendarDate(item.dateStr)}
                        className={`min-h-[70px] sm:min-h-[85px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                            : isEventDay
                            ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold font-mono ${
                              isEventDay
                                ? 'text-amber-600 dark:text-amber-400'
                                : isSelected
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {item.dayNumber}
                          </span>

                          {isEventDay && (
                            <span className="text-[9px] font-bold uppercase px-1 rounded bg-amber-400 text-slate-900">
                              Big Day!
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mt-1 overflow-hidden">
                          {dayTasks.slice(0, 2).map((t) => (
                            <div
                              key={t.id}
                              className={`text-[9px] truncate px-1 py-0.5 rounded font-medium ${
                                t.status === 'completed'
                                  ? 'line-through bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                              }`}
                            >
                              {t.title}
                            </div>
                          ))}
                          {dayTasks.length > 2 && (
                            <span className="text-[9px] font-mono text-slate-400">
                              +{dayTasks.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB CONTENT: DAY-OF TIMELINE / RUN-OF-SHOW */}
      {mainTab === 'day_of_timeline' && (
        <div className="space-y-4">
          {/* Add Activity Modal */}
          {isAddingActivity && (
            <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Add Run-of-Show Activity</span>
                </h3>
                <button onClick={() => setIsAddingActivity(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateActivity} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Activity Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wedding Ceremony & Exchange of Vows"
                    value={newActTitle}
                    onChange={(e) => setNewActTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newActCategory}
                    onChange={(e) => setNewActCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Ceremony">Ceremony</option>
                    <option value="Catering">Catering / Dining</option>
                    <option value="Decoration">Decoration & Setup</option>
                    <option value="Photography">Photography</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={newActStart}
                    onChange={(e) => setNewActStart(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newActEnd}
                    onChange={(e) => setNewActEnd(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Hall
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mandap Pavilion"
                    value={newActLocation}
                    onChange={(e) => setNewActLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description or Coordination Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pandit arrives 15 mins prior; mic setup verified"
                    value={newActDesc}
                    onChange={(e) => setNewActDesc(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingActivity(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Activities List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Chronological Event Schedule
                </h3>
                <p className="text-xs text-slate-500">Scheduled sequence of celebrations on {formatDate(event.date)}</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {timelineActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No day-of activities added yet. Click <strong>Add Day-Of Activity</strong> to establish the ceremony run of show.
                </div>
              ) : (
                timelineActivities.map((act) => {
                  const startFormatted = new Date(act.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const endFormatted = act.endTime ? new Date(act.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                  return (
                    <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="text-center font-mono shrink-0 w-24">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{startFormatted}</div>
                          {endFormatted && <div className="text-[10px] text-slate-400">to {endFormatted}</div>}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{act.title}</h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {act.category || 'Activity'}
                            </span>
                          </div>

                          {act.location && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{act.location}</span>
                            </div>
                          )}

                          {act.description && (
                            <p className="text-[11px] text-slate-500 mt-1">{act.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete activity "${act.title}"?`)) {
                              deleteTimelineItem(event.id, act.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
