import { supabase } from './supabase';
import { EventModel } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

let memoryToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  memoryToken = token;
}

export async function getApiAccessToken(): Promise<string | null> {
  if (memoryToken) return memoryToken;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = await getApiAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

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

export const apiClient = {
  // User Profile
  async getProfile() {
    const res = await request<{
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
      phoneNumber: string | null;
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
};

