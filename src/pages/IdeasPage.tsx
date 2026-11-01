import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Lightbulb,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Info,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Building2,
  CheckCircle2,
  ListTodo,
  Trash2,
  AlertCircle,
  Palette,
  Compass,
  Utensils,
  Music,
  PartyPopper,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { IdeaItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface IdeasPageProps {
  onOpenAdaptiveModal?: () => void;
}

export const IdeasPage: React.FC<IdeasPageProps> = ({ onOpenAdaptiveModal }) => {
  const navigate = useNavigate();
  const { eventId: routeEventId } = useParams<{ eventId: string }>();
  const {
    events,
    currentEventId,
    selectEvent,
    getCurrentEvent,
    getCurrentIdeas,
    fetchEventIdeas,
    generateEventIdeas,
    saveIdea,
    removeSavedIdea,
    deleteIdea,
    addTask,
    ideasLoading,
    isGeneratingIdeas,
    ideasError,
  } = useAppStore();

  const targetEventId = routeEventId || currentEventId;
  const event = events.find((e) => e.id === targetEventId) || getCurrentEvent();
  const rawIdeas = getCurrentIdeas(event?.id);

  useEffect(() => {
    if (routeEventId && routeEventId !== currentEventId) {
      selectEvent(routeEventId);
    }
  }, [routeEventId, currentEventId, selectEvent]);

  useEffect(() => {
    if (event?.id) {
      fetchEventIdeas(event.id);
    }
  }, [event?.id, fetchEventIdeas]);

  // Preference Controls State
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'theme',
    'decoration',
    'food',
    'entertainment',
  ]);
  const [preferredColors, setPreferredColors] = useState<string>('');
  const [atmosphere, setAtmosphere] = useState<string>(event?.theme || 'Classic & Elegant');
  const [venuePreference, setVenuePreference] = useState<'any' | 'indoor' | 'outdoor' | 'mixed'>('any');
  const [dietaryPreferences, setDietaryPreferences] = useState<string>('');
  const [culturalPreferences, setCulturalPreferences] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  // Filtering & Modal States
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedIdeaDetail, setSelectedIdeaDetail] = useState<IdeaItem | null>(null);
  const [taskConversionIdea, setTaskConversionIdea] = useState<IdeaItem | null>(null);
  const [taskConvertedSuccess, setTaskConvertedSuccess] = useState<string | null>(null);
  const [deleteConfirmIdea, setDeleteConfirmIdea] = useState<IdeaItem | null>(null);
  const [generationSuccessMessage, setGenerationSuccessMessage] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <Lightbulb className="w-8 h-8 text-slate-400 mx-auto" />
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

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return;
    try {
      setGenerationSuccessMessage(null);
      const colors = preferredColors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const result = await generateEventIdeas(event.id, {
        categories: selectedCategories,
        preferences: {
          preferredColors: colors,
          atmosphere,
          venuePreference,
          dietaryPreferences: dietaryPreferences.trim() || undefined,
          culturalPreferences: culturalPreferences.trim() || undefined,
          additionalNotes: additionalNotes.trim() || undefined,
        },
      });

      setGenerationSuccessMessage(
        `Generated ${result.totalGenerated} personalized celebration ideas tailored to your ${event.category || 'celebration'}!`
      );
      setPreferencesOpen(false);
    } catch {
      // Error handled via store ideasError
    }
  };

  const handleToggleBookmark = async (idea: IdeaItem) => {
    if (idea.isSaved) {
      await removeSavedIdea(event.id, idea.id);
    } else {
      await saveIdea(event.id, idea.id);
    }
  };

  const handleConfirmTaskConversion = () => {
    if (!taskConversionIdea) return;

    addTask(event.id, {
      title: `Plan: ${taskConversionIdea.title}`,
      description: `${taskConversionIdea.description}\n\nBudget Allocation: ${taskConversionIdea.estimatedBudgetRange}`,
      category: taskConversionIdea.category || 'Planning',
      priority: 'medium',
      status: 'pending',
      dependencies: [],
      dueDate: event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      assignedTo: 'Event Host',
    });

    setTaskConvertedSuccess(taskConversionIdea.title);
    setTaskConversionIdea(null);
    setTimeout(() => setTaskConvertedSuccess(null), 4000);
  };

  const handleDeleteIdea = async () => {
    if (!deleteConfirmIdea) return;
    await deleteIdea(event.id, deleteConfirmIdea.id);
    setDeleteConfirmIdea(null);
  };

  // Filter ideas by tab
  const filteredIdeas = rawIdeas.filter((idea) => {
    if (selectedCategoryTab === 'all') return true;
    if (selectedCategoryTab === 'saved') return idea.isSaved;

    const cat = (idea.category || '').toLowerCase();
    if (selectedCategoryTab === 'theme') return cat.includes('theme');
    if (selectedCategoryTab === 'decoration') return cat.includes('decor');
    if (selectedCategoryTab === 'food') return cat.includes('food') || cat.includes('cater');
    if (selectedCategoryTab === 'entertainment') return cat.includes('entertain') || cat.includes('music');
    if (selectedCategoryTab === 'venue') return cat.includes('venue') || cat.includes('ambience');
    if (selectedCategoryTab === 'guest_experience') return cat.includes('guest') || cat.includes('activit') || cat.includes('experience');

    return cat === selectedCategoryTab;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & EVENT CONTEXT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
              AI Idea Studio
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 font-medium">Phase 5 Engine</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5">
            Personalized Celebration Ideas
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Discover creative, practical ideas synthesized from your actual event details, verified budget context, and custom atmosphere preferences.
          </p>

          {/* Context Chips */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formatDate(event.date)}</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="truncate max-w-[140px]">{event.location}</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
              <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formatCurrency(event.totalBudget, event.currency)}</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{event.expectedGuests} Guests</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => setPreferencesOpen(!preferencesOpen)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Customize Preferences</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${preferencesOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGeneratingIdeas || selectedCategories.length === 0}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all flex items-center gap-2 ${
              isGeneratingIdeas || selectedCategories.length === 0
                ? 'bg-indigo-400 cursor-not-allowed opacity-70'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25'
            }`}
          >
            {isGeneratingIdeas ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Ideas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Ideas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. SUCCESS & ERROR ALERTS */}
      {taskConvertedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Successfully added <strong>&ldquo;{taskConvertedSuccess}&rdquo;</strong> as an actionable task in your Timeline & Tasks workspace!
          </span>
        </div>
      )}

      {generationSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{generationSuccessMessage}</span>
          </div>
          <button onClick={() => setGenerationSuccessMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {ideasError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{ideasError}</span>
          </div>
          <button
            onClick={handleGenerate}
            className="px-2.5 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/60 hover:bg-red-200 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. PREFERENCE CONTROLS PANEL (COLLAPSIBLE) */}
      {preferencesOpen && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/80 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Inspiration Preferences & Tuning
              </h3>
              <p className="text-[11px] text-slate-500">
                Guide the Gemini AI engine with specific categories, color moods, and celebration restrictions.
              </p>
            </div>
            <button
              onClick={() => setPreferencesOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Concept Categories to Generate:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'theme', label: 'Themes', icon: Compass },
                { id: 'decoration', label: 'Decorations', icon: Palette },
                { id: 'food', label: 'Food & Catering', icon: Utensils },
                { id: 'entertainment', label: 'Entertainment', icon: Music },
                { id: 'venue', label: 'Venue & Ambience', icon: Building2 },
                { id: 'guest_experience', label: 'Guest Experience', icon: PartyPopper },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Preferred Color Palette
              </label>
              <input
                type="text"
                placeholder="e.g. Sage Green, Ivory, Gold"
                value={preferredColors}
                onChange={(e) => setPreferredColors(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Celebration Atmosphere
              </label>
              <input
                type="text"
                placeholder="e.g. Romantic, Royal Heritage, Rustic"
                value={atmosphere}
                onChange={(e) => setAtmosphere(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Venue Preference
              </label>
              <select
                value={venuePreference}
                onChange={(e) => setVenuePreference(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="any">Flexible / Any</option>
                <option value="outdoor">Lawn / Outdoor</option>
                <option value="indoor">Banquet Hall / Indoor</option>
                <option value="mixed">Mixed / Poolside</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Dietary & Cultural Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Pure Veg, South Indian touch"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGenerate}
              disabled={isGeneratingIdeas || selectedCategories.length === 0}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthesize Ideas with Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. CATEGORY NAVIGATION TABS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: `All Ideas (${rawIdeas.length})` },
          { id: 'theme', label: 'Themes' },
          { id: 'decoration', label: 'Decorations' },
          { id: 'food', label: 'Food & Catering' },
          { id: 'entertainment', label: 'Entertainment' },
          { id: 'venue', label: 'Venue & Ambience' },
          { id: 'guest_experience', label: 'Guest Experience' },
          { id: 'saved', label: `Favorites (${rawIdeas.filter((i) => i.isSaved).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategoryTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. CARDS GRID & UI STATES */}
      {ideasLoading ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Fetching personalized celebration concepts from Supabase...
          </p>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="p-16 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <Lightbulb className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {selectedCategoryTab === 'saved' ? 'No Saved Favorite Ideas Yet' : 'No Concepts Found for this Category'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {selectedCategoryTab === 'saved'
                ? 'Click the bookmark icon on any idea card to curate your top celebration favorites.'
                : 'Click "Generate Ideas" above to synthesize fresh concepts tailored to your celebration.'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGeneratingIdeas}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Celebration Ideas</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredIdeas.map((idea) => {
            const content = idea.content || {};
            const tips = content.implementationTips || idea.implementationTips || [];
            const palette = content.colorPalette || idea.tags || [];

            return (
              <div
                key={idea.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
              >
                <div>
                  {/* Card Header: Category & Bookmark */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                        {idea.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                        <span>AI Synthesized</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleBookmark(idea)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={idea.isSaved ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        {idea.isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-current" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setDeleteConfirmIdea(idea)}
                        className="p-1.5 text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete concept"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {idea.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {idea.description}
                  </p>

                  {/* Why it matches */}
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                      Why it fits your celebration:
                    </span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">{idea.matchReason}</span>
                  </div>

                  {/* Color Palette Chips */}
                  {palette.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Palette:
                      </span>
                      {palette.map((color: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {color}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Practical Tips */}
                  {tips.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Tip:</span>{' '}
                      {tips[0]}
                    </div>
                  )}
                </div>

                {/* Card Footer: Cost Estimate & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Est. {idea.estimatedBudgetRange}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                      {content.budgetSuitability || 'Local Market Range'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Convert to Task */}
                    <button
                      onClick={() => setTaskConversionIdea(idea)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700 transition-colors"
                      title="Convert this concept into a planning task"
                    >
                      <ListTodo className="w-3 h-3 text-indigo-500" />
                      <span>Add Task</span>
                    </button>

                    {/* Find Recommended Vendors */}
                    <button
                      onClick={() => {
                        const catMap: Record<string, string> = {
                          decoration: 'Decoration',
                          decor: 'Decoration',
                          food: 'Catering',
                          catering: 'Catering',
                          entertainment: 'Music/DJ',
                          activities: 'Music/DJ',
                          venue: 'Venue',
                          ambience: 'Venue',
                        };
                        const targetCat = catMap[idea.category.toLowerCase()] || 'Venue';
                        navigate(`/app/events/${event.id}/vendors?category=${encodeURIComponent(targetCat)}`);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      title="Explore approved community vendors for this concept"
                    >
                      <Building2 className="w-3 h-3" />
                      <span>Vendors</span>
                    </button>

                    {/* View Details */}
                    <button
                      onClick={() => setSelectedIdeaDetail(idea)}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 flex items-center gap-0.5 px-2 py-1.5"
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
      )}

      {/* 6. DETAILS MODAL */}
      {selectedIdeaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                  {selectedIdeaDetail.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {selectedIdeaDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIdeaDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedIdeaDetail.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">Why it fits:</span>{' '}
              <span className="text-slate-600 dark:text-slate-400">{selectedIdeaDetail.matchReason}</span>
            </div>

            {/* Implementation Tips */}
            {selectedIdeaDetail.content?.implementationTips && (
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Practical Implementation Checklist:
                </div>
                <div className="space-y-1">
                  {selectedIdeaDetail.content.implementationTips.map((tip: string, i: number) => (
                    <div
                      key={i}
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Value Alternatives */}
            {selectedIdeaDetail.alternatives && selectedIdeaDetail.alternatives.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Budget Alternatives:
                </div>
                {selectedIdeaDetail.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {alt}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Est. {selectedIdeaDetail.estimatedBudgetRange}
              </span>
              <button
                onClick={() => setSelectedIdeaDetail(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. TASK CONVERSION CONFIRMATION MODAL */}
      {taskConversionIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <ListTodo className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Convert Idea into Workspace Task
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to add <strong>&ldquo;{taskConversionIdea.title}&rdquo;</strong> to your celebration timeline and tasks?
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div><strong>Task Name:</strong> Plan: {taskConversionIdea.title}</div>
              <div><strong>Category:</strong> {taskConversionIdea.category}</div>
              <div><strong>Budget:</strong> {taskConversionIdea.estimatedBudgetRange}</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTaskConversionIdea(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTaskConversion}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
              >
                Confirm & Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteConfirmIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Celebration Idea?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete <strong>&ldquo;{deleteConfirmIdea.title}&rdquo;</strong> from this celebration workspace.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmIdea(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-lg"
              >
                Keep Idea
              </button>
              <button
                onClick={handleDeleteIdea}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs"
              >
                Delete Idea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
