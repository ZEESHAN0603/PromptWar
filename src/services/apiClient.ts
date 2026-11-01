import { supabase } from './supabase';
import { EventModel } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

let memoryToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  memoryToken = token;
  if (token) {
    try {
      localStorage.setItem('eventpilot_api_token', token);
    } catch {}
  } else {
    try {
      localStorage.removeItem('eventpilot_api_token');
    } catch {}
  }
}

export async function getApiAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      memoryToken = data.session.access_token;
      try {
        localStorage.setItem('eventpilot_api_token', memoryToken);
      } catch {}
      return memoryToken;
    }

    try {
      const stored = localStorage.getItem('eventpilot_api_token');
      if (stored) {
        memoryToken = stored;
        return memoryToken;
      }
    } catch {}

    // Auto-authenticate with confirmed demo planner account if session is missing
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: 'aditi.planner@eventpilot.example.com',
      password: 'celebration2026',
    });
    if (signInData?.session?.access_token) {
      memoryToken = signInData.session.access_token;
      try {
        localStorage.setItem('eventpilot_api_token', memoryToken);
      } catch {}
      return memoryToken;
    }

    return null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  let token = await getApiAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401 Unauthorized, automatically refresh/re-authenticate and retry once
  if (response.status === 401) {
    setApiAccessToken(null);
    token = await getApiAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      response = await fetch(url, {
        ...options,
        headers,
      });
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      json.message ||
      (json.errors && json.errors.length > 0 ? json.errors[0].message : null) ||
      `HTTP ${response.status}: Request failed`;
    throw new Error(errorMessage);
  }

  return json;
}

export interface ApiBudgetCategory {
  id: string;
  eventId: string;
  name: string;
  allocatedAmount: number;
  actualSpent?: number;
  estimatedTotal?: number;
  expenseCount?: number;
  variance?: number;
  isOverspent?: boolean;
  description?: string | null;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiExpense {
  id: string;
  eventId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  title: string;
  description?: string | null;
  estimatedAmount: number;
  actualAmount?: number | null;
  expenseDate?: string | null;
  paymentStatus: 'pending' | 'partially_paid' | 'paid';
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiBudgetSummary {
  eventId: string;
  currency: string;
  totalBudget: number;
  totalAllocated: number;
  totalEstimatedExpenses: number;
  totalActualExpenses: number;
  remainingBudget: number;
  budgetUtilization: number;
  categoryBreakdown: Array<{
    id: string;
    name: string;
    color?: string | null;
    allocatedAmount: number;
    estimatedExpenses: number;
    actualExpenses: number;
    variance: number;
    isOverspent: boolean;
    expenseCount: number;
  }>;
  uncategorizedExpensesCount: number;
  warnings: string[];
}

export interface ApiGuest {
  id: string;
  eventId: string;
  fullName: string;
  email?: string | null;
  phoneNumber?: string | null;
  guestCategory?: string | null;
  rsvpStatus: 'pending' | 'invited' | 'attending' | 'declined' | 'confirmed';
  plusOneAllowed: boolean;
  plusOneCount: number;
  dietaryPreference?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiGuestSummary {
  eventId: string;
  totalGuests: number;
  attendingCount: number;
  declinedCount: number;
  pendingCount: number;
  invitedCount: number;
  totalPermittedPlusOnes: number;
  expectedAttendeesHeadcount: number;
  categoryBreakdown: Record<string, number>;
  dietaryBreakdown: Record<string, number>;
}

export interface ApiTask {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  assignedTo?: string | null;
  createdAt?: string;
  updatedAt?: string;
  dependencies?: Array<{
    dependencyId: string;
    taskId: string;
    title: string;
    status: string;
    priority?: string;
  }>;
  prerequisiteFor?: Array<{
    dependencyId: string;
    taskId: string;
    title: string;
    status: string;
  }>;
}

export interface ApiTimelineItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  location?: string | null;
  category?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export const apiClient = {
  // User Profile
  async getProfile() {
    const res = await request<{
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
      phoneNumber: string | null;
      role?: string | null;
    }>('/users/me');
    return res.data;
  },

  async updateProfile(updates: { fullName?: string; avatarUrl?: string; phoneNumber?: string }) {
    const res = await request<{
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
      phoneNumber: string | null;
    }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  // Events CRUD
  async getEvents(params: { page?: number; limit?: number; eventType?: string; status?: string; sortBy?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.eventType && params.eventType !== 'All') query.set('eventType', params.eventType);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/events${queryString ? `?${queryString}` : ''}`;

    const res = await request<{
      events: EventModel[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(endpoint);

    return res.data;
  },

  async getEventById(id: string) {
    const res = await request<EventModel>(`/events/${id}`);
    return res.data;
  },

  async createEvent(eventData: Partial<EventModel> & { name: string; date: string; location: string }) {
    const res = await request<EventModel>('/events', {
      method: 'POST',
      body: JSON.stringify({
        eventName: eventData.name,
        eventType: eventData.category || 'Wedding',
        eventDate: eventData.date,
        location: eventData.location,
        guestCount: eventData.expectedGuests || 0,
        budget: eventData.totalBudget || 0,
        currency: eventData.currency || 'INR',
        description: eventData.occasionDescription || '',
        theme: eventData.preferences?.style || '',
        status: eventData.status || 'planning',
      }),
    });
    return res.data;
  },

  async updateEvent(id: string, updates: Partial<EventModel>) {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.eventName = updates.name;
    if (updates.category !== undefined) payload.eventType = updates.category;
    if (updates.date !== undefined) payload.eventDate = updates.date;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.expectedGuests !== undefined) payload.guestCount = updates.expectedGuests;
    if (updates.totalBudget !== undefined) payload.budget = updates.totalBudget;
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.occasionDescription !== undefined) payload.description = updates.occasionDescription;
    if (updates.status !== undefined) payload.status = updates.status;

    const res = await request<EventModel>(`/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async deleteEvent(id: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // ==========================================
  // Phase 3: Budget Categories
  // ==========================================
  async getBudgetCategories(eventId: string) {
    const res = await request<ApiBudgetCategory[]>(`/events/${eventId}/budget-categories`);
    return res.data;
  },

  async createBudgetCategory(
    eventId: string,
    data: { name: string; allocatedAmount: number; description?: string | null; color?: string | null }
  ) {
    const res = await request<ApiBudgetCategory>(`/events/${eventId}/budget-categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateBudgetCategory(
    eventId: string,
    categoryId: string,
    updates: Partial<{ name: string; allocatedAmount: number; description?: string | null; color?: string | null }>
  ) {
    const res = await request<ApiBudgetCategory>(`/events/${eventId}/budget-categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteBudgetCategory(eventId: string, categoryId: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${eventId}/budget-categories/${categoryId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // ==========================================
  // Phase 3: Expenses
  // ==========================================
  async getExpenses(
    eventId: string,
    params: { categoryId?: string; paymentStatus?: string; page?: number; limit?: number; sortBy?: string } = {}
  ) {
    const query = new URLSearchParams();
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.paymentStatus && params.paymentStatus !== 'All') query.set('paymentStatus', params.paymentStatus);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/events/${eventId}/expenses${queryString ? `?${queryString}` : ''}`;
    const res = await request<{
      expenses: ApiExpense[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    return res.data;
  },

  async createExpense(
    eventId: string,
    data: {
      categoryId?: string | null;
      title: string;
      description?: string | null;
      estimatedAmount: number;
      actualAmount?: number | null;
      expenseDate?: string | null;
      paymentStatus?: 'pending' | 'partially_paid' | 'paid';
      notes?: string | null;
    }
  ) {
    const res = await request<ApiExpense>(`/events/${eventId}/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateExpense(
    eventId: string,
    expenseId: string,
    updates: Partial<{
      categoryId?: string | null;
      title: string;
      description?: string | null;
      estimatedAmount: number;
      actualAmount?: number | null;
      expenseDate?: string | null;
      paymentStatus?: 'pending' | 'partially_paid' | 'paid';
      notes?: string | null;
    }>
  ) {
    const res = await request<ApiExpense>(`/events/${eventId}/expenses/${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteExpense(eventId: string, expenseId: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${eventId}/expenses/${expenseId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // ==========================================
  // Phase 3: Budget Summary
  // ==========================================
  async getBudgetSummary(eventId: string) {
    const res = await request<ApiBudgetSummary>(`/events/${eventId}/budget-summary`);
    return res.data;
  },

  // ==========================================
  // Phase 3: Guests
  // ==========================================
  async getGuests(
    eventId: string,
    params: { search?: string; rsvpStatus?: string; guestCategory?: string; page?: number; limit?: number; sortBy?: string } = {}
  ) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.rsvpStatus && params.rsvpStatus !== 'All') query.set('rsvpStatus', params.rsvpStatus);
    if (params.guestCategory && params.guestCategory !== 'All') query.set('guestCategory', params.guestCategory);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/events/${eventId}/guests${queryString ? `?${queryString}` : ''}`;
    const res = await request<{
      guests: ApiGuest[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    return res.data;
  },

  async createGuest(
    eventId: string,
    data: {
      fullName: string;
      email?: string | null;
      phoneNumber?: string | null;
      guestCategory?: string | null;
      rsvpStatus?: string;
      plusOneAllowed?: boolean;
      plusOneCount?: number;
      dietaryPreference?: string | null;
      notes?: string | null;
    }
  ) {
    const res = await request<ApiGuest>(`/events/${eventId}/guests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateGuest(
    eventId: string,
    guestId: string,
    updates: Partial<{
      fullName: string;
      email?: string | null;
      phoneNumber?: string | null;
      guestCategory?: string | null;
      rsvpStatus?: string;
      plusOneAllowed?: boolean;
      plusOneCount?: number;
      dietaryPreference?: string | null;
      notes?: string | null;
    }>
  ) {
    const res = await request<ApiGuest>(`/events/${eventId}/guests/${guestId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteGuest(eventId: string, guestId: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${eventId}/guests/${guestId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async getGuestSummary(eventId: string) {
    const res = await request<ApiGuestSummary>(`/events/${eventId}/guest-summary`);
    return res.data;
  },

  // ==========================================
  // Phase 3: Tasks & Dependencies
  // ==========================================
  async getTasks(
    eventId: string,
    params: { status?: string; priority?: string; search?: string; page?: number; limit?: number; sortBy?: string } = {}
  ) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.priority && params.priority !== 'All') query.set('priority', params.priority);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/events/${eventId}/tasks${queryString ? `?${queryString}` : ''}`;
    const res = await request<{
      tasks: ApiTask[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(endpoint);
    return res.data;
  },

  async createTask(
    eventId: string,
    data: {
      title: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: string;
      status?: string;
      assignedTo?: string | null;
    }
  ) {
    const res = await request<ApiTask>(`/events/${eventId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateTask(
    eventId: string,
    taskId: string,
    updates: Partial<{
      title: string;
      description?: string | null;
      dueDate?: string | null;
      priority?: string;
      status?: string;
      assignedTo?: string | null;
      overrideIncompletePrerequisites?: boolean;
    }>
  ) {
    const res = await request<ApiTask>(`/events/${eventId}/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteTask(eventId: string, taskId: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${eventId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async createTaskDependency(eventId: string, taskId: string, dependsOnTaskId: string) {
    const res = await request<any>(`/events/${eventId}/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ dependsOnTaskId }),
    });
    return res.data;
  },

  async deleteTaskDependency(eventId: string, taskId: string, dependencyId: string) {
    const res = await request<{ id: string; deleted: boolean }>(
      `/events/${eventId}/tasks/${taskId}/dependencies/${dependencyId}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  // ==========================================
  // Phase 3: Timeline Activities
  // ==========================================
  async getTimeline(
    eventId: string,
    params: { category?: string; status?: string; sortBy?: string } = {}
  ) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.set('category', params.category);
    if (params.status && params.status !== 'All') query.set('status', params.status);
    if (params.sortBy) query.set('sortBy', params.sortBy);

    const queryString = query.toString();
    const endpoint = `/events/${eventId}/timeline${queryString ? `?${queryString}` : ''}`;
    const res = await request<ApiTimelineItem[]>(endpoint);
    return res.data;
  },

  async createTimelineItem(
    eventId: string,
    data: {
      title: string;
      description?: string | null;
      startTime: string;
      endTime?: string | null;
      location?: string | null;
      category?: string | null;
      status?: string;
    }
  ) {
    const res = await request<ApiTimelineItem>(`/events/${eventId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateTimelineItem(
    eventId: string,
    timelineItemId: string,
    updates: Partial<{
      title: string;
      description?: string | null;
      startTime: string;
      endTime?: string | null;
      location?: string | null;
      category?: string | null;
      status?: string;
    }>
  ) {
    const res = await request<ApiTimelineItem>(`/events/${eventId}/timeline/${timelineItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteTimelineItem(eventId: string, timelineItemId: string) {
    const res = await request<{ id: string; deleted: boolean }>(
      `/events/${eventId}/timeline/${timelineItemId}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  // ==========================================
  // PHASE 4: COMMUNITY VENDOR RECOMMENDATION
  // ==========================================

  async getVendors(params?: {
    category?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.city) query.set('city', params.city);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sort) query.set('sort', params.sort);
    if (params?.order) query.set('order', params.order);

    const queryString = query.toString();
    const res = await request<{ vendors: any[]; pagination: any }>(
      `/vendors${queryString ? `?${queryString}` : ''}`
    );
    return res.data;
  },

  async getVendorById(id: string) {
    const res = await request<{ vendor: any }>(`/vendors/${id}`);
    return res.data;
  },

  async checkVendorDuplicates(params: {
    name: string;
    city?: string;
    category?: string;
    publicPhone?: string;
    websiteUrl?: string;
  }) {
    const query = new URLSearchParams();
    query.set('name', params.name);
    if (params.city) query.set('city', params.city);
    if (params.category) query.set('category', params.category);
    if (params.publicPhone) query.set('publicPhone', params.publicPhone);
    if (params.websiteUrl) query.set('websiteUrl', params.websiteUrl);

    const res = await request<{
      hasPotentialDuplicate: boolean;
      highestConfidence: number;
      matches: any[];
    }>(`/vendors/check-duplicates?${query.toString()}`);
    return res.data;
  },

  async createVendorContribution(data: {
    name: string;
    category: string;
    description?: string | null;
    city: string;
    state?: string | null;
    country?: string;
    address?: string | null;
    publicPhone?: string | null;
    publicEmail?: string | null;
    websiteUrl?: string | null;
    socialLinks?: any;
    serviceAreas?: string[] | null;
    eventTypes?: string[] | null;
    priceInformation?: any;
    relationshipType: string;
    sourceDescription?: string | null;
    privateNotes?: string | null;
    consentConfirmed: boolean;
  }) {
    const res = await request<{ vendor: any; contribution: any; duplicateWarnings: any[] }>(
      '/vendors/contributions',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  async getUserVendorContributions() {
    const res = await request<{ contributions: any[] }>('/users/me/vendor-contributions');
    return res.data;
  },

  async getSavedVendors() {
    const res = await request<{ savedVendors: any[] }>('/users/me/saved-vendors');
    return res.data;
  },

  async saveVendor(data: { vendorId: string; personalNotes?: string | null }) {
    const res = await request<{ savedVendor: any }>('/users/me/saved-vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateSavedVendor(id: string, data: { personalNotes?: string | null }) {
    const res = await request<{ savedVendor: any }>(`/users/me/saved-vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async removeSavedVendor(id: string) {
    const res = await request<{ success: boolean; message: string }>(
      `/users/me/saved-vendors/${id}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  async getEventVendorRecommendations(
    eventId: string,
    params?: { category?: string; limit?: number }
  ) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const res = await request<{ recommendations: any[] }>(
      `/events/${eventId}/vendor-recommendations${queryString ? `?${queryString}` : ''}`
    );
    return res.data;
  },

  async getEventVendors(eventId: string) {
    const res = await request<{ eventVendors: any[] }>(`/events/${eventId}/vendors`);
    return res.data;
  },

  async addEventVendor(
    eventId: string,
    data: {
      vendorId: string;
      category?: string;
      selectionStatus?: string;
      contactStatus?: string;
      estimatedCost?: number;
      actualCost?: number | null;
      currency?: string;
      privateNotes?: string | null;
    }
  ) {
    const res = await request<{ eventVendor: any }>(`/events/${eventId}/vendors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateEventVendor(
    eventId: string,
    id: string,
    updates: {
      category?: string;
      selectionStatus?: string;
      contactStatus?: string;
      estimatedCost?: number;
      actualCost?: number | null;
      currency?: string;
      privateNotes?: string | null;
    }
  ) {
    const res = await request<{ eventVendor: any }>(`/events/${eventId}/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return res.data;
  },

  async deleteEventVendor(eventId: string, id: string) {
    const res = await request<{ success: boolean; message: string }>(
      `/events/${eventId}/vendors/${id}`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  async getAdminPendingContributions() {
    const res = await request<{ contributions: any[] }>('/admin/vendor-contributions');
    return res.data;
  },

  async reviewVendorContribution(
    id: string,
    data: { action: 'approve' | 'reject' | 'suspend'; reviewNotes?: string | null }
  ) {
    const res = await request<{ contribution: any; vendor: any }>(
      `/admin/vendor-contributions/${id}/review`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  // Phase 5: Personalized Celebration Ideas Engine
  async generateEventIdeas(
    eventId: string,
    data: {
      categories: string[];
      preferences?: {
        preferredColors?: string[];
        atmosphere?: string;
        venuePreference?: string;
        style?: string;
        dietaryPreferences?: string;
        culturalPreferences?: string;
        additionalNotes?: string;
      };
    }
  ) {
    const res = await request<{
      generationId: string;
      eventContext: any;
      ideas: any[];
      totalGenerated: number;
    }>(`/events/${eventId}/ideas/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getEventIdeas(eventId: string, params?: { category?: string; generationId?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.generationId) query.set('generationId', params.generationId);
    const queryString = query.toString();
    const res = await request<{ ideas: any[] }>(
      `/events/${eventId}/ideas${queryString ? `?${queryString}` : ''}`
    );
    return res.data;
  },

  async getEventIdeaById(eventId: string, ideaId: string) {
    const res = await request<{ idea: any }>(`/events/${eventId}/ideas/${ideaId}`);
    return res.data;
  },

  async saveEventIdea(eventId: string, ideaId: string) {
    const res = await request<{ idea: any }>(`/events/${eventId}/ideas/${ideaId}/save`, {
      method: 'POST',
    });
    return res.data;
  },

  async removeSavedEventIdea(eventId: string, ideaId: string) {
    const res = await request<{ idea: any }>(`/events/${eventId}/ideas/${ideaId}/save`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async deleteEventIdea(eventId: string, ideaId: string) {
    const res = await request<{ id: string; deleted: boolean }>(`/events/${eventId}/ideas/${ideaId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  async toggleSaveIdea(eventId: string, ideaId: string) {
    const res = await request<{ idea: any }>(
      `/events/${eventId}/ideas/${ideaId}/toggle-save`,
      { method: 'PATCH' }
    );
    return res.data;
  },

  async createEventIdea(eventId: string, data: any) {
    const res = await request<{ idea: any }>(
      `/events/${eventId}/ideas`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return res.data;
  },

  // Phase 6: Adaptive Event Re-Planning Engine
  async createReplanProposal(
    eventId: string,
    data: {
      changes: {
        budget?: { proposed: number };
        guestCount?: { proposed: number };
        eventDate?: { proposed: string };
      };
      reason?: string | null;
    }
  ) {
    const res = await request<any>(`/events/${eventId}/replan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getReplanProposal(eventId: string, proposalId: string) {
    const res = await request<any>(`/events/${eventId}/replan/${proposalId}`);
    return res.data;
  },

  async applyReplanProposal(
    eventId: string,
    proposalId: string,
    data: {
      approvedChanges: {
        budget: boolean;
        guestCount: boolean;
        eventDate: boolean;
      };
      approvedTaskChanges?: Array<{
        taskId: string;
        proposedDueDate: string;
      }>;
      approvedTimelineChanges?: Array<{
        timelineItemId: string;
        proposedStartTime: string;
      }>;
    }
  ) {
    const res = await request<any>(`/events/${eventId}/replan/${proposalId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async rejectReplanProposal(eventId: string, proposalId: string) {
    const res = await request<any>(`/events/${eventId}/replan/${proposalId}/reject`, {
      method: 'POST',
    });
    return res.data;
  },

  async getPlanVersions(eventId: string) {
    const res = await request<{ versions: any[] }>(`/events/${eventId}/versions`);
    return res.data.versions;
  },

  async getPlanVersionById(eventId: string, versionId: string) {
    const res = await request<any>(`/events/${eventId}/versions/${versionId}`);
    return res.data;
  },

  async comparePlanVersions(eventId: string, fromVersionId: string, toVersionId: string) {
    const res = await request<any>(
      `/events/${eventId}/versions/compare?from=${encodeURIComponent(fromVersionId)}&to=${encodeURIComponent(toVersionId)}`
    );
    return res.data;
  },
};
