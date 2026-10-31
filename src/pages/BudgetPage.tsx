import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  SlidersHorizontal,
  Check,
  X,
  Info,
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
import { BudgetCategoryItem } from '../types';

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
  const {
    getCurrentEvent,
    getCurrentBudgets,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    currency,
  } = useAppStore();

  const event = getCurrentEvent();
  const budgets = getCurrentBudgets();

  // State for Add Modal / Inline Form
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAllocated, setNewCatAllocated] = useState(25000);
  const [newCatNotes, setNewCatNotes] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAllocated, setEditAllocated] = useState<number>(0);
  const [editActual, setEditActual] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  // AI Reallocation Proposal Demo
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  if (!event) return null;

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
  const totalActual = budgets.reduce((acc, b) => acc + b.actual, 0);
  const remainingBudget = event.totalBudget - totalActual;
  const isOverAllocated = totalAllocated > event.totalBudget;
  const allocationDelta = totalAllocated - event.totalBudget;

  const handleStartEdit = (cat: BudgetCategoryItem) => {
    setEditingId(cat.id);
    setEditAllocated(cat.allocated);
    setEditActual(cat.actual);
    setEditNotes(cat.notes);
  };

  const handleSaveEdit = (catId: string) => {
    updateBudgetCategory(event.id, catId, {
      allocated: editAllocated,
      actual: editActual,
      notes: editNotes,
    });
    setEditingId(null);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addBudgetCategory(event.id, {
      name: newCatName.trim(),
      allocated: newCatAllocated,
      actual: 0,
      notes: newCatNotes,
      isCustom: true,
    });

    setNewCatName('');
    setNewCatAllocated(25000);
    setNewCatNotes('');
    setIsAdding(false);
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
            Financial Management
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Smart Budget Planner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connected allocations, expense tracking, and scenario comparisons for{' '}
            <strong className="text-slate-700 dark:text-slate-300">{event.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* 2. NOTICE: ESTIMATES DISCLAIMER */}
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Planner Note:</strong> Allocated figures are planning estimates based on current guest headcounts ({event.expectedGuests} pax) and priority allocations, not confirmed vendor contracts until signed.
        </span>
      </div>

      {/* 3. FINANCIAL SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Target Budget</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(event.totalBudget, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Baseline limit
          </div>
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
                Over: {formatCurrency(allocationDelta, event.currency)}
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold font-mono">
                {formatCurrency(event.totalBudget - totalAllocated, event.currency)} reserve
              </span>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Actual Spending</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(totalActual, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            <span className="font-mono">{Math.round((totalActual / event.totalBudget) * 100)}%</span> disbursed
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-500 mb-1 truncate">Remaining Cash</div>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {formatCurrency(remainingBudget, event.currency)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Available reserve
          </div>
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
                  {pieData.map((entry, index) => (
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

      {/* 5. ADD CATEGORY MODAL / DRAWER */}
      {isAdding && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
              Add New Expense Category
            </h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. Wedding Stationery & Gifts"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Allocated Amount ({currency})
              </label>
              <input
                type="number"
                step="5000"
                value={newCatAllocated}
                onChange={(e) => setNewCatAllocated(Number(e.target.value))}
                required
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Details or vendor target"
                value={newCatNotes}
                onChange={(e) => setNewCatNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
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
                Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. CATEGORY-WISE INTERACTIVE TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category Breakdown & Disbursements
            </h3>
            <p className="text-xs text-slate-500">Edit allocations or enter actual vendor payments inline</p>
          </div>
          <button
            onClick={() => setShowAiSuggestion(!showAiSuggestion)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{showAiSuggestion ? 'Hide Smart Reallocation' : 'Suggest Optimization'}</span>
          </button>
        </div>

        {/* Mock AI suggestion callout */}
        {showAiSuggestion && (
          <div className="p-4 mx-5 my-4 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Smart Reallocation Recommendation</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Based on your priority of <strong>Food Quality (5/5)</strong> and <strong>Guest Experience (5/5)</strong>, you can rebalance ₹30,000 from <strong>Decoration</strong> and <strong>Entertainment</strong> towards the <strong>Catering</strong> buffer to add 2 live tasting counters.
            </p>
          </div>
        )}

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
              {budgets.map((cat) => {
                const isEditing = editingId === cat.id;
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
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(cat)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBudgetCategory(event.id, cat.id)}
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
