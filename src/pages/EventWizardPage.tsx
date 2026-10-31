import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Wallet,
  Users,
  MapPin,
  Heart,
  Palette,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppStore } from '../store/useAppStore';
import { EventCategory, CurrencyCode } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

const CATEGORIES: EventCategory[] = [
  'Wedding',
  'Birthday',
  'Anniversary',
  'Engagement',
  'Baby shower',
  'Corporate event',
  'Community gathering',
  'Festival',
  'Graduation',
  'Other',
];

const THEME_OPTIONS = [
  'Classic & Elegant',
  'Modern Minimalist',
  'Festive & Vibrant',
  'Rustic & Bohemian',
  'Royal & Traditional',
  'Casual & Intimate',
];

const DIETARY_TAGS = [
  'Vegetarian',
  'Non-Vegetarian',
  'Vegan',
  'Jain Friendly',
  'Gluten-Free',
  'Halal',
];

export const EventWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { createEvent, currency } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const totalSteps = 3;

  // Step 1: Event Details
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EventCategory>('Wedding');
  const [date, setDate] = useState('2026-12-20');
  const [location, setLocation] = useState('');
  const [occasionDescription, setOccasionDescription] = useState('');

  // Step 2: Planning Requirements
  const [totalBudget, setTotalBudget] = useState<number>(500000);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(currency || 'INR');
  const [expectedGuests, setExpectedGuests] = useState<number>(120);
  const [theme, setTheme] = useState<string>('Classic & Elegant');
  const [dietary, setDietary] = useState<string[]>(['Vegetarian', 'Non-Vegetarian']);

  const [errors, setErrors] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const toggleDiet = (item: string) => {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleNext = () => {
    setErrors(null);
    if (step === 1) {
      if (!name.trim()) {
        setErrors('Please enter a celebration name.');
        return;
      }
      if (!date) {
        setErrors('Please select an event date.');
        return;
      }
      if (!location.trim()) {
        setErrors('Please enter the event location or city.');
        return;
      }
    }
    if (step === 2) {
      if (!totalBudget || totalBudget <= 0) {
        setErrors('Please provide a valid budget amount.');
        return;
      }
      if (!expectedGuests || expectedGuests <= 0) {
        setErrors('Please provide an expected guest count.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleCreatePlan = () => {
    setIsCreating(true);

    const adultsCount = Math.round(expectedGuests * 0.8);
    const childrenCount = Math.round(expectedGuests * 0.15);
    const elderlyCount = expectedGuests - adultsCount - childrenCount;

    setTimeout(() => {
      const newEventId = createEvent({
        name,
        category,
        occasionDescription: occasionDescription || `${category} celebration for ${expectedGuests} guests at ${location}.`,
        date,
        location,
        expectedGuests,
        guestBreakdown: {
          adults: adultsCount,
          children: childrenCount,
          elderly: Math.max(0, elderlyCount),
        },
        dietaryPreferences: dietary,
        accessibilityRequirements: ['Standard accessibility'],
        preferences: {
          atmosphere: theme,
          style: theme,
          food: dietary.join(', '),
          decoration: `${theme} aesthetic styling`,
          photography: 'Candid & formal portraits',
          entertainment: 'Ambient & celebratory music',
          cultural: 'Traditional and modern fusion',
        },
        priorities: {
          foodQuality: 5,
          guestExperience: 5,
          venue: 4,
          decoration: 4,
          photography: 4,
          entertainment: 3,
          accessibility: 4,
        },
        mustHaves: ['Quality hospitality', 'Guest comfort'],
        avoidances: ['Unnecessary delays'],
        totalBudget,
        preferredSpendingLevel: 'balanced',
        currency: selectedCurrency,
        status: 'planning',
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Fallback gracefully
      }

      setIsCreating(false);
      navigate(`/app/events/${newEventId}/overview`);
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Wizard Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Celebration Planner</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Plan Your Next Celebration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Set up your celebration in 3 simple steps to generate an intelligent budget, tasks, and recommendations.
        </p>
      </div>

      {/* 3-Step Indicator Bar */}
      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step > 1
                  ? 'bg-indigo-600 text-white'
                  : step === 1
                  ? 'border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span>Event Details</span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-slate-800 relative">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />
          </div>

          <div
            className={`flex items-center gap-2 ${
              step >= 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step > 2
                  ? 'bg-indigo-600 text-white'
                  : step === 2
                  ? 'border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
            </div>
            <span>Requirements</span>
          </div>

          <div className="h-0.5 flex-1 mx-3 bg-slate-200 dark:bg-slate-800 relative">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: step <= 2 ? '0%' : '100%' }}
            />
          </div>

          <div
            className={`flex items-center gap-2 ${
              step === 3 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === 3
                  ? 'border-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              3
            </div>
            <span>Review & Create</span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {errors && (
        <div className="p-3 text-xs rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
          {errors}
        </div>
      )}

      {/* STEP 1: EVENT DETAILS */}
      {step === 1 && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 1: Event Details
            </h2>
            <p className="text-xs text-slate-500">
              Basic information about your upcoming celebration.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Celebration Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Priya & Rahul's Wedding, Rohan's 30th Birthday"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Event Type *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Celebration Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location / City *
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g., Bengaluru, Indiranagar or The Leela Palace"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any special context, vibe, or key moments you're envisioning..."
              value={occasionDescription}
              onChange={(e) => setOccasionDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* STEP 2: PLANNING REQUIREMENTS */}
      {step === 2 && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 2: Planning Requirements
            </h2>
            <p className="text-xs text-slate-500">
              Budget targets, guest scale, and aesthetic preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Total Target Budget *
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Guests *
              </label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="5"
                  value={expectedGuests}
                  onChange={(e) => setExpectedGuests(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Preferred Theme / Atmosphere
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_OPTIONS.map((thm) => (
                <button
                  key={thm}
                  type="button"
                  onClick={() => setTheme(thm)}
                  className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-colors flex items-center justify-between ${
                    theme === thm
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className="truncate">{thm}</span>
                  {theme === thm && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Food & Dietary Focus (Select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => {
                const active = dietary.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleDiet(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CREATE */}
      {step === 3 && (
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Step 3: Review & Generate Plan
            </h2>
            <p className="text-xs text-slate-500">
              Confirm your celebration details. Our intelligent engine will generate an initial budget breakdown and milestone tasks.
            </p>
          </div>

          <div className="rounded-xl p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  {category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {name}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Total Budget</div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  {formatCurrency(totalBudget, selectedCurrency)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Date</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDate(date)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {location}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Expected Guests</div>
                <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {expectedGuests} pax
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Theme & Atmosphere</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {theme}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] text-slate-400">Dietary Preferences</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {dietary.join(', ') || 'Standard catering'}
                </div>
              </div>
            </div>

            {occasionDescription && (
              <div className="pt-2 text-xs text-slate-500 italic">
                "{occasionDescription}"
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Clicking <strong>"Create Celebration Plan"</strong> will set up your dedicated workspace with automated category allocations, task deadlines, and community vendor recommendations.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={isCreating}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous Step</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/app/dashboard')}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        )}

        {step < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs ml-auto"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCreatePlan}
            disabled={isCreating}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-2 shadow-md ml-auto disabled:opacity-75"
          >
            {isCreating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Plan...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Celebration Plan</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
