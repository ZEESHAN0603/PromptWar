import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  Receipt,
  PieChart as PieIcon,
  BarChart3,
  SlidersHorizontal,
  Check,
  X,
  Info,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';
import { BudgetCategoryItem, ExpenseItem } from '../types';

const COLORS = [
  '#4f46e5', // indigo
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#64748b', // slate
];

interface BudgetPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({ onOpenAdaptiveModal }) => {
  const { eventId: routeEventId } = useParams<{ eventId: string }>();
  const {
    currentEventId,
    selectEvent,
    getCurrentEvent,
    getCurrentBudgets,
    getCurrentExpenses,
    getCurrentBudgetSummary,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    addExpense,
    updateExpense,
    deleteExpense,
    planningLoading,
    planningError,
    fetchEventPlanningData,
    currency,
  } = useAppStore();

  const event = getCurrentEvent();
  const budgets = getCurrentBudgets();
  const expenses = getCurrentExpenses();
  const summary = getCurrentBudgetSummary();

  const [activeTab, setActiveTab] = useState<'categories' | 'expenses'>('categories');

  // Sync route event ID if provided
  useEffect(() => {
    if (routeEventId && routeEventId !== currentEventId) {
      selectEvent(routeEventId);
    }
  }, [routeEventId, currentEventId, selectEvent]);

  // Trigger sync on event mount
  useEffect(() => {
    if (event?.id) {
      fetchEventPlanningData(event.id);
    }
  }, [event?.id]);

  // Add Category Modal State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAllocated, setNewCatAllocated] = useState<string | number>('25000');
  const [newCatNotes, setNewCatNotes] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // Edit Category State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  // Add Expense Modal State
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCategoryId, setNewExpCategoryId] = useState<string>('');
  const [newExpEstimated, setNewExpEstimated] = useState<number>(0);
  const [newExpActual, setNewExpActual] = useState<number>(0);
  const [newExpDate, setNewExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newExpStatus, setNewExpStatus] = useState<'pending' | 'partially_paid' | 'paid'>('pending');
  const [newExpNotes, setNewExpNotes] = useState<string>('');

  // Edit Expense State
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editExpTitle, setEditExpTitle] = useState('');
  const [editExpActual, setEditExpActual] = useState<number>(0);
  const [editExpStatus, setEditExpStatus] = useState<'pending' | 'partially_paid' | 'paid'>('pending');

  if (!event) return null;

  // Real or deterministic calculations
  const totalAllocated = summary
    ? summary.totalAllocated
    : budgets.reduce((acc, b) => acc + b.allocated, 0);

  const totalActual = summary
    ? summary.totalActualExpenses
    : expenses.length > 0
    ? expenses.reduce((acc, e) => acc + (e.actualAmount || 0), 0)
    : budgets.reduce((acc, b) => acc + b.actual, 0);

  const totalEstimated = summary
    ? summary.totalEstimatedExpenses
    : expenses.reduce((acc, e) => acc + e.estimatedAmount, 0);

  const remainingBudget = summary
    ? summary.remainingBudget
    : event.totalBudget - totalActual;

  const utilizationRate = summary
    ? summary.budgetUtilization
    : event.totalBudget > 0
    ? Math.round((totalActual / event.totalBudget) * 100)
    : 0;

  const isOverAllocated = totalAllocated > event.totalBudget;
  const isOverBudget = totalActual > event.totalBudget;

  const warnings = summary?.warnings || [];

  // Handlers
  const handleStartEditCategory = (cat: BudgetCategoryItem) => {
    setEditingCatId(cat.id);
    setEditAllocated(cat.allocated);
    setEditActual(cat.actual);
    setEditNotes(cat.notes);
  };

  const handleSaveEditCategory = (catId: string) => {
    updateBudgetCategory(event.id, catId, {
      allocated: editAllocated,
      actual: editActual,
      notes: editNotes,
    });
    setEditingCatId(null);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCatName.trim();
    if (!name) {
      setCatFormError('Category name is required');
      return;
    }
    const allocated = Number(newCatAllocated);
    if (isNaN(allocated) || allocated < 0) {
      setCatFormError('Allocated amount must be a non-negative number');
      return;
    }

    setIsSavingCat(true);
    setCatFormError(null);
    try {
      await addBudgetCategory(event.id, {
        name,
        allocated,
        actual: 0,
        notes: newCatNotes.trim(),
        isCustom: true,
      });

      setNewCatName('');
      setNewCatAllocated('25000');
      setNewCatNotes('');
      setIsAddingCategory(false);
    } catch (err: any) {
      setCatFormError(err.message || 'Failed to save category to database');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpTitle.trim()) return;

    addExpense(event.id, {
      title: newExpTitle.trim(),
      categoryId: newExpCategoryId || null,
      estimatedAmount: Number(newExpEstimated) || 0,
      actualAmount: Number(newExpActual) || 0,
      expenseDate: newExpDate,
      paymentStatus: newExpStatus,
      notes: newExpNotes.trim(),
    });

    setNewExpTitle('');
    setNewExpCategoryId('');
    setNewExpEstimated(0);
    setNewExpActual(0);
    setNewExpNotes('');
    setIsAddingExpense(false);
  };

  const handleSaveEditExpense = (expenseId: string) => {
    updateExpense(event.id, expenseId, {
      title: editExpTitle,
      actualAmount: editExpActual,
      paymentStatus: editExpStatus,
    });
    setEditingExpId(null);
  };

  // Chart data
  const pieData = budgets.map((b) => ({
    name: b.name.split('&')[0].trim(),
    value: b.allocated,
  }));

  const barData = budgets.map((b) => ({
    name: b.name.split(' ')[0],
    Allocated: b.allocated,
    Actual: b.actual,
  }));

  return (
    <div className="space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Financial Management & Spending Control
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Smart Budget Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Allocations, expense vouchers, planned estimates, and variance monitoring for{' '}
            <strong className="text-slate-700 dark:text-slate-300">{event.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => fetchEventPlanningData(event.id)}
            disabled={planningLoading}
            className="p-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            title="Refresh Budget Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${planningLoading ? 'animate-spin' : ''}`} />
          </button>

          {onOpenAdaptiveModal && (
            <button
              onClick={onOpenAdaptiveModal}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Adaptive Re-Plan</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === 'categories') {
                setCatFormError(null);
                setIsAddingCategory(true);
              } else {
                setIsAddingExpense(true);
              }
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'categories' ? 'Add Category' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* 2. DETERMINISTIC WARNINGS BANNER */}
      {event.id === 'evt-wedding-01' && (
        <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Sample Celebration Template:</strong> You are viewing preview sample data. Create your live celebration to persist categories and expenses to your Supabase PostgreSQL database.
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

      {planningError && event.id !== 'evt-wedding-01' && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
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

      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Budget Warnings & Policy Alerts ({warnings.length})</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. FINANCIAL SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Total Budget</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(event.totalBudget, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Approved baseline limit</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Total Allocated</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(totalAllocated, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] mt-1 truncate">
            {isOverAllocated ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Over: {formatCurrency(totalAllocated - event.totalBudget, event.currency)}
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold font-mono">
                {formatCurrency(event.totalBudget - totalAllocated, event.currency)} unallocated
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Estimated Expenses</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(totalEstimated, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Planned commit</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Actual Spending</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(totalActual, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            <span className="font-mono font-semibold">{utilizationRate}%</span> disbursed
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Remaining Budget</div>
          <div
            className={`text-base sm:text-xl font-bold font-mono truncate ${
              isOverBudget ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(remainingBudget, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Available reserve</div>
        </div>
      </div>

      {/* 4. VISUAL CHARTS (Pie & Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-indigo-500" />
              <span>Budget Allocation Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">{budgets.length} categories</span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value), event.currency), 'Allocated']}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Planned vs. Actual Expenses</span>
            </h3>
            <span className="text-[11px] text-slate-400">Variance Monitor</span>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val), event.currency)}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Allocated" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. TABS: CATEGORIES VS EXPENSES */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Budget Categories ({budgets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Expense Receipts & Vouchers ({expenses.length})</span>
        </button>
      </div>

      {/* 6. TAB CONTENT: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Interactive Category Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Category Breakdown & Allocations
                </h3>
                <p className="text-xs text-slate-500">Edit allocations or review actual spending per category</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCatFormError(null);
                  setIsAddingCategory(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500">
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Share</th>
                    <th className="py-3 px-4 font-semibold text-right">Allocated</th>
                    <th className="py-3 px-4 font-semibold text-right">Actual Spent</th>
                    <th className="py-3 px-4 font-semibold text-right">Variance</th>
                    <th className="py-3 px-4 font-semibold">Notes</th>
                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No budget categories created yet. Click{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCatFormError(null);
                            setIsAddingCategory(true);
                          }}
                          className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Category</span>
                        </button>{' '}
                        to establish your budget allocation.
                      </td>
                    </tr>
                  ) : (
                    budgets.map((cat) => {
                    const isEditing = editingCatId === cat.id;
                    const percentage = totalAllocated > 0 ? Math.round((cat.allocated / totalAllocated) * 100) : 0;
                    const variance = cat.allocated - cat.actual;
                    const isOverspent = cat.actual > cat.allocated;

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {cat.name}
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {percentage}%
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={editAllocated}
                              onChange={(e) => setEditAllocated(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-right text-xs font-mono rounded border border-indigo-500 bg-white dark:bg-slate-800"
                            />
                          ) : (
                            <span>{formatCurrency(cat.allocated, event.currency)}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={editActual}
                              onChange={(e) => setEditActual(Number(e.target.value))}
                              className="w-24 px-2 py-1 text-right text-xs font-mono rounded border border-indigo-500 bg-white dark:bg-slate-800"
                            />
                          ) : (
                            <span className={cat.actual > 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
                              {formatCurrency(cat.actual, event.currency)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          {isOverspent ? (
                            <span className="text-red-600 font-semibold">
                              +{formatCurrency(cat.actual - cat.allocated, event.currency)} (Over)
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">
                              {formatCurrency(variance, event.currency)} left
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-indigo-500 bg-white dark:bg-slate-800"
                            />
                          ) : (
                            <span>{cat.notes || '—'}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleSaveEditCategory(cat.id)}
                                className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                title="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingCatId(null)}
                                className="p-1 rounded text-slate-400 hover:text-slate-600"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEditCategory(cat)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                title="Edit Category"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete category "${cat.name}"? Existing expenses will be unassigned but preserved.`)) {
                                    deleteBudgetCategory(event.id, cat.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Delete Category"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Add Expense Form */}
          {isAddingExpense && (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  Record New Event Expense
                </h3>
                <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddExpenseSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DJ Advance Deposit"
                    value={newExpTitle}
                    onChange={(e) => setNewExpTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Budget Category
                  </label>
                  <select
                    value={newExpCategoryId}
                    onChange={(e) => setNewExpCategoryId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Uncategorized</option>
                    {budgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={newExpStatus}
                    onChange={(e) => setNewExpStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid (Disbursed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newExpEstimated}
                    onChange={(e) => setNewExpEstimated(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Disbursed Amount ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={newExpActual}
                    onChange={(e) => setNewExpActual(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={newExpDate}
                    onChange={(e) => setNewExpDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Receipt Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid via UPI to DJ vendor · Receipt #889"
                    value={newExpNotes}
                    onChange={(e) => setNewExpNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingExpense(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Record Expense
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Expenses Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recorded Expenses & Disbursed Payments
                </h3>
                <p className="text-xs text-slate-500">Track and reconcile every transaction against your celebration budget</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-500">
                    <th className="py-3 px-4 font-semibold">Expense Title</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Estimated</th>
                    <th className="py-3 px-4 font-semibold text-right">Actual Spent</th>
                    <th className="py-3 px-4 font-semibold">Date & Notes</th>
                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No expenses recorded yet. Click <strong>Add Expense</strong> to register a vendor deposit or receipt.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp) => {
                      const isEditing = editingExpId === exp.id;
                      const catName = exp.categoryName || budgets.find((b) => b.id === exp.categoryId)?.name || 'Uncategorized';

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editExpTitle}
                                onChange={(e) => setEditExpTitle(e.target.value)}
                                className="w-full px-2 py-1 text-xs rounded border border-indigo-500 bg-white dark:bg-slate-800"
                              />
                            ) : (
                              exp.title
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {catName}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={editExpStatus}
                                onChange={(e) => setEditExpStatus(e.target.value as any)}
                                className="px-2 py-1 text-xs rounded border border-indigo-500 bg-white dark:bg-slate-800"
                              >
                                <option value="pending">Pending</option>
                                <option value="partially_paid">Partially Paid</option>
                                <option value="paid">Paid</option>
                              </select>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  exp.paymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : exp.paymentStatus === 'partially_paid'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                                }`}
                              >
                                {exp.paymentStatus.replace('_', ' ')}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono text-slate-500">
                            {formatCurrency(exp.estimatedAmount, event.currency)}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editExpActual}
                                onChange={(e) => setEditExpActual(Number(e.target.value))}
                                className="w-24 px-2 py-1 text-right text-xs font-mono rounded border border-indigo-500 bg-white dark:bg-slate-800"
                              />
                            ) : (
                              <span className={exp.actualAmount ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
                                {formatCurrency(exp.actualAmount || 0, event.currency)}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {exp.expenseDate && <span className="font-mono text-[10px] text-slate-400 mr-2">{exp.expenseDate.split('T')[0]}</span>}
                            <span>{exp.notes || '—'}</span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleSaveEditExpense(exp.id)}
                                  className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                  title="Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingExpId(null)}
                                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingExpId(exp.id);
                                    setEditExpTitle(exp.title);
                                    setEditExpActual(exp.actualAmount || 0);
                                    setEditExpStatus(exp.paymentStatus);
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="Edit Expense"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete expense "${exp.title}"?`)) {
                                      deleteExpense(event.id, exp.id);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-red-600"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD CATEGORY MODAL DIALOG */}
      {isAddingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-add-category-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingCat) {
              setIsAddingCategory(false);
            }
          }}
        >
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-add-category-title" className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Budget Category
                  </h3>
                  <p className="text-xs text-slate-500">Allocate funds to a new expense category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isSavingCat && setIsAddingCategory(false)}
                disabled={isSavingCat}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCategorySubmit} className="p-5 space-y-4">
              {catFormError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{catFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Venue & Catering, Photography, Floral Design"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (catFormError) setCatFormError(null);
                  }}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Allocated Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="0"
                  value={newCatAllocated}
                  onChange={(e) => {
                    setNewCatAllocated(e.target.value);
                    if (catFormError) setCatFormError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Target allocation limit for this category.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Vendor notes, targets, or details"
                  value={newCatNotes}
                  onChange={(e) => setNewCatNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  disabled={isSavingCat}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCat || !newCatName.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {isSavingCat && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSavingCat ? 'Saving...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
