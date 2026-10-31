import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { processAIChat } from '../../services/aiAssistantService';

interface FloatingAIAssistantProps {
  onOpenAdaptiveModal?: () => void;
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  onOpenAdaptiveModal,
}) => {
  const navigate = useNavigate();

  const {
    getCurrentEvent,
    getCurrentBudgets,
    getCurrentTasks,
    getCurrentVendors,
    getCurrentAIMessages,
    addAIMessage,
    clearAIChat,
  } = useAppStore();

  const event = getCurrentEvent();
  const budgets = getCurrentBudgets();
  const tasks = getCurrentTasks();
  const vendors = getCurrentVendors();
  const messages = getCurrentAIMessages();

  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isThinking, isOpen]);

  if (!event) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    addAIMessage(event.id, {
      sender: 'user',
      text: query.trim(),
    });

    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await processAIChat(query, event, budgets, tasks, vendors);

      addAIMessage(event.id, {
        sender: 'assistant',
        text: response.reply,
        suggestedAction: response.suggestedAction,
        recommendations: response.recommendations,
      });
    } catch {
      addAIMessage(event.id, {
        sender: 'assistant',
        text: 'I encountered an issue processing your request. Please try again.',
      });
    } finally {
      setIsThinking(false);
    }
  };

  const handleActionClick = (action: any) => {
    if (!action) return;
    if (action.type === 'replan' && onOpenAdaptiveModal) {
      onOpenAdaptiveModal();
    } else if (action.type === 'rebalance_budget' && onOpenAdaptiveModal) {
      onOpenAdaptiveModal();
    } else if (action.type === 'compare_vendors') {
      navigate(`/app/events/${event.id}/vendors`);
      setIsOpen(false);
    } else if (action.type === 'add_task') {
      navigate(`/app/events/${event.id}/timeline`);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* ATTRACTIVE COMPACT FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_10px_30px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
            aria-label="Open AI Co-Planner"
          >
            {/* Attractive glow status dot */}
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
              <Bot className="w-4 h-4 text-white" />
            </span>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>AI Co-Pilot</span>
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ATTRACTIVE COMPACT CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-50 w-[340px] sm:w-[370px] max-w-[calc(100vw-1.5rem)] h-[490px] max-h-[calc(100vh-6.5rem)] bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate flex items-center gap-1.5">
                  <span>AI Co-Pilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-indigo-100 truncate">
                  {event.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {/* Clear chat */}
              <button
                onClick={() => clearAIChat(event.id)}
                title="Reset conversation"
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                title="Close Co-Pilot"
                className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {[
              'Reduce expenses',
              'Urgent tasks',
              'Compare quotes',
              'Add 50 guests',
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-400 whitespace-nowrap transition-colors shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-2.5 text-[11px] leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Action Button inside Message */}
                    {msg.suggestedAction && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          onClick={() => handleActionClick(msg.suggestedAction)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-2xs w-full justify-center"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>{msg.suggestedAction.label}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}

                    {/* Follow-up Prompts */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-700/40 space-y-1">
                        <div className="flex flex-col gap-1">
                          {msg.recommendations.map((rec, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(rec)}
                              className="text-[10px] p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:border-indigo-500 text-left transition-colors"
                            >
                              👉 {rec}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex gap-2 items-center text-slate-500 dark:text-slate-400 italic text-[10px] p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <Bot className="w-3 h-3 text-indigo-500 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Compact Chat Input */}
          <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                placeholder="Ask about budget, tasks, quotes..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={isThinking}
                className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isThinking}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                title="Send"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
