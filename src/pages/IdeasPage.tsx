import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { IdeaItem } from '../types';

interface IdeasPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const IdeasPage: React.FC<IdeasPageProps> = ({ onOpenAdaptiveModal }) => {
  const navigate = useNavigate();
  const {
    getCurrentEvent,
    getCurrentIdeas,
    toggleSaveIdea,
  } = useAppStore();

  const event = getCurrentEvent();
  const ideas = getCurrentIdeas();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState<IdeaItem | null>(null);

  if (!event) return null;

  const filteredIdeas = ideas.filter((idea) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'saved') return idea.isSaved;
    return idea.category === selectedCategory;
  });

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Inspiration & Concepts
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
            Personalized Celebration Ideas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tailored suggestions synthesized from your atmosphere preference ({event.preferences.atmosphere}) and budget tier.
          </p>
        </div>

        {onOpenAdaptiveModal && (
          <button
            onClick={onOpenAdaptiveModal}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adaptive Re-Plan</span>
          </button>
        )}
      </div>

      {/* 2. DEMO NOTICE */}
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0" />
        <span>
          <strong>Simulated Concept Stream:</strong> Demonstrating contextual recommendations based on {event.category} preferences. In production, this connects directly to the GenAI API pipeline.
        </span>
      </div>

      {/* 3. CATEGORY FILTER TABS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg overflow-x-auto">
        {[
          { id: 'all', label: 'All Ideas' },
          { id: 'decor', label: 'Decor & Florals' },
          { id: 'food', label: 'Catering & Food' },
          { id: 'entertainment', label: 'Entertainment' },
          { id: 'activities', label: 'Interactive Activities' },
          { id: 'saved', label: 'Bookmarked' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. IDEAS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredIdeas.map((idea) => {
          return (
            <div
              key={idea.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-400/80 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {idea.category}
                  </span>
                  <button
                    onClick={() => toggleSaveIdea(event.id, idea.id)}
                    className="p-1 text-slate-400 hover:text-indigo-600"
                    title={idea.isSaved ? 'Remove Bookmark' : 'Bookmark Idea'}
                  >
                    {idea.isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-current" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {idea.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {idea.description}
                </p>

                <div className="mt-3 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                    Why it fits your profile:
                  </span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{idea.matchReason}</span>
                </div>

                {idea.alternatives && idea.alternatives.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    <span className="font-semibold">Budget Alternative:</span> {idea.alternatives[0]}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs gap-2">
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                  Est. {idea.estimatedBudgetRange}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const catMap: Record<string, string> = {
                        decor: 'Decoration & Florals',
                        food: 'Catering & Food',
                        entertainment: 'Entertainment',
                        activities: 'Entertainment',
                      };
                      const targetCat = catMap[idea.category] || 'Wedding Venues';
                      navigate(`/app/events/${event.id}/vendors?category=${encodeURIComponent(targetCat)}`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                    title="Find community vendors for this concept"
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Find Vendors</span>
                  </button>

                  <button
                    onClick={() => setSelectedIdeaDetail(idea)}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ALTERNATIVES MODAL */}
      {selectedIdeaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedIdeaDetail.title} — Value Alternatives
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              If your budget tightens or guest count increases, here are pre-engineered compromises that preserve the core celebration aesthetic:
            </p>

            <div className="space-y-2">
              {selectedIdeaDetail.alternatives.map((alt, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5">
                    Streamlined Option {i + 1}
                  </div>
                  {alt}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedIdeaDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
