import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  LayoutDashboard,
  Calendar,
  Wallet,
  Clock,
  Users,
  Building2,
  Lightbulb,
  Bot,
  Settings,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  SlidersHorizontal,
  PartyPopper,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getDaysRemaining } from '../../utils/formatters';
import { FloatingAIAssistant } from '../ai/FloatingAIAssistant';

interface AppLayoutProps {
  onOpenAdaptiveModal?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ onOpenAdaptiveModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId } = useParams<{ eventId: string }>();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false);

  const {
    user,
    events,
    currentEventId,
    selectEvent,
    theme,
    setTheme,
    logout,
    getCurrentEvent,
  } = useAppStore();

  const isInsideEventWorkspace = Boolean(
    location.pathname.startsWith('/app/events/') && !location.pathname.endsWith('/new')
  );
  const match = location.pathname.match(/\/app\/events\/([^/]+)/);
  const routeEventId = match && match[1] !== 'new' ? match[1] : null;

  const effectiveEventId = routeEventId || currentEventId || events[0]?.id || '';
  const activeEvent = events.find((e) => e.id === effectiveEventId) || getCurrentEvent();
  const countdown = activeEvent?.date ? getDaysRemaining(activeEvent.date) : null;

  const getPageTitle = () => {
    if (isInsideEventWorkspace && activeEvent) {
      return activeEvent.name;
    }
    if (location.pathname === '/app/dashboard') return 'All Celebrations Dashboard';
    if (location.pathname === '/app/vendors') return 'Community Recommended Vendors';
    if (location.pathname === '/app/events/new') return 'Plan New Celebration';
    if (location.pathname === '/app/settings') return 'Planner Settings';
    return 'EventPilot AI';
  };

  const handleSelectEvent = (id: string) => {
    selectEvent(id);
    setEventDropdownOpen(false);
    // If on an event sub-page, navigate smoothly to the same subpage for the selected event
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 5 && pathParts[2] === 'events') {
      const subpage = pathParts[4];
      navigate(`/app/events/${id}/${subpage}`);
    } else {
      navigate(`/app/events/${id}/overview`);
    }
  };

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    disabled?: boolean;
    highlight?: boolean;
  }

  const workspaceNavItems: NavItem[] = [
    {
      to: `/app/events/${effectiveEventId}/overview`,
      label: 'Overview',
      icon: LayoutDashboard,
      disabled: !effectiveEventId,
    },
    {
      to: `/app/events/${effectiveEventId}/budget`,
      label: 'Budget',
      icon: Wallet,
      disabled: !effectiveEventId,
    },
    {
      to: `/app/events/${effectiveEventId}/timeline`,
      label: 'Timeline & Tasks',
      icon: Clock,
      disabled: !effectiveEventId,
    },
    {
      to: `/app/events/${effectiveEventId}/guests`,
      label: 'Guest List',
      icon: Users,
      disabled: !effectiveEventId,
    },
    {
      to: `/app/events/${effectiveEventId}/vendors`,
      label: 'Recommended Vendors',
      icon: Building2,
      disabled: !effectiveEventId,
    },
    {
      to: `/app/events/${effectiveEventId}/ideas`,
      label: 'Personalized Ideas',
      icon: Lightbulb,
      disabled: !effectiveEventId,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80">
          <div
            onClick={() => navigate('/app/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>EventPilot</span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Dynamic Content: Inside Event Workspace vs Global Hub */}
        {isInsideEventWorkspace ? (
          <>
            {/* Inside Event Workspace: Back Button & Active Celebration Selector */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => navigate('/app/dashboard')}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors"
                title="Return to Celebrations Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">← Back to Celebrations</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left transition-colors shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Active Celebration
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {activeEvent ? activeEvent.name : 'Select Event'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                </button>

                {eventDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 max-h-60 overflow-y-auto">
                    <div className="px-3 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      Switch Celebration
                    </div>
                    {events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => handleSelectEvent(evt.id)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                          evt.id === effectiveEventId
                            ? 'font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{evt.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {evt.category}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setEventDropdownOpen(false);
                          navigate('/app/events/new');
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Create New Event</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Workspace Navigation Links */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
              <div>
                <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Event Workspace
                </div>
                <nav className="space-y-0.5">
                  {workspaceNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              {/* Hub Quick Links when inside workspace */}
              <div>
                <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Global Hub
                </div>
                <nav className="space-y-0.5">
                  <NavLink
                    to="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>All Celebrations</span>
                  </NavLink>
                  <NavLink
                    to="/app/vendors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Vendor Directory</span>
                  </NavLink>
                  <NavLink
                    to="/app/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Planner Settings</span>
                  </NavLink>
                </nav>
              </div>
            </div>
          </>
        ) : (
          /* Outside Workspace: Global Hub & Celebrations List */
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            <div>
              <div className="px-2 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Workspace & Hub
              </div>
              <nav className="space-y-0.5">
                <NavLink
                  to="/app/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>All Events Dashboard</span>
                </NavLink>

                <NavLink
                  to="/app/vendors"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Recommended Vendors</span>
                </NavLink>

                <NavLink
                  to="/app/events/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <PlusCircle className="w-4 h-4 shrink-0" />
                  <span>Plan New Celebration</span>
                </NavLink>

                <NavLink
                  to="/app/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Planner Settings</span>
                </NavLink>
              </nav>
            </div>

            {/* List of user celebrations with Open Workspace buttons */}
            <div>
              <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <span>Your Celebrations</span>
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                  {events.length}
                </span>
              </div>
              <div className="space-y-2">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => handleSelectEvent(evt.id)}
                    className="p-2.5 rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {evt.name}
                      </span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Open →
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="truncate">{evt.category}</span>
                      <span>•</span>
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/app/events/new');
                  }}
                  className="w-full mt-2 py-2 px-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create New Celebration</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user.role}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* TOP HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {isInsideEventWorkspace ? (
              <>
                {/* Back to My Celebrations Button */}
                <button
                  onClick={() => navigate('/app/dashboard')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-2xs"
                  title="Back to My Celebrations"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Back to My Celebrations</span>
                  <span className="sm:hidden">Celebrations</span>
                </button>

                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

                {/* Active Celebration Info */}
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 min-w-0">
                  {activeEvent && (
                    <>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px]">
                        {activeEvent.name}
                      </span>
                      {countdown && (
                        <span className="hidden md:inline-flex text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                          {countdown.label}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </>
            ) : (
              /* Global Hub Title */
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">{getPageTitle()}</span>
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isInsideEventWorkspace && activeEvent && onOpenAdaptiveModal && (
              <button
                onClick={onOpenAdaptiveModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Re-plan Event</span>
                <span className="sm:hidden">Re-plan</span>
              </button>
            )}

            <button
              onClick={() => navigate('/app/events/new')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Plan Celebration</span>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* Global Floating AI Assistant Widget */}
        <FloatingAIAssistant onOpenAdaptiveModal={onOpenAdaptiveModal} />

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav
          aria-label="Mobile Navigation"
          className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1.5 shadow-lg safe-bottom"
        >
          {isInsideEventWorkspace ? (
            <>
              <NavLink
                to={`/app/events/${effectiveEventId}/overview`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Overview</span>
              </NavLink>

              <NavLink
                to={`/app/events/${effectiveEventId}/budget`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <Wallet className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Budget</span>
              </NavLink>

              <NavLink
                to={`/app/events/${effectiveEventId}/timeline`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <Clock className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Timeline</span>
              </NavLink>

              <NavLink
                to={`/app/events/${effectiveEventId}/vendors`}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <Building2 className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Vendors</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Dashboard</span>
              </NavLink>

              <NavLink
                to="/app/vendors"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <Building2 className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Vendors</span>
              </NavLink>

              <NavLink
                to="/app/events/new"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <PlusCircle className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Plan New</span>
              </NavLink>

              <NavLink
                to="/app/settings"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                  }`
                }
              >
                <Settings className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">Settings</span>
              </NavLink>
            </>
          )}

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 min-w-[56px] min-h-[44px] rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Menu className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
