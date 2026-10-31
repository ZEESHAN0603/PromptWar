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

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AppStoreState {
  // Auth Slice
  user: UserProfile;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

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
  selectEvent: (id: string) => void;
  createEvent: (event: Omit<EventModel, 'id' | 'createdAt' | 'updatedAt' | 'completionPercentage'>) => string;
  updateEvent: (id: string, updates: Partial<EventModel>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string) => string;
  resetToDemoData: () => void;

  // Budget Slice
  budgets: Record<string, BudgetCategoryItem[]>; // Keyed by eventId
  addBudgetCategory: (eventId: string, category: Omit<BudgetCategoryItem, 'id'>) => void;
  updateBudgetCategory: (eventId: string, id: string, updates: Partial<BudgetCategoryItem>) => void;
  deleteBudgetCategory: (eventId: string, id: string) => void;
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

  // Helper getters
  getCurrentEvent: () => EventModel | undefined;
  getCurrentBudgets: () => BudgetCategoryItem[];
  getCurrentTasks: () => TaskItem[];
  getCurrentGuests: () => GuestItem[];
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
        tasks: state.tasks,
        guests: state.guests,
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
    },
    isAuthenticated: persisted?.isAuthenticated ?? true, // Default to demo auth logged in
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
    logout: () => {
      set({ isAuthenticated: false });
      persistState();
    },
    updateUserProfile: (profile) => {
      set((s) => ({ user: { ...s.user, ...profile } }));
      persistState();
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
    selectEvent: (id: string) => {
      set({ currentEventId: id });
      persistState();
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
      return newId;
    },
    updateEvent: (id, updates) => {
      set((s) => {
        const events = s.events.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        );
        return { events };
      });
      persistState();
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
    addBudgetCategory: (eventId, category) => {
      const newCategory: BudgetCategoryItem = {
        ...category,
        id: `b-${Date.now()}`,
      };
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: [...(s.budgets[eventId] || []), newCategory],
        },
      }));
      persistState();
    },
    updateBudgetCategory: (eventId, id, updates) => {
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: (s.budgets[eventId] || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
        },
      }));
      persistState();
    },
    deleteBudgetCategory: (eventId, id) => {
      set((s) => ({
        budgets: {
          ...s.budgets,
          [eventId]: (s.budgets[eventId] || []).filter((b) => b.id !== id),
        },
      }));
      persistState();
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

    // Tasks Slice
    tasks: persisted?.tasks || { 'evt-wedding-01': INITIAL_TASKS },
    addTask: (eventId, task) => {
      const newTask: TaskItem = {
        ...task,
        id: `tsk-${Date.now()}`,
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
        };
      });
      persistState();
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
        };
      });
      persistState();
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
        };
      });
      persistState();
    },
    toggleTaskComplete: (eventId, id) => {
      set((s) => {
        const nextTasks = (s.tasks[eventId] || []).map((t) => {
          if (t.id === id) {
            const nextStatus: TaskStatus = t.status === 'completed' ? 'in_progress' : 'completed';
            return {
              ...t,
              status: nextStatus,
              completedAt: nextStatus === 'completed' ? new Date().toISOString() : undefined,
            };
          }
          return t;
        });
        const completion = calculateCompletion(nextTasks);
        const updatedEvents = s.events.map((e) =>
          e.id === eventId ? { ...e, completionPercentage: completion } : e
        );
        return {
          tasks: { ...s.tasks, [eventId]: nextTasks },
          events: updatedEvents,
        };
      });
      persistState();
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
    addGuest: (eventId, guest) => {
      const newGuest: GuestItem = {
        ...guest,
        id: `gst-${Date.now()}`,
        eventId,
      };
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: [...(s.guests[eventId] || []), newGuest],
        },
      }));
      persistState();
    },
    updateGuest: (eventId, id, updates) => {
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: (s.guests[eventId] || []).map((g) => (g.id === id ? { ...g, ...updates } : g)),
        },
      }));
      persistState();
    },
    deleteGuest: (eventId, id) => {
      set((s) => ({
        guests: {
          ...s.guests,
          [eventId]: (s.guests[eventId] || []).filter((g) => g.id !== id),
        },
      }));
      persistState();
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
      return s.budgets[s.currentEventId] || [];
    },
    getCurrentTasks: () => {
      const s = get();
      return s.tasks[s.currentEventId] || [];
    },
    getCurrentGuests: () => {
      const s = get();
      return s.guests[s.currentEventId] || [];
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
