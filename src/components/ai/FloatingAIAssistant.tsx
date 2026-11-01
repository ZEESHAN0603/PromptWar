import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  X,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  Maximize2,
  Minimize2,
  Calendar,
  Wallet,
  Clock,
  Users,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { processAIChat } from '../../services/aiAssistantService';
import { apiClient } from '../../services/apiClient';
import { CopilotActionPreview, CopilotConversation } from '../../types';
import { CopilotActionConfirmationModal } from './CopilotActionConfirmationModal';

interface FloatingAIAssistantProps {
  onOpenAdaptiveModal?: () => void;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionPreview?: CopilotActionPreview | null;
  recommendations?: string[];
}

export const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  onOpenAdaptiveModal,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    events,
    currentEventId,
    getCurrentEvent,
    getCurrentBudgets,
    getCurrentTasks,
    getCurrentVendors,
  } = useAppStore();

  // Establish active event context automatically from route or store
  const match = location.pathname.match(/\/app\/events\/([^/]+)/);
  const routeEventId = match && match[1] !== 'new' ? match[1] : null;
  const effectiveEventId = routeEventId || currentEventId || events[0]?.id || null;
  const activeEvent = events.find((e) => e.id === effectiveEventId) || getCurrentEvent();

  const budgets = getCurrentBudgets();
  const tasks = getCurrentTasks();
  const vendors = getCurrentVendors();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Conversation tracking
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversationsList, setShowConversationsList] = useState(false);

  // Chat messages for current session
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // Action confirmation modal
  const [activeActionPreview, setActiveActionPreview] = useState<CopilotActionPreview | null>(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isThinking, isOpen]);

  // Load conversations list when assistant opens
  useEffect(() => {
    if (isOpen) {
      apiClient
        .getCopilotConversations(activeEvent?.id)
        .then((convs) => {
          if (Array.isArray(convs)) {
            setConversations(convs);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, activeEvent?.id]);

  // Initial welcome message if conversation is empty
  useEffect(() => {
    if (messages.length === 0 && activeEvent) {
      setMessages([
        {
          id: 'welcome-0',
          sender: 'assistant',
          text: `Hello! I am your **Context-Aware Celebration Planning Co-Pilot** for **${activeEvent.name}**.\n\nI have instant access to your verified budget, guest lists, checklist tasks, and approved vendors. How can I help you plan today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendations: [
            'Give me my celebration overview',
            'Analyze my remaining budget',
            'What tasks are overdue or urgent?',
            'What is my confirmed guest headcount?',
          ],
        },
      ]);
    }
  }, [activeEvent, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isThinking) return;

    setLastError(null);

    const userMessage: MessageItem = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsThinking(true);

    try {
      const response = await processAIChat(
        query,
        activeEvent,
        budgets,
        tasks,
        vendors,
        currentConversationId
      );

      if (response.conversationId) {
        setCurrentConversationId(response.conversationId);
      }

      const assistantMessage: MessageItem = {
        id: response.messageId || `asst_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPreview: response.actionPreview,
        recommendations: response.recommendations,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setLastError(err.message || 'Error communicating with AI Co-Pilot.');
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    if (activeEvent) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: 'assistant',
          text: `Chat session refreshed for **${activeEvent.name}**. Ask me anything about your budget, milestones, or vendors!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          recommendations: [
            'Analyze my remaining budget',
            'What tasks are overdue?',
            'Show confirmed guest count',
          ],
        },
      ]);
      setCurrentConversationId(null);
    }
  };

  const handleReviewAction = (actionPreview: CopilotActionPreview) => {
    setActiveActionPreview(actionPreview);
    setIsConfirmationModalOpen(true);
  };

  const handleActionSuccess = (result: any) => {
    // Add success confirmation message into chat stream
    const confirmationNotice: MessageItem = {
      id: `conf_${Date.now()}`,
      sender: 'assistant',
      text: `✅ **Action Confirmed and Executed!**\n${result.message || 'Your changes have been safely committed to the event workspace database.'}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      recommendations: [
        'What should I focus on next?',
        'Analyze my remaining budget',
      ],
    };

    setMessages((prev) => [...prev, confirmationNotice]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_10px_30px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
            aria-label="Open AI Co-Pilot"
          >
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-indigo-600 animate-pulse" />
              <Bot className="w-4 h-4 text-white" />
            </span>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>AI Co-Pilot</span>
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              </span>
              {activeEvent && (
                <span className="text-[10px] text-indigo-100 font-medium truncate max-w-[120px]">
                  {activeEvent.name}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* CHAT WINDOW (COMPACT OR EXPANDED MODES) */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in duration-200 ${
            isExpanded
              ? 'inset-3 sm:inset-6 md:inset-12 lg:inset-x-24 lg:inset-y-10 rounded-2xl'
              : 'bottom-20 lg:bottom-6 right-3 sm:right-6 w-[360px] sm:w-[410px] max-w-[calc(100vw-1.5rem)] h-[540px] max-h-[calc(100vh-6.5rem)] rounded-2xl'
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shadow-xs shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate flex items-center gap-1.5">
                  <span>EventPilot AI Co-Pilot</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                {activeEvent ? (
                  <div className="text-[10px] text-indigo-100 truncate flex items-center gap-1">
                    <span className="font-semibold">{activeEvent.name}</span>
                    <span>•</span>
                    <span>{activeEvent.category}</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-indigo-100">Global Planning Mode</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize Window' : 'Expand Window'}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={handleClearChat}
                title="Clear current messages"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Co-Pilot"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner */}
          {activeEvent && (
            <div className="px-3.5 py-1.5 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100/70 dark:border-indigo-900/50 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified Context
                </span>
                <span className="text-slate-400">•</span>
                <span className="truncate">Budget & RSVPs Linked</span>
              </div>
              <button
                onClick={() => navigate(`/app/events/${activeEvent.id}/overview`)}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline shrink-0"
              >
                Open Workspace →
              </button>
            </div>
          )}

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/60'
                  }`}
                >
                  {/* Message Content with basic Markdown styling */}
                  <div className="whitespace-pre-wrap space-y-1.5">
                    {msg.text.split('\n\n').map((para, i) => {
                      if (para.startsWith('### ')) {
                        return (
                          <h4 key={i} className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mt-1 mb-0.5">
                            {para.replace('### ', '')}
                          </h4>
                        );
                      }
                      return (
                        <p key={i} className="leading-relaxed">
                          {para}
                        </p>
                      );
                    })}
                  </div>

                  {/* Action Preview Card if Present */}
                  {msg.actionPreview && (
                    <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-xs space-y-2 text-slate-800 dark:text-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Proposed Change Preview
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Requires Approval
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {msg.actionPreview.title}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        {msg.actionPreview.summary}
                      </p>
                      <button
                        onClick={() => handleReviewAction(msg.actionPreview!)}
                        className="w-full mt-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>Review & Confirm Action</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Inline Recommendation Pills for assistant messages */}
                {msg.sender === 'assistant' && msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.recommendations.map((rec, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(rec)}
                        disabled={isThinking}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors text-left truncate cursor-pointer disabled:opacity-50"
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading indicator */}
            {isThinking && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-xs text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px]">Analyzing verified celebration records...</span>
                </div>
              </div>
            )}

            {/* Error & Retry */}
            {lastError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                <span>{lastError}</span>
                <button
                  onClick={() => handleSendMessage()}
                  className="font-bold underline hover:no-underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions if idle */}
          {messages.length <= 1 && !isThinking && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-850/60 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Suggested Prompts
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Overview of my celebration',
                  'Analyze remaining budget',
                  'What tasks are overdue?',
                  'How many guests confirmed?',
                  'Show scheduled milestones',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
                placeholder={
                  activeEvent
                    ? `Ask anything about ${activeEvent.name}...`
                    : 'Ask EventPilot AI Co-Pilot...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isThinking}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {isConfirmationModalOpen && activeActionPreview && activeEvent && (
        <CopilotActionConfirmationModal
          isOpen={isConfirmationModalOpen}
          eventId={activeEvent.id}
          eventName={activeEvent.name}
          actionPreview={activeActionPreview}
          onClose={() => {
            setIsConfirmationModalOpen(false);
            setActiveActionPreview(null);
          }}
          onSuccess={handleActionSuccess}
        />
      )}
    </>
  );
};
