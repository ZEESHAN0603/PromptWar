import { create } from 'zustand';
import {
  EventModel,
  BudgetCategoryItem,
  TaskItem,
  VendorItem,
  GuestItem,
  IdeaItem,
  AIMessage,
  PlanVersion,
  CurrencyCode,
  TaskStatus,
  PriorityLevel,
  RSVPStatus,
  BookingStatus,
  CommunityVendor,
  UserEventVendor,
  ExpenseItem,
  BudgetSummaryData,
  GuestSummaryData,
  TimelineActivityItem,
} from '../types';
import {
  INITIAL_WEDDING_EVENT,
  INITIAL_BUDGET_CATEGORIES,
  INITIAL_TASKS,
  INITIAL_VENDORS,
  INITIAL_GUESTS,
  INITIAL_IDEAS,
  INITIAL_AI_MESSAGES,
  INITIAL_PLAN_VERSIONS,
  INITIAL_COMMUNITY_VENDORS,
  INITIAL_USER_EVENT_VENDORS,
} from '../services/mockData';
import { calculateCompletion } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { apiClient, setApiAccessToken, getApiAccessToken } from '../services/apiClient';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role: string;
  phoneNumber?: string;
}

interface AppStoreState {
  // Auth Slice
  user: UserProfile;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;
  initAuth: () => Promise<void>;
  login: (email: string, name?: string) => void;
  loginWithSupabase: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupWithSupabase: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;

  // Settings Slice
  theme: 'light' | 'dark';
  currency: CurrencyCode;
  notificationsEnabled: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrency: (currency: CurrencyCode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Events Slice
  events: EventModel[];
  currentEventId: string;
  eventsLoading: boolean;
  eventsError: string | null;
  fetchUserEvents: (params?: { page?: number; limit?: number; eventType?: string; status?: string; sortBy?: string }) => Promise<void>;
  selectEvent: (id: string) => void;
  createEvent: (event: Omit<EventModel, 'id' | 'createdAt' | 'updatedAt' | 'completionPercentage'>) => string;
  createEventAsync: (event: Omit<EventModel, 'id' | 'createdAt' | 'updatedAt' | 'completionPercentage'>) => Promise<string>;
  updateEvent: (id: string, updates: Partial<EventModel>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => string;
  resetToDemoData: () => void;

  // Budget Slice
  budgets: Record<string, BudgetCategoryItem[]>; // Keyed by eventId
  addBudgetCategory: (eventId: string, category: Omit<BudgetCategoryItem, 'id'>) => Promise<any>;
  updateBudgetCategory: (eventId: string, id: string, updates: Partial<BudgetCategoryItem>) => Promise<void>;
  deleteBudgetCategory: (eventId: string, id: string) => Promise<void>;
  setBudgetCategories: (eventId: string, categories: BudgetCategoryItem[]) => void;

  // Tasks / Timeline Slice
  tasks: Record<string, TaskItem[]>; // Keyed by eventId
  addTask: (eventId: string, task: Omit<TaskItem, 'id' | 'eventId'>) => void;
  updateTask: (eventId: string, id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (eventId: string, id: string) => void;
  toggleTaskComplete: (eventId: string, id: string) => void;
  setTasks: (eventId: string, tasks: TaskItem[]) => void;

  // Guests Slice
  guests: Record<string, GuestItem[]>; // Keyed by eventId
  addGuest: (eventId: string, guest: Omit<GuestItem, 'id' | 'eventId'>) => void;
  updateGuest: (eventId: string, id: string, updates: Partial<GuestItem>) => void;
  deleteGuest: (eventId: string, id: string) => void;

  // Legacy Vendors Slice (Kept for compatibility)
  vendors: Record<string, VendorItem[]>; // Keyed by eventId
  addVendor: (eventId: string, vendor: Omit<VendorItem, 'id' | 'eventId'>) => void;
  updateVendor: (eventId: string, id: string, updates: Partial<VendorItem>) => void;
  deleteVendor: (eventId: string, id: string) => void;

  // Community-Driven Vendors Slice
  communityVendors: CommunityVendor[];
  addCommunityVendor: (
    vendor: Omit<CommunityVendor, 'id' | 'submittedAt' | 'updatedAt' | 'moderationStatus' | 'isDemoRecord'>
  ) => { success: boolean; duplicate?: CommunityVendor; newVendor?: CommunityVendor };
  updateCommunityVendorStatus: (id: string, status: 'approved' | 'pending_review' | 'rejected' | 'needs_more_info') => void;

  // User Saved Event Vendors Slice (Private to event)
  userEventVendors: Record<string, UserEventVendor[]>; // Keyed by eventId
  saveVendorToEvent: (eventId: string, vendor: CommunityVendor | Partial<UserEventVendor>) => void;
  updateUserEventVendor: (eventId: string, id: string, updates: Partial<UserEventVendor>) => void;
  removeUserEventVendor: (eventId: string, id: string) => void;

  // Ideas Slice
  ideas: Record<string, IdeaItem[]>; // Keyed by eventId
  toggleSaveIdea: (eventId: string, id: string) => void;

  // AI Assistant Slice
  aiMessages: Record<string, AIMessage[]>; // Keyed by eventId
  addAIMessage: (eventId: string, message: Omit<AIMessage, 'id' | 'eventId' | 'timestamp'>) => void;
  clearAIChat: (eventId: string) => void;

  // Plan Versions Slice
  planVersions: Record<string, PlanVersion[]>; // Keyed by eventId
  savePlanVersion: (
    eventId: string,
    version: Omit<PlanVersion, 'id' | 'eventId' | 'timestamp' | 'versionNumber'>
  ) => void;

  // Planning Sync & Phase 3 Slices
  planningLoading: boolean;
  planningError: string | null;
  fetchEventPlanningData: (eventId: string) => Promise<void>;

  // Expenses & Budget Summaries (Phase 3)
  expenses: Record<string, ExpenseItem[]>; // Keyed by eventId
  budgetSummaries: Record<string, BudgetSummaryData>; // Keyed by eventId
  addExpense: (eventId: string, expense: Omit<ExpenseItem, 'id' | 'eventId'>) => Promise<void>;
  updateExpense: (eventId: string, id: string, updates: Partial<ExpenseItem>) => Promise<void>;
  deleteExpense: (eventId: string, id: string) => Promise<void>;

  // Guest Summary (Phase 3)
  guestSummaries: Record<string, GuestSummaryData>; // Keyed by eventId

  // Timeline Activities (Phase 3)
  timelineItems: Record<string, TimelineActivityItem[]>; // Keyed by eventId
  addTimelineItem: (eventId: string, item: Omit<TimelineActivityItem, 'id' | 'eventId'>) => Promise<void>;
  updateTimelineItem: (eventId: string, id: string, updates: Partial<TimelineActivityItem>) => Promise<void>;
  deleteTimelineItem: (eventId: string, id: string) => Promise<void>;

  // Helper getters
  getCurrentEvent: () => EventModel | undefined;
  getCurrentBudgets: () => BudgetCategoryItem[];
  getCurrentExpenses: () => ExpenseItem[];
  getCurrentBudgetSummary: () => BudgetSummaryData | undefined;
  getCurrentTasks: () => TaskItem[];
  getCurrentGuests: () => GuestItem[];
  getCurrentGuestSummary: () => GuestSummaryData | undefined;
  getCurrentTimeline: () => TimelineActivityItem[];
  getCurrentVendors: () => VendorItem[];
  getCurrentUserEventVendors: (eventId?: string) => UserEventVendor[];
  getCommunityVendors: () => CommunityVendor[];
  getCurrentIdeas: () => IdeaItem[];
  getCurrentAIMessages: () => AIMessage[];
  getCurrentPlanVersions: () => PlanVersion[];
}

const STORAGE_KEY = 'eventpilot_app_state_v1';

function loadInitialState() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage', e);
  }
  return null;
}

const persisted = loadInitialState();

export const useAppStore = create<AppStoreState>((set, get) => {
  // Save helper
  const persistState = () => {
    try {
      const state = get();
      const payloadToSave = {
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        theme: state.theme,
        currency: state.currency,
        notificationsEnabled: state.notificationsEnabled,
        events: state.events,
        currentEventId: state.currentEventId,
        budgets: state.budgets,
        expenses: state.expenses,
        budgetSummaries: state.budgetSummaries,
        tasks: state.tasks,
        guests: state.guests,
        guestSummaries: state.guestSummaries,
        timelineItems: state.timelineItems,
        vendors: state.vendors,
        communityVendors: state.communityVendors,
        userEventVendors: state.userEventVendors,
        ideas: state.ideas,
        aiMessages: state.aiMessages,
        planVersions: state.planVersions,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payloadToSave));
    } catch (e) {
      console.warn('Unable to persist to localStorage', e);
    }
  };

  return {
    // Auth Slice
    user: persisted?.user || {
      name: 'Aditi Deshmukh',
      email: 'aditi.planner@eventpilot.example.com',
      avatar: '',
      role: 'Lead Celebration Architect',
      phoneNumber: '',
    },
    isAuthenticated: persisted?.isAuthenticated ?? true, // Default to demo auth logged in
    authLoading: false,
    authError: null,

    initAuth: async () => {
      try {
        set({ authLoading: true, authError: null });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setApiAccessToken(session.access_token);
          try {
            const profile = await apiClient.getProfile();
            set({
              isAuthenticated: true,
              user: {
                name: profile.fullName || (profile.email.split('@')[0] || 'Celebration Host'),
                email: profile.email,
                avatar: profile.avatarUrl || '',
                phoneNumber: profile.phoneNumber || '',
                role: 'Event Organizer',
              },
            });
            await get().fetchUserEvents();
          } catch (e) {
            console.warn('Backend profile sync failed on init:', e);
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth init check:', err);
      } finally {
        set({ authLoading: false });
      }
    },

    login: (email: string, name?: string) => {
      set({
        isAuthenticated: true,
        user: {
          name: name || (email.split('@')[0] || 'Celebration Host'),
          email,
          avatar: '',
          role: 'Event Organizer',
        },
      });
      persistState();
    },

    loginWithSupabase: async (email: string, password: string) => {
      set({ authLoading: true, authError: null });
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            set({ authLoading: false, authError: error.message });
            return { success: false, error: error.message };
          }
          if (data.session) {
            setApiAccessToken(data.session.access_token);
            try {
              const profile = await apiClient.getProfile();
              set({
                isAuthenticated: true,
                user: {
                  name: profile.fullName || data.user?.user_metadata?.full_name || email.split('@')[0],
                  email: profile.email || email,
                  avatar: profile.avatarUrl || '',
                  phoneNumber: profile.phoneNumber || '',
                  role: 'Event Organizer',
                },
              });
              await get().fetchUserEvents();
            } catch (err) {
              console.warn('Profile sync after login:', err);
              set({
                isAuthenticated: true,
                user: {
                  name: data.user?.user_metadata?.full_name || email.split('@')[0],
                  email,
                  avatar: '',
                  role: 'Event Organizer',
                },
              });
            }
          }
        } else {
          // Demo authentication pre-filled fallback
          get().login(email, email.split('@')[0]);
        }
        set({ authLoading: false });
        persistState();
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Login failed';
        set({ authLoading: false, authError: msg });
        return { success: false, error: msg };
      }
    },

    signupWithSupabase: async (email: string, password: string, fullName: string) => {
      set({ authLoading: true, authError: null });
      try {
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
            },
          });
          if (error) {
            set({ authLoading: false, authError: error.message });
            return { success: false, error: error.message };
          }
          if (data.session) {
            setApiAccessToken(data.session.access_token);
            try {
              const profile = await apiClient.getProfile();
              set({
                isAuthenticated: true,
                user: {
                  name: profile.fullName || fullName,
                  email: profile.email || email,
                  avatar: '',
                  role: 'Event Organizer',
                },
              });
            } catch {
              set({
                isAuthenticated: true,
                user: { name: fullName, email, avatar: '', role: 'Event Organizer' },
              });
            }
          } else {
            set({
              isAuthenticated: true,
              user: { name: fullName, email, avatar: '', role: 'Event Organizer' },
            });
          }
        } else {
          get().login(email, fullName);
        }
        set({ authLoading: false });
        persistState();
        return { success: true };
      } catch (err: any) {
        const msg = err.message || 'Signup failed';
        set({ authLoading: false, authError: msg });
        return { success: false, error: msg };
      }
    },

    logout: async () => {
      try {
        if (isSupabaseConfigured) {
          await supabase.auth.signOut();
        }
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
      setApiAccessToken(null);
      set({ isAuthenticated: false });
      persistState();
    },

    updateUserProfile: async (profileUpdates) => {
      set((s) => ({ user: { ...s.user, ...profileUpdates } }));
      persistState();
      try {
        await apiClient.updateProfile({
          fullName: profileUpdates.name,
          avatarUrl: profileUpdates.avatar,
          phoneNumber: profileUpdates.phoneNumber,
        });
      } catch (e) {
        console.warn('Backend updateProfile failed:', e);
      }
    },

    // Settings Slice
    theme: persisted?.theme || 'light',
    currency: persisted?.currency || 'INR',
    notificationsEnabled: persisted?.notificationsEnabled ?? true,
    setTheme: (theme) => {
      set({ theme });
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      persistState();
    },
    setCurrency: (currency) => {
      set({ currency });
      persistState();
    },
    setNotificationsEnabled: (notificationsEnabled) => {
      set({ notificationsEnabled });
      persistState();
    },

    // Events Slice
    events: persisted?.events || [INITIAL_WEDDING_EVENT],
    currentEventId: persisted?.currentEventId || 'evt-wedding-01',
    eventsLoading: false,
    eventsError: null,

    fetchUserEvents: async (params) => {
      set({ eventsLoading: true, eventsError: null });
      try {
        const data = await apiClient.getEvents(params);
        if (data && Array.isArray(data.events)) {
          const eventsList = data.events.length > 0 ? data.events : [INITIAL_WEDDING_EVENT];
          const nextEventId = data.events[0]?.id || 'evt-wedding-01';
          set({
            events: eventsList,
            currentEventId: nextEventId,
          });
          persistState();
          if (data.events[0]?.id) {
            get().fetchEventPlanningData(data.events[0].id);
          }
        }
      } catch (err: any) {
        console.warn('fetchUserEvents API call:', err);
        set({ eventsError: err.message });
      } finally {
        set({ eventsLoading: false });
      }
    },

    selectEvent: (id: string) => {
      set({ currentEventId: id });
      persistState();
      get().fetchEventPlanningData(id);
    },

    // Planning Data Fetching (Phase 3)
    planningLoading: false,
    planningError: null,

    fetchEventPlanningData: async (eventId: string) => {
      if (!eventId) return;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (!isUuid) {
        set({ planningLoading: false, planningError: null });
        return;
      }

      const token = await getApiAccessToken();
      if (!token) {
        set({ planningLoading: false, planningError: null });
        return;
      }

      set({ planningLoading: true, planningError: null });
      try {
        const [categories, expensesData, summary, guestsData, guestSummary, tasksData, timelineData] =
          await Promise.allSettled([
            apiClient.getBudgetCategories(eventId),
            apiClient.getExpenses(eventId),
            apiClient.getBudgetSummary(eventId),
            apiClient.getGuests(eventId),
            apiClient.getGuestSummary(eventId),
            apiClient.getTasks(eventId),
            apiClient.getTimeline(eventId),
          ]);

        set((s) => {
          const nextBudgets = { ...s.budgets };
          if (categories.status === 'fulfilled' && Array.isArray(categories.value)) {
            nextBudgets[eventId] = categories.value.map((c) => ({
              id: c.id,
              name: c.name,
              allocated: c.allocatedAmount,
              actual: c.actualSpent || 0,
              notes: c.description || '',
              color: c.color || undefined,
            }));
          }

          const nextExpenses = { ...s.expenses };
          if (expensesData.status === 'fulfilled' && expensesData.value?.expenses) {
            nextExpenses[eventId] = expensesData.value.expenses;
          }

          const nextBudgetSummaries = { ...s.budgetSummaries };
          if (summary.status === 'fulfilled' && summary.value) {
            nextBudgetSummaries[eventId] = summary.value;
          }

          const nextGuests = { ...s.guests };
          if (guestsData.status === 'fulfilled' && guestsData.value?.guests) {
            nextGuests[eventId] = guestsData.value.guests.map((g) => ({
              id: g.id,
              eventId: g.eventId,
              name: g.fullName,
              contact: g.email || g.phoneNumber || '',
              category: (g.guestCategory?.toLowerCase() as any) || 'other',
              accompanyingGuests: g.plusOneCount,
              rsvpStatus: (g.rsvpStatus === 'attending' ? 'confirmed' : g.rsvpStatus) as any,
              dietaryPreference: g.dietaryPreference || 'Standard',
              specialNeeds: '',
              notes: g.notes || '',
            }));
          }

          const nextGuestSummaries = { ...s.guestSummaries };
          if (guestSummary.status === 'fulfilled' && guestSummary.value) {
            nextGuestSummaries[eventId] = guestSummary.value;
          }

          const nextTasks = { ...s.tasks };
          if (tasksData.status === 'fulfilled' && tasksData.value?.tasks) {
            nextTasks[eventId] = tasksData.value.tasks.map((t) => ({
              id: t.id,
              eventId: t.eventId,
              title: t.title,
              description: t.description || '',
              category: 'General',
              dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
              priority: (t.priority === 'urgent' ? 'critical' : t.priority) as any,
              status: (t.status === 'todo' ? 'pending' : t.status) as any,
              dependencies: (t.dependencies || []).map((d) => d.taskId),
              assignedTo: t.assignedTo || undefined,
            }));
          }

          const nextTimeline = { ...s.timelineItems };
          if (timelineData.status === 'fulfilled' && Array.isArray(timelineData.value)) {
            nextTimeline[eventId] = timelineData.value;
          }

          return {
            budgets: nextBudgets,
            expenses: nextExpenses,
            budgetSummaries: nextBudgetSummaries,
            guests: nextGuests,
            guestSummaries: nextGuestSummaries,
            tasks: nextTasks,
            timelineItems: nextTimeline,
          };
        });
        persistState();
      } catch (err: any) {
        console.warn('fetchEventPlanningData error:', err);
        set({ planningError: err.message });
      } finally {
        set({ planningLoading: false });
      }
    },
    createEvent: (eventData) => {
      const newId = `evt-${Date.now()}`;
      const now = new Date().toISOString();
      const newEvent: EventModel = {
        ...eventData,
        id: newId,
        completionPercentage: 10,
        createdAt: now,
        updatedAt: now,
      };

      // Seed initial default budget categories based on budget
      const totalBudget = eventData.totalBudget;
      const defaultBudgetCategories: BudgetCategoryItem[] = [
        {
          id: `b-${Date.now()}-1`,
          name: 'Venue & Space Rental',
          allocated: Math.round(totalBudget * 0.3),
          actual: 0,
          notes: 'Estimated 30% allocation for venue reservation and setup.',
        },
        {
          id: `b-${Date.now()}-2`,
          name: 'Catering & Beverages',
          allocated: Math.round(totalBudget * 0.35),
          actual: 0,
          notes: 'Estimated 35% allocation for guest dining and bar.',
        },
        {
          id: `b-${Date.now()}-3`,
          name: 'Decorations & Styling',
          allocated: Math.round(totalBudget * 0.12),
          actual: 0,
          notes: 'Stage backdrop, centerpieces, floral arches.',
        },
        {
          id: `b-${Date.now()}-4`,
          name: 'Photography & Video',
          allocated: Math.round(totalBudget * 0.1),
          actual: 0,
          notes: 'Portraits, documentary capture, and video memories.',
        },
        {
          id: `b-${Date.now()}-5`,
          name: 'Entertainment & Music',
          allocated: Math.round(totalBudget * 0.05),
          actual: 0,
          notes: 'DJ, sound equipment, ambient music.',
        },
        {
          id: `b-${Date.now()}-6`,
          name: 'Contingency Fund',
          allocated: Math.round(totalBudget * 0.08),
          actual: 0,
          notes: 'Reserve buffer for unforeseen changes.',
        },
      ];

      // Default tasks
      const defaultTasks: TaskItem[] = [
        {
          id: `tsk-${Date.now()}-1`,
          eventId: newId,
          title: `Reserve ${newEvent.category} Venue`,
          description: 'Tour shortlist venues and secure contract with advance payment.',
          category: 'Venue',
          dueDate: newEvent.date,
          priority: 'critical',
          status: 'pending',
          dependencies: [],
        },
        {
          id: `tsk-${Date.now()}-2`,
          eventId: newId,
          title: 'Finalize Guest List & Send Invitations',
          description: `Compile addresses for ${newEvent.expectedGuests} expected guests.`,
          category: 'Guests',
          dueDate: newEvent.date,
          priority: 'high',
          status: 'pending',
          dependencies: [`tsk-${Date.now()}-1`],
        },
        {
          id: `tsk-${Date.now()}-3`,
          eventId: newId,
          title: 'Book Catering & Tasting Session',
          description: 'Taste food selections and confirm menu dietary options.',
          category: 'Catering',
          dueDate: newEvent.date,
          priority: 'critical',
          status: 'pending',
          dependencies: [`tsk-${Date.now()}-1`],
        },
      ];

      // Initial plan version
      const initialVersion: PlanVersion = {
        id: `ver-${Date.now()}`,
        versionNumber: 'v1.0',
        eventId: newId,
        timestamp: now,
        reason: 'Initial Event Plan Creation',
        changes: [
          {
            field: 'Initial Plan Creation',
            oldValue: 'N/A',
            newValue: 'v1.0 Created',
            impactDescription: `Plan initialized for ${newEvent.expectedGuests} guests with ${newEvent.totalBudget} budget.`,
          },
        ],
        totalBudget: newEvent.totalBudget,
        allocatedBudget: totalBudget,
        expectedGuests: newEvent.expectedGuests,
        eventDate: newEvent.date,
        notes: 'Initial generation from wizard.',
      };

      set((s) => ({
        events: [newEvent, ...s.events],
        currentEventId: newId,
        budgets: { ...s.budgets, [newId]: defaultBudgetCategories },
        tasks: { ...s.tasks, [newId]: defaultTasks },
        guests: { ...s.guests, [newId]: [] },
        vendors: { ...s.vendors, [newId]: [] },
        ideas: { ...s.ideas, [newId]: [] },
        aiMessages: {
          ...s.aiMessages,
          [newId]: [
            {
              id: `msg-${Date.now()}`,
              eventId: newId,
              sender: 'assistant',
              text: `Welcome to your intelligent planning space for ${newEvent.name}! I have generated your baseline timeline, budget allocations, and key milestones. How can I help you customize your celebration?`,
              timestamp: now,
              recommendations: [
                'Help me reduce my event expenses',
                'Suggest a better decoration theme',
                'What should I complete this week?',
              ],
            },
          ],
        },
        planVersions: { ...s.planVersions, [newId]: [initialVersion] },
      }));

      persistState();

      // Asynchronously persist to Supabase PostgreSQL via Express backend API
      apiClient
        .createEvent(eventData)
        .then((created) => {
          if (created && created.id) {
            set((s) => ({
              events: s.events.map((e) => (e.id === newId ? { ...e, ...created } : e)),
              currentEventId: s.currentEventId === newId ? created.id : s.currentEventId,
              budgets: { ...s.budgets, [created.id]: s.budgets[newId] || [] },
              tasks: { ...s.tasks, [created.id]: s.tasks[newId] || [] },
            }));
            persistState();
          }
        })
        .catch((err) => {
          console.warn('Backend createEvent sync:', err);
        });

      return newId;
    },

    createEventAsync: async (eventData) => {
      try {
        const created = await apiClient.createEvent(eventData);
        if (created && created.id) {
          const now = new Date().toISOString();
          const newEvent: EventModel = {
            ...eventData,
            id: created.id,
            createdAt: created.createdAt || now,
            updatedAt: created.updatedAt || now,
            completionPercentage: 0,
          };

          set((s) => ({
            events: [newEvent, ...s.events.filter((e) => e.id !== created.id && e.id !== 'evt-wedding-01')],
            currentEventId: created.id,
            budgets: { ...s.budgets, [created.id]: [] },
            tasks: { ...s.tasks, [created.id]: [] },
            guests: { ...s.guests, [created.id]: [] },
            vendors: { ...s.vendors, [created.id]: [] },
            ideas: { ...s.ideas, [created.id]: [] },
          }));
          persistState();

          // Persist baseline budget categories to Supabase PostgreSQL so they receive real database UUIDs
          const baselineCats = [
            {
              name: 'Venue & Staging',
              allocatedAmount: Math.round(eventData.totalBudget * 0.4),
              description: 'Ceremony & reception hall rental, lighting, and stage rigging.',
              color: '#4F46E5',
            },
            {
              name: 'Catering & Banquet',
              allocatedAmount: Math.round(eventData.totalBudget * 0.3),
              description: 'Buffet meals, welcome mocktails, live culinary counters, desserts.',
              color: '#10B981',
            },
            {
              name: 'Photography & Media',
              allocatedAmount: Math.round(eventData.totalBudget * 0.15),
              description: 'Candid photographer, cinematic videographer, and drone coverage.',
              color: '#F59E0B',
            },
            {
              name: 'Contingency & Buffer',
              allocatedAmount: Math.round(eventData.totalBudget * 0.15),
              description: 'Reserve buffer for unforeseen changes.',
              color: '#64748B',
            },
          ];

          for (const cat of baselineCats) {
            try {
              await apiClient.createBudgetCategory(created.id, cat);
            } catch (e) {
              console.warn('Initial category creation warning:', e);
            }
          }

          // Persist baseline tasks to Supabase PostgreSQL
          const baselineTasks = [
            {
              title: `Reserve ${newEvent.category} Venue`,
              description: 'Tour shortlist venues and secure contract with advance payment.',
              dueDate: newEvent.date,
              priority: 'urgent' as const,
              status: 'todo' as const,
            },
            {
              title: 'Finalize Guest List & Send Invitations',
              description: `Compile addresses for ${newEvent.expectedGuests} expected guests.`,
              dueDate: newEvent.date,
              priority: 'high' as const,
              status: 'todo' as const,
            },
            {
              title: 'Book Catering & Tasting Session',
              description: 'Taste food selections and confirm menu dietary options.',
              dueDate: newEvent.date,
              priority: 'urgent' as const,
              status: 'todo' as const,
            },
          ];

          for (const task of baselineTasks) {
            try {
              await apiClient.createTask(created.id, task);
            } catch (e) {
              console.warn('Initial task creation warning:', e);
            }
          }

          // Fetch all persisted planning data with real database UUIDs
          await get().fetchEventPlanningData(created.id);
          return created.id;
        }
      } catch (err: any) {
        console.warn('createEventAsync backend error:', err);
        set({ eventsError: err.message || 'Failed to create event in database' });
      }

      // Fallback to local creation if offline or unauthenticated
      const localId = get().createEvent(eventData);
      return localId;
    },

    updateEvent: (id, updates) => {
      set((s) => {
        const events = s.events.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        );
        return { events };
      });
      persistState();
      apiClient.updateEvent(id, updates).catch((err) => {
        console.warn('apiClient.updateEvent backend sync:', err);
      });
    },

    deleteEvent: (id) => {
      set((s) => {
        const remainingEvents = s.events.filter((e) => e.id !== id);
        // Cascade delete isolated event data, but NEVER delete community vendors!
        const nextBudgets = { ...s.budgets };
        delete nextBudgets[id];
        const nextTasks = { ...s.tasks };
        delete nextTasks[id];
        const nextGuests = { ...s.guests };
        delete nextGuests[id];
        const nextVendors = { ...s.vendors };
        delete nextVendors[id];
        const nextUserVendors = { ...s.userEventVendors };
        delete nextUserVendors[id];
        const nextIdeas = { ...s.ideas };
        delete nextIdeas[id];
        const nextAiMessages = { ...s.aiMessages };
        delete nextAiMessages[id];
        const nextPlanVersions = { ...s.planVersions };
        delete nextPlanVersions[id];

        return {
          events: remainingEvents,
          currentEventId: remainingEvents[0]?.id || '',
          budgets: nextBudgets,
          tasks: nextTasks,
          guests: nextGuests,
          vendors: nextVendors,
          userEventVendors: nextUserVendors,
          ideas: nextIdeas,
          aiMessages: nextAiMessages,
          planVersions: nextPlanVersions,
        };
      });
      persistState();
      apiClient.deleteEvent(id).catch((err) => {
        console.warn('apiClient.deleteEvent backend sync:', err);
      });
    },
    duplicateEvent: (id) => {
      const s = get();
      const original = s.events.find((e) => e.id === id);
      if (!original) return '';
      const newId = `evt-${Date.now()}`;
      const now = new Date().toISOString();
      const duplicatedEvent: EventModel = {
        ...original,
        id: newId,
        name: `Copy of ${original.name}`,
        createdAt: now,
        updatedAt: now,
      };

      // Clone budgets, tasks, guests, vendors, ideas, plan versions
      const origBudgets = (s.budgets[id] || []).map((b) => ({
        ...b,
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      }));
      const origTasks = (s.tasks[id] || []).map((t) => ({
        ...t,
        id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: newId,
      }));
      const origGuests = (s.guests[id] || []).map((g) => ({
        ...g,
        id: `gst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: newId,
      }));
      const origUserVendors = (s.userEventVendors[id] || []).map((v) => ({
        ...v,
        id: `uvnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: newId,
      }));
      const origIdeas = (s.ideas[id] || []).map((i) => ({
        ...i,
        id: `ida-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        eventId: newId,
      }));

      set((state) => ({
        events: [duplicatedEvent, ...state.events],
        budgets: { ...state.budgets, [newId]: origBudgets },
        tasks: { ...state.tasks, [newId]: origTasks },
        guests: { ...state.guests, [newId]: origGuests },
        userEventVendors: { ...state.userEventVendors, [newId]: origUserVendors },
        vendors: { ...state.vendors, [newId]: state.vendors[id] || [] },
        ideas: { ...state.ideas, [newId]: origIdeas },
        aiMessages: { ...state.aiMessages, [newId]: [] },
        planVersions: {
          ...state.planVersions,
          [newId]: [
            {
              id: `ver-${Date.now()}`,
              versionNumber: 'v1.0',
              eventId: newId,
              timestamp: now,
              reason: `Duplicated from ${original.name}`,
              changes: [
                {
                  field: 'Duplication',
                  oldValue: original.name,
                  newValue: duplicatedEvent.name,
                  impactDescription: 'Event duplicated with independent isolated data.',
                },
              ],
              totalBudget: duplicatedEvent.totalBudget,
              allocatedBudget: duplicatedEvent.totalBudget,
              expectedGuests: duplicatedEvent.expectedGuests,
              eventDate: duplicatedEvent.date,
              notes: 'Duplicated celebration plan.',
            },
          ],
        },
      }));
      persistState();
      return newId;
    },
    resetToDemoData: () => {
      set({
        events: [INITIAL_WEDDING_EVENT],
        currentEventId: 'evt-wedding-01',
        budgets: { 'evt-wedding-01': INITIAL_BUDGET_CATEGORIES },
        tasks: { 'evt-wedding-01': INITIAL_TASKS },
        vendors: { 'evt-wedding-01': INITIAL_VENDORS },
        communityVendors: INITIAL_COMMUNITY_VENDORS,
        userEventVendors: INITIAL_USER_EVENT_VENDORS,
        guests: { 'evt-wedding-01': INITIAL_GUESTS },
        ideas: { 'evt-wedding-01': INITIAL_IDEAS },
        aiMessages: { 'evt-wedding-01': INITIAL_AI_MESSAGES },
        planVersions: { 'evt-wedding-01': INITIAL_PLAN_VERSIONS },
      });
      persistState();
    },

    // Budget Slice
    budgets: persisted?.budgets || { 'evt-wedding-01': INITIAL_BUDGET_CATEGORIES },
    addBudgetCategory: async (eventId, category) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      const tempId = `b-${Date.now()}`;
      const newCategory: BudgetCategoryItem = {
        ...category,
        id: tempId,
      };
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: [...(s.budgets[eventId] || []), newCategory],
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) {
        return { id: tempId, eventId, name: category.name, allocatedAmount: category.allocated };
      }

      try {
        const res = await apiClient.createBudgetCategory(eventId, {
          name: category.name,
          allocatedAmount: category.allocated,
          description: category.notes || null,
        });
        if (res?.id) {
          set((s) => ({
            budgets: {
              ...s.budgets,
              [eventId]: (s.budgets[eventId] || []).map((b) =>
                b.id === tempId ? { ...b, id: res.id } : b
              ),
            },
          }));
        }
        await get().fetchEventPlanningData(eventId);
        return res;
      } catch (err: any) {
        console.warn('Backend createBudgetCategory sync:', err);
        // Rollback temporary category on failure
        set((s) => ({
          budgets: {
            ...s.budgets,
            [eventId]: (s.budgets[eventId] || []).filter((b) => b.id !== tempId),
          },
          planningError: err.message || 'Failed to save category to database',
        }));
        throw err;
      }
    },
    updateBudgetCategory: async (eventId, id, updates) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: (s.budgets[eventId] || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) return;

      try {
        await apiClient.updateBudgetCategory(eventId, id, {
          ...(updates.name && { name: updates.name }),
          ...(updates.allocated !== undefined && { allocatedAmount: updates.allocated }),
          ...(updates.notes !== undefined && { description: updates.notes }),
        });
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend updateBudgetCategory sync:', err);
        set({ planningError: err.message || 'Failed to update category in database' });
        throw err;
      }
    },
    deleteBudgetCategory: async (eventId, id) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: (s.budgets[eventId] || []).filter((b) => b.id !== id),
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) return;

      try {
        await apiClient.deleteBudgetCategory(eventId, id);
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend deleteBudgetCategory sync:', err);
        set({ planningError: err.message || 'Failed to delete category from database' });
        throw err;
      }
    },
    setBudgetCategories: (eventId, categories) => {
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: categories,
        },
      }));
      persistState();
    },

    // Expenses Slice (Phase 3)
    expenses: persisted?.expenses || {},
    budgetSummaries: persisted?.budgetSummaries || {},
    addExpense: async (eventId, expenseData) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      const tempId = `exp-${Date.now()}`;
      const newExp: ExpenseItem = {
        ...expenseData,
        id: tempId,
        eventId,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        expenses: {
          ...s.expenses,
          [eventId]: [newExp, ...(s.expenses[eventId] || [])],
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) return;

      try {
        const res = await apiClient.createExpense(eventId, {
          ...expenseData,
          categoryId: expenseData.categoryId || null,
          notes: expenseData.notes || null,
          description: expenseData.description || null,
        });
        if (res?.id) {
          set((s) => ({
            expenses: {
              ...s.expenses,
              [eventId]: (s.expenses[eventId] || []).map((e) =>
                e.id === tempId ? { ...e, id: res.id } : e
              ),
            },
          }));
        }
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend addExpense sync:', err);
        set({ planningError: err.message || 'Failed to save expense to database' });
      }
    },
    updateExpense: async (eventId, id, updates) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      set((s) => ({
        expenses: {
          ...s.expenses,
          [eventId]: (s.expenses[eventId] || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) return;

      try {
        await apiClient.updateExpense(eventId, id, updates);
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend updateExpense sync:', err);
        set({ planningError: err.message || 'Failed to update expense in database' });
      }
    },
    deleteExpense: async (eventId, id) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      set((s) => ({
        expenses: {
          ...s.expenses,
          [eventId]: (s.expenses[eventId] || []).filter((e) => e.id !== id),
        },
        planningError: null,
      }));
      persistState();
      if (!isUuid) return;
      try {
        await apiClient.deleteExpense(eventId, id);
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend deleteExpense sync:', err);
        set({ planningError: err.message || 'Failed to delete expense from database' });
      }
    },

    // Tasks Slice
    tasks: persisted?.tasks || { 'evt-wedding-01': INITIAL_TASKS },
    addTask: (eventId, task) => {
      const tempId = `tsk-${Date.now()}`;
      const newTask: TaskItem = {
        ...task,
        id: tempId,
        eventId,
      };
      set((s) => {
        const nextTasks = [...(s.tasks[eventId] || []), newTask];
        const completion = calculateCompletion(nextTasks);
        const updatedEvents = s.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...s.tasks, [eventId]: nextTasks },
          events: updatedEvents,
          planningError: null,
        };
      });
      persistState();
      apiClient
        .createTask(eventId, {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate || null,
          priority: task.priority === 'critical' ? 'urgent' : (task.priority as any),
          status: task.status === 'pending' ? 'todo' : (task.status as any),
          assignedTo: task.assignedTo || null,
        })
        .then((res) => {
          if (res?.id) {
            set((s) => ({
              tasks: {
                ...s.tasks,
                [eventId]: (s.tasks[eventId] || []).map((t) =>
                  t.id === tempId ? { ...t, id: res.id } : t
                ),
              },
            }));
          }
          return get().fetchEventPlanningData(eventId);
        })
        .catch((err) => {
          console.warn('Backend createTask sync:', err);
          set({ planningError: err.message || 'Failed to save task to database' });
        });
    },
    updateTask: (eventId, id, updates) => {
      set((s) => {
        const nextTasks = (s.tasks[eventId] || []).map((t) => (t.id === id ? { ...t, ...updates } : t));
        const completion = calculateCompletion(nextTasks);
        const updatedEvents = s.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...s.tasks, [eventId]: nextTasks },
          events: updatedEvents,
          planningError: null,
        };
      });
      persistState();
      apiClient
        .updateTask(eventId, id, {
          ...(updates.title && { title: updates.title }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
          ...(updates.priority && { priority: updates.priority === 'critical' ? 'urgent' : (updates.priority as any) }),
          ...(updates.status && { status: updates.status === 'pending' ? 'todo' : (updates.status as any) }),
          ...(updates.assignedTo !== undefined && { assignedTo: updates.assignedTo }),
        })
        .then(() => get().fetchEventPlanningData(eventId))
        .catch((err) => {
          console.warn('Backend updateTask sync:', err);
          set({ planningError: err.message || 'Failed to update task in database' });
        });
    },
    deleteTask: (eventId, id) => {
      set((s) => {
        const nextTasks = (s.tasks[eventId] || []).filter((t) => t.id !== id);
        const completion = calculateCompletion(nextTasks);
        const updatedEvents = s.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...s.tasks, [eventId]: nextTasks },
          events: updatedEvents,
          planningError: null,
        };
      });
      persistState();
      apiClient
        .deleteTask(eventId, id)
        .then(() => get().fetchEventPlanningData(eventId))
        .catch((err) => {
          console.warn('Backend deleteTask sync:', err);
          set({ planningError: err.message || 'Failed to delete task from database' });
        });
    },
    toggleTaskComplete: (eventId, id) => {
      const s = get();
      const currentTask = (s.tasks[eventId] || []).find((t) => t.id === id);
      const nextStatus: TaskStatus = currentTask?.status === 'completed' ? 'in_progress' : 'completed';

      set((state) => {
        const nextTasks = (state.tasks[eventId] || []).map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            };
          }
          return t;
        });
        const completion = calculateCompletion(nextTasks);
        const updatedEvents = state.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...state.tasks, [eventId]: nextTasks },
          events: updatedEvents,
          planningError: null,
        };
      });
      persistState();
      apiClient
        .updateTask(eventId, id, {
          status: nextStatus === 'completed' ? 'completed' : 'in_progress',
          overrideIncompletePrerequisites: true,
        })
        .then(() => get().fetchEventPlanningData(eventId))
        .catch((err) => {
          console.warn('Backend toggleTaskComplete sync:', err);
          set({ planningError: err.message || 'Failed to toggle task completion' });
        });
    },
    setTasks: (eventId, tasks) => {
      set((s) => {
        const completion = calculateCompletion(tasks);
        const updatedEvents = s.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...s.tasks, [eventId]: tasks },
          events: updatedEvents,
        };
      });
      persistState();
    },

    // Guests Slice
    guests: persisted?.guests || { 'evt-wedding-01': INITIAL_GUESTS },
    guestSummaries: persisted?.guestSummaries || {},
    addGuest: (eventId, guest) => {
      const tempId = `gst-${Date.now()}`;
      const newGuest: GuestItem = {
        ...guest,
        id: tempId,
        eventId,
      };
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: [...(s.guests[eventId] || []), newGuest],
        },
        planningError: null,
      }));
      persistState();
      apiClient
        .createGuest(eventId, {
          fullName: guest.name,
          email: guest.contact.includes('@') ? guest.contact : null,
          phoneNumber: !guest.contact.includes('@') ? guest.contact : null,
          guestCategory: guest.category,
          rsvpStatus: guest.rsvpStatus === 'confirmed' ? 'attending' : guest.rsvpStatus,
          plusOneAllowed: guest.accompanyingGuests > 0,
          plusOneCount: guest.accompanyingGuests,
          dietaryPreference: guest.dietaryPreference,
          notes: `${guest.tableNumber ? `[${guest.tableNumber}] ` : ''}${guest.specialNeeds || ''} ${guest.notes || ''}`.trim() || null,
        })
        .then((res) => {
          if (res?.id) {
            set((s) => ({
              guests: {
                ...s.guests,
                [eventId]: (s.guests[eventId] || []).map((g) =>
                  g.id === tempId ? { ...g, id: res.id } : g
                ),
              },
            }));
          }
          return get().fetchEventPlanningData(eventId);
        })
        .catch((err) => {
          console.warn('Backend createGuest sync:', err);
          set({ planningError: err.message || 'Failed to save guest to database' });
        });
    },
    updateGuest: (eventId, id, updates) => {
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: (s.guests[eventId] || []).map((g) => (g.id === id ? { ...g, ...updates } : g)),
        },
        planningError: null,
      }));
      persistState();
      const payload: Record<string, any> = {};
      if (updates.name) payload.fullName = updates.name;
      if (updates.contact !== undefined) {
        if (updates.contact.includes('@')) payload.email = updates.contact;
        else payload.phoneNumber = updates.contact;
      }
      if (updates.category) payload.guestCategory = updates.category;
      if (updates.rsvpStatus) payload.rsvpStatus = updates.rsvpStatus === 'confirmed' ? 'attending' : updates.rsvpStatus;
      if (updates.accompanyingGuests !== undefined) payload.plusOneCount = updates.accompanyingGuests;
      if (updates.dietaryPreference !== undefined) payload.dietaryPreference = updates.dietaryPreference;
      if (updates.notes !== undefined || updates.specialNeeds !== undefined) {
        payload.notes = `${updates.specialNeeds || ''} ${updates.notes || ''}`.trim();
      }

      apiClient
        .updateGuest(eventId, id, payload)
        .then(() => get().fetchEventPlanningData(eventId))
        .catch((err) => {
          console.warn('Backend updateGuest sync:', err);
          set({ planningError: err.message || 'Failed to update guest in database' });
        });
    },
    deleteGuest: (eventId, id) => {
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: (s.guests[eventId] || []).filter((g) => g.id !== id),
        },
        planningError: null,
      }));
      persistState();
      apiClient
        .deleteGuest(eventId, id)
        .then(() => get().fetchEventPlanningData(eventId))
        .catch((err) => {
          console.warn('Backend deleteGuest sync:', err);
          set({ planningError: err.message || 'Failed to delete guest from database' });
        });
    },

    // Timeline Activities Slice (Phase 3)
    timelineItems: persisted?.timelineItems || {},
    addTimelineItem: async (eventId, itemData) => {
      const tempId = `tl-${Date.now()}`;
      const newItem: TimelineActivityItem = {
        ...itemData,
        id: tempId,
        eventId,
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        timelineItems: {
          ...s.timelineItems,
          [eventId]: [...(s.timelineItems[eventId] || []), newItem],
        },
        planningError: null,
      }));
      persistState();
      try {
        const res = await apiClient.createTimelineItem(eventId, itemData);
        if (res?.id) {
          set((s) => ({
            timelineItems: {
              ...s.timelineItems,
              [eventId]: (s.timelineItems[eventId] || []).map((t) =>
                t.id === tempId ? { ...t, id: res.id } : t
              ),
            },
          }));
        }
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend addTimelineItem sync:', err);
        set({ planningError: err.message || 'Failed to save timeline activity to database' });
      }
    },
    updateTimelineItem: async (eventId, id, updates) => {
      set((s) => ({
        timelineItems: {
          ...s.timelineItems,
          [eventId]: (s.timelineItems[eventId] || []).map((t) => (t.id === id ? { ...t, ...updates } : t)),
        },
        planningError: null,
      }));
      persistState();
      try {
        await apiClient.updateTimelineItem(eventId, id, updates);
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend updateTimelineItem sync:', err);
        set({ planningError: err.message || 'Failed to update timeline activity in database' });
      }
    },
    deleteTimelineItem: async (eventId, id) => {
      set((s) => ({
        timelineItems: {
          ...s.timelineItems,
          [eventId]: (s.timelineItems[eventId] || []).filter((t) => t.id !== id),
        },
        planningError: null,
      }));
      persistState();
      try {
        await apiClient.deleteTimelineItem(eventId, id);
        await get().fetchEventPlanningData(eventId);
      } catch (err: any) {
        console.warn('Backend deleteTimelineItem sync:', err);
        set({ planningError: err.message || 'Failed to delete timeline activity from database' });
      }
    },

    // Vendors Slice
    vendors: persisted?.vendors || { 'evt-wedding-01': INITIAL_VENDORS },
    addVendor: (eventId, vendor) => {
      const newVendor: VendorItem = {
        ...vendor,
        id: `vnd-${Date.now()}`,
        eventId,
      };
      set((s) => ({
        vendors: {
          ...s.vendors,
          [eventId]: [...(s.vendors[eventId] || []), newVendor],
        },
      }));
      persistState();
    },
    updateVendor: (eventId, id, updates) => {
      set((s) => ({
        vendors: {
          ...s.vendors,
          [eventId]: (s.vendors[eventId] || []).map((v) => (v.id === id ? { ...v, ...updates } : v)),
        },
      }));
      persistState();
    },
    deleteVendor: (eventId, id) => {
      set((s) => ({
        vendors: {
          ...s.vendors,
          [eventId]: (s.vendors[eventId] || []).filter((v) => v.id !== id),
        },
      }));
      persistState();
    },

    // Community-Driven Vendors Slice
    communityVendors: persisted?.communityVendors || INITIAL_COMMUNITY_VENDORS,
    addCommunityVendor: (vendorData) => {
      const s = get();
      const normalizedName = vendorData.name.trim().toLowerCase();
      const normalizedCity = vendorData.city.trim().toLowerCase();
      const normalizedPhone = (vendorData.publicPhone || '').replace(/\D/g, '');

      // Check for possible duplicates
      const existingMatch = s.communityVendors.find((cv) => {
        const cvName = cv.name.trim().toLowerCase();
        const cvCity = cv.city.trim().toLowerCase();
        const cvPhone = (cv.publicPhone || '').replace(/\D/g, '');
        return (
          cvName === normalizedName ||
          (normalizedPhone && cvPhone && cvPhone === normalizedPhone) ||
          (cvName.includes(normalizedName) && cvCity === normalizedCity)
        );
      });

      if (existingMatch) {
        return { success: false, duplicate: existingMatch };
      }

      const newId = `cvnd-${Date.now()}`;
      const now = new Date().toISOString();
      const newVendor: CommunityVendor = {
        ...vendorData,
        id: newId,
        submittedAt: now,
        updatedAt: now,
        moderationStatus: 'pending_review',
        isDemoRecord: false,
        rating: 4.8,
      };

      set((state) => ({
        communityVendors: [newVendor, ...state.communityVendors],
      }));
      persistState();
      return { success: true, newVendor };
    },
    updateCommunityVendorStatus: (id, status) => {
      set((state) => ({
        communityVendors: state.communityVendors.map((v) =>
          v.id === id ? { ...v, moderationStatus: status, updatedAt: new Date().toISOString() } : v
        ),
      }));
      persistState();
    },

    // User Event Saved Vendors Slice (Private to event)
    userEventVendors: persisted?.userEventVendors || INITIAL_USER_EVENT_VENDORS,
    saveVendorToEvent: (eventId, vendor) => {
      const newEntry: UserEventVendor = {
        id: `uvnd-${Date.now()}`,
        eventId,
        vendorId: 'id' in vendor ? vendor.id : undefined,
        name: vendor.name || 'Vendor',
        category: vendor.category as any,
        city: vendor.city,
        publicPhone: vendor.publicPhone,
        website: vendor.website,
        reportedPrice: 'reportedQuotation' in vendor ? (vendor as CommunityVendor).reportedQuotation : (vendor as Partial<UserEventVendor>).reportedPrice,
        privateNotes: 'privateNotes' in vendor ? (vendor.privateNotes || '') : '',
        independentlyReceivedQuote: 'independentlyReceivedQuote' in vendor ? vendor.independentlyReceivedQuote : undefined,
        estimatedExpense: 'estimatedExpense' in vendor ? vendor.estimatedExpense : ('reportedQuotation' in vendor ? vendor.reportedQuotation : undefined),
        actualExpense: 'actualExpense' in vendor ? vendor.actualExpense : 0,
        bookingStatus: ('bookingStatus' in vendor && vendor.bookingStatus) ? vendor.bookingStatus as any : 'Interested',
        packageInclusions: vendor.packageInclusions,
        savedAt: new Date().toISOString(),
      };
      set((state) => ({
        userEventVendors: {
          ...state.userEventVendors,
          [eventId]: [newEntry, ...(state.userEventVendors[eventId] || [])],
        },
      }));
      persistState();
    },
    updateUserEventVendor: (eventId, id, updates) => {
      set((state) => ({
        userEventVendors: {
          ...state.userEventVendors,
          [eventId]: (state.userEventVendors[eventId] || []).map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        },
      }));
      persistState();
    },
    removeUserEventVendor: (eventId, id) => {
      set((state) => ({
        userEventVendors: {
          ...state.userEventVendors,
          [eventId]: (state.userEventVendors[eventId] || []).filter((v) => v.id !== id),
        },
      }));
      persistState();
    },

    // Ideas Slice
    ideas: persisted?.ideas || { 'evt-wedding-01': INITIAL_IDEAS },
    toggleSaveIdea: (eventId, id) => {
      set((s) => ({
        ideas: {
          ...s.ideas,
          [eventId]: (s.ideas[eventId] || []).map((idea) =>
            idea.id === id ? { ...idea, isSaved: !idea.isSaved } : idea
          ),
        },
      }));
      persistState();
    },

    // AI Messages Slice
    aiMessages: persisted?.aiMessages || { 'evt-wedding-01': INITIAL_AI_MESSAGES },
    addAIMessage: (eventId, message) => {
      const newMsg: AIMessage = {
        ...message,
        id: `msg-${Date.now()}`,
        eventId,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({
        aiMessages: {
          ...s.aiMessages,
          [eventId]: [...(s.aiMessages[eventId] || []), newMsg],
        },
      }));
      persistState();
    },
    clearAIChat: (eventId) => {
      set((s) => ({
        aiMessages: {
          ...s.aiMessages,
          [eventId]: [],
        },
      }));
      persistState();
    },

    // Plan Versions Slice
    planVersions: persisted?.planVersions || { 'evt-wedding-01': INITIAL_PLAN_VERSIONS },
    savePlanVersion: (eventId, versionData) => {
      const existing = get().planVersions[eventId] || [];
      const versionNumber = `v${existing.length + 1}.0`;
      const newVer: PlanVersion = {
        ...versionData,
        id: `ver-${Date.now()}`,
        versionNumber,
        eventId,
        timestamp: new Date().toISOString(),
      };
      set((s) => ({
        planVersions: {
          ...s.planVersions,
          [eventId]: [newVer, ...(s.planVersions[eventId] || [])],
        },
      }));
      persistState();
    },

    // Getters
    getCurrentEvent: () => {
      const s = get();
      return s.events.find((e) => e.id === s.currentEventId) || s.events[0];
    },
    getCurrentBudgets: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.budgets[eventId] || [];
    },
    getCurrentExpenses: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.expenses[eventId] || [];
    },
    getCurrentBudgetSummary: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.budgetSummaries[eventId];
    },
    getCurrentTasks: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.tasks[eventId] || [];
    },
    getCurrentGuests: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.guests[eventId] || [];
    },
    getCurrentGuestSummary: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.guestSummaries[eventId];
    },
    getCurrentTimeline: () => {
      const s = get();
      const currentEvent = s.events.find((e) => e.id === s.currentEventId) || s.events[0];
      const eventId = currentEvent?.id || s.currentEventId;
      return s.timelineItems[eventId] || [];
    },
    getCurrentVendors: () => {
      const s = get();
      return s.vendors[s.currentEventId] || [];
    },
    getCurrentUserEventVendors: (eventId?: string) => {
      const s = get();
      const targetId = eventId || s.currentEventId;
      return s.userEventVendors[targetId] || [];
    },
    getCommunityVendors: () => {
      const s = get();
      return s.communityVendors || [];
    },
    getCurrentIdeas: () => {
      const s = get();
      return s.ideas[s.currentEventId] || [];
    },
    getCurrentAIMessages: () => {
      const s = get();
      return s.aiMessages[s.currentEventId] || [];
    },
    getCurrentPlanVersions: () => {
      const s = get();
      return s.planVersions[s.currentEventId] || [];
    },
  };
});
