import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  CheckSquare,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { CopilotActionPreview } from '../../types';
import { apiClient } from '../../services/apiClient';

interface CopilotActionConfirmationModalProps {
  isOpen: boolean;
  eventId: string;
  eventName: string;
  actionPreview: CopilotActionPreview;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

export const CopilotActionConfirmationModal: React.FC<CopilotActionConfirmationModalProps> = ({
  isOpen,
  eventId,
  eventName,
  actionPreview,
  onClose,
  onSuccess,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const result = await apiClient.confirmCopilotAction({
        eventId,
        actionType: actionPreview.actionType,
        parameters: actionPreview.proposedData,
      });

      onSuccess(result);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm action. Please retry.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getActionIcon = () => {
    switch (actionPreview.actionType) {
      case 'create_task':
      case 'update_task':
        return <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'add_timeline_item':
        return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'save_idea':
        return <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'create_replan_proposal':
        return <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-850 dark:to-indigo-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
              {getActionIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                  Action Confirmation
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {eventName}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                {actionPreview.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isConfirming}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Explanation */}
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-850/80 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            {actionPreview.summary}
          </div>

          {/* Warnings callout */}
          {actionPreview.warnings && actionPreview.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                {actionPreview.warnings.map((w, idx) => (
                  <p key={idx}>{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Parameters Preview */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Proposed Operation Parameters
            </div>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto space-y-1">
              {Object.entries(actionPreview.proposedData).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-indigo-400 font-semibold">{key}:</span>
                  <span className="text-slate-300">
                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              This operation executes via backend domain services and verifies event ownership.
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <span>Confirm & Apply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

