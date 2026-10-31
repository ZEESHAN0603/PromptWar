import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Calendar,
  Users,
  Wallet,
  Building2,
  Clock,
  CheckCircle2,
  TrendingDown,
  Layers,
  Heart,
  ChevronRight,
  ShieldCheck,
  Star,
  Menu,
  X,
  LogIn,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils/formatters';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentEventId, currency } = useAppStore();

  // Interactive adaptive preview simulator on landing page
  const [simGuests, setSimGuests] = useState<number>(250);
  const [simBudget, setSimBudget] = useState<number>(700000);
  const [simWeeksEarlier, setSimWeeksEarlier] = useState<number>(2);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState<boolean>(false);
  const [startPlanningModalOpen, setStartPlanningModalOpen] = useState<boolean>(false);

  const targetAppUrl = currentEventId ? `/app/events/${currentEventId}/overview` : '/app/dashboard';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVIGATION BAR (Strict Top Bar Contract: Brand, Links, 1 CTA) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand title, single line */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              EventPilot <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
          </div>

          {/* Zone 2: 4-5 single line text links (desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#adaptive" className="hover:text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0">
              Adaptive Planning
            </a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#categories" className="hover:text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0">
              Celebrations
            </a>
            <a href="#preview" className="hover:text-slate-900 dark:text-white transition-colors whitespace-nowrap shrink-0">
              Workspace
            </a>
          </nav>

          {/* Zone 3: 1 primary action & Mobile menu trigger */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative">
            {/* Sign In button with Create Account & Login Account dropdown options */}
            <div className="relative">
              <button
                onClick={() => setSignInMenuOpen(!signInMenuOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-expanded={signInMenuOpen}
              >
                <span>Sign In</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${signInMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {signInMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Account Access
                  </div>
                  <button
                    onClick={() => {
                      setSignInMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <LogIn className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="font-semibold">Log In to Account</div>
                      <div className="text-[10px] text-slate-400 font-normal">Existing planning workspace</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSignInMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition-colors font-medium"
                  >
                    <UserPlus className="w-4 h-4 text-purple-500" />
                    <div>
                      <div className="font-semibold">Create New Account</div>
                      <div className="text-[10px] text-slate-400 font-normal">Start fresh with free workspace</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Start Planning button showing Login Option */}
            <button
              onClick={() => setStartPlanningModalOpen(true)}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-xs min-h-[38px] cursor-pointer"
            >
              Start Planning
            </button>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[38px] min-w-[38px] flex items-center justify-center"
              aria-label="Toggle mobile navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-4 py-3 space-y-2 shadow-lg">
            <a
              href="#features"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Features
            </a>
            <a
              href="#adaptive"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Adaptive Planning Demo
            </a>
            <a
              href="#categories"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Celebration Types
            </a>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate('/login');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 py-1.5"
              >
                Sign In to Account
              </button>
              <button
                onClick={() => {
                  setMobileNavOpen(false);
                  navigate('/signup');
                }}
                className="text-xs font-semibold text-slate-600 dark:text-slate-300 py-1.5"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-slate-100 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Celebration Workspace</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] text-balance">
                Every Celebration. <br />
                <span className="text-indigo-600 dark:text-indigo-400">Thoughtfully Planned.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                Plan smarter celebrations with an intelligent event planner that brings your budget,
                guests, timeline, vendors, and ideas together in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/app/events/new')}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 hover:gap-3"
                >
                  <span>Start Planning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#features"
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center"
                >
                  Explore Features
                </a>
              </div>

              {/* Trust markers */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real-time budget reallocation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Connected task dependencies</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Interactive quotation matrix</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual / Interactive Card Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl p-6 bg-slate-900 text-white shadow-2xl border border-slate-800">
                {/* Decorative badge */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Live Workspace Sample
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400">v1.0 Active</span>
                </div>

                {/* Event Hero Card */}
                <div className="mt-4 space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Featured Demo</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      Aarav & Meera's Wedding
                    </h3>
                    <p className="text-xs text-slate-400">Royal Orchid Grand Lawns · Bengaluru</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Total Budget</div>
                      <div className="text-sm font-bold font-mono text-white">₹8,00,000</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Guest Count</div>
                      <div className="text-sm font-bold font-mono text-white">200 Pax</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Planning</div>
                      <div className="text-sm font-bold font-mono text-emerald-400">42% Complete</div>
                    </div>
                  </div>

                  {/* Connected Interdependency Notification */}
                  <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Adaptive Re-Planning Engine
                      </span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                        Connected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      "When guests change from 200 to 250 and budget drops to ₹7L, EventPilot automatically protects catering per-plate safety while shifting 3 high-priority deadlines."
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(targetAppUrl)}
                    className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Open Live Demo Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUE PROPOSITION / FEATURES */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">
              Interconnected Event Architecture
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              One change ripples everywhere. Nothing gets forgotten.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Standard event tools treat budget, guests, and dates as isolated silos. EventPilot AI links every decision mathematically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Wallet className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Smart Budget Allocator
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Categorized allocations for Venue, Catering, Decor, Photo, and Contingency. Detects overruns in real-time with visual charts and expense tracking.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Dynamic Timeline & Dependencies
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                4 distinct task views: List, Timeline, Calendar, and Kanban. Critical path tracking ensures venue agreements are locked before floral deposits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Vendor Quotation Matrix
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Side-by-side quotation comparisons dissecting quoted price, inclusions, exclusions, and hidden additional fees for objective vendor selection.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Guest Experience & RSVPs
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Track confirmations, family clusters, table assignments, and critical dietary notes (Jain, nut allergies, vegan) linked to catering orders.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Adaptive Plan Modification
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                When dates shift or budget tightens, the deterministic engine re-calculates downstream impacts, suggests compromises, and stores plan audit versions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-indigo-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Context-Aware AI Assistant
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask specific questions like "Help me reduce expenses" or "Compare catering quotes". Receive real actionable proposals tied directly to your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ADAPTIVE PLANNING INTERACTIVE SHOWCASE (Challenge 5 Focus) */}
      <section id="adaptive" className="py-20 bg-white dark:bg-slate-950 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Prompt Wars Virtual — Challenge 5 Demonstration
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Test Adaptive Re-Planning in Real Time
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
              Simulate the actual scenario: "Our budget decreased to ₹7,00,000, we now expect 250 guests, and the date moved two weeks earlier."
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-4xl mx-auto">
            {/* Interactive sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Simulated Budget</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(simBudget, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="1000000"
                  step="50000"
                  value={simBudget}
                  onChange={(e) => setSimBudget(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹5,00,000</span>
                  <span>Baseline: ₹8,00,000</span>
                  <span>₹10,00,000</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Expected Guests</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">{simGuests} Guests</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="350"
                  step="10"
                  value={simGuests}
                  onChange={(e) => setSimGuests(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>150 Pax</span>
                  <span>Baseline: 200</span>
                  <span>350 Pax</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700 dark:text-slate-300">Timeline Shift</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {simWeeksEarlier > 0 ? `${simWeeksEarlier} wks earlier` : 'Unchanged'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={simWeeksEarlier}
                  onChange={(e) => setSimWeeksEarlier(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>0 wks</span>
                  <span>2 wks (Demo)</span>
                  <span>4 wks</span>
                </div>
              </div>
            </div>

            {/* Instant Calculated Ripple Impact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Catering & Hospitality Impact
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {simGuests > 200 ? `+${(simGuests - 200) * 1250} estimated plate cost` : 'Within baseline capacity'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {simGuests > 220 ? 'Requires 25 banquet tables of 10 instead of 20.' : 'Table layout remains standard.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Budget Trade-Offs
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {simBudget < 800000 ? `₹${(800000 - simBudget).toLocaleString('en-IN')} reduction absorbed` : 'Budget expanded'}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {simBudget < 800000 ? 'Florals & DJ streamlined; core catering quality preserved.' : 'Available for experiential upgrades.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Urgent Task Recalculation
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {simWeeksEarlier * 7} Days Timeline Shift
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {simWeeksEarlier > 0 ? '3 tasks shifted to high-urgency status immediately.' : 'No urgent task alerts.'}
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate(targetAppUrl)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 shadow-2xs"
              >
                <span>Launch Full Re-Planning Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CELEBRATION CATEGORIES (Styled attractively with rich cards and metrics) */}
      <section id="categories" className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-950 dark:to-slate-900/40 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tailored Celebration Frameworks</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Every Life Milestone
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
              From intimate candlelit anniversaries to grand 500-guest heritage weddings. Pre-configured budgets, vendor categories, and connected checklists ready in one click.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: 'Weddings',
                desc: 'Varmala, Sangeet, Mehendi & Grand Receptions',
                guestScale: '100 – 500+ Guests',
                icon: Heart,
                color: 'from-rose-500 to-pink-600',
                accentBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
                highlights: ['Pure Jain & Multi-Cuisine Catering', 'Fairy Light & Brass Mandap Decor', 'Candid Wedding Trailer & Drone'],
                badge: 'Most Popular',
              },
              {
                name: 'Milestone Birthdays',
                desc: 'Sweet 16, 21st, 50th Jubilee & Themed Galas',
                guestScale: '30 – 150 Guests',
                icon: Star,
                color: 'from-purple-500 to-indigo-600',
                accentBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
                highlights: ['Custom Tiered Cake & Mocktail Bar', 'Live DJ & LED Dance Platform', 'Instant Polaroid Photo Stations'],
                badge: 'Festive & Fun',
              },
              {
                name: 'Anniversaries',
                desc: 'Silver, Golden Jubilee & Romantic Renewal of Vows',
                guestScale: '20 – 120 Guests',
                icon: Sparkles,
                color: 'from-amber-500 to-orange-600',
                accentBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
                highlights: ['Acoustic Violin & Instrumental Duos', 'Heritage Lawn & Intimate Dining', 'Memory Wall & Toast Speeches'],
                badge: 'Intimate Elegance',
              },
              {
                name: 'Engagements & Ring Ceremonies',
                desc: 'Formal Ring Exchange, Family Lunches & Cocktails',
                guestScale: '50 – 200 Guests',
                icon: CheckCircle2,
                color: 'from-cyan-500 to-blue-600',
                accentBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
                highlights: ['Pastel Floral Stage Arches', 'Welcome Mocktails & Live Chaat', 'Family Seating & Table Clusters'],
                badge: 'Milestone Step',
              },
              {
                name: 'Corporate Summits & Galas',
                desc: 'Annual Awards, Executive Retreats & Gala Dinners',
                guestScale: '40 – 350 Guests',
                icon: Building2,
                color: 'from-slate-700 to-slate-900',
                accentBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                highlights: ['AV Truss Lighting & Mic Systems', 'Valet Parking & Executive Shuttles', 'Itemized Corporate Tax Invoicing'],
                badge: 'Professional',
              },
              {
                name: 'Baby Showers & Naming Ceremonies',
                desc: 'Godh Bharai, Cradle Ceremonies & Family Feasts',
                guestScale: '30 – 100 Guests',
                icon: Users,
                color: 'from-teal-500 to-emerald-600',
                accentBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50',
                highlights: ['Pastel Balloon & Floral Backdrops', 'Interactive Family Games & Keepsakes', 'Traditional Sweet Boxes & Favors'],
                badge: 'Warm & Cozy',
              },
            ].map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  onClick={() => setStartPlanningModalOpen(true)}
                  className="group relative p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle top gradient bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${cat.color}`} />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs transition-transform group-hover:scale-110 ${cat.accentBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {cat.badge}
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {cat.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {cat.desc}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                      <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        <span>Scale: {cat.guestScale}</span>
                      </div>
                      <div className="space-y-1 pt-1">
                        {cat.highlights.map((item, idx) => (
                          <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Configure Celebration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready for your celebration?</span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white max-w-2xl mx-auto">
            Take the stress out of event planning with intelligent coordination.
          </h3>

          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Start fresh or explore the pre-populated wedding celebration demonstration in your browser.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setStartPlanningModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <span>Start Planning Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              Explore Demo Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">EventPilot AI</span>
            <span>·</span>
            <span>Celebration & Event Planning Workspace</span>
          </div>
          <div>Prompt Wars Virtual · Challenge 5 Implementation</div>
        </div>
      </footer>

      {/* START PLANNING MODAL (Prompted when user clicks Start Planning) */}
      {startPlanningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Start Planning with EventPilot AI
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sign in to your account or create a new celebration plan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStartPlanningModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option A: Login */}
              <button
                onClick={() => {
                  setStartPlanningModalOpen(false);
                  navigate('/login');
                }}
                className="w-full p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <LogIn className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Sign In to Account
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Access your existing celebrations and planning data
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option B: Create Account */}
              <button
                onClick={() => {
                  setStartPlanningModalOpen(false);
                  navigate('/signup');
                }}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      Create New Account
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Free account to organize your first event
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Option C: Direct Demo Workspace */}
              <button
                onClick={() => {
                  setStartPlanningModalOpen(false);
                  navigate('/app/dashboard');
                }}
                className="w-full p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Continue as Guest Demo →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
