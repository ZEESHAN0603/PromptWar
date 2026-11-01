import { Event } from '@prisma/client';

export function formatEvent(event: Event) {
  const budgetNum = typeof event.budget === 'number' ? event.budget : Number(event.budget);
  const dateIso = event.date instanceof Date ? event.date.toISOString() : new Date(event.date).toISOString();
  const dateOnly = dateIso.split('T')[0];

  return {
    id: event.id,
    userId: event.userId,
    location: event.location,
    currency: event.currency,
    status: event.status,
    theme: event.theme,
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : new Date(event.createdAt).toISOString(),
    updatedAt: event.updatedAt instanceof Date ? event.updatedAt.toISOString() : new Date(event.updatedAt).toISOString(),

    // Phase 2 Specification fields
    eventName: event.name,
    eventType: event.type,
    eventDate: dateOnly,
    guestCount: event.guestCount,
    budget: budgetNum,
    description: event.description,

    // Frontend compatibility aliases
    name: event.name,
    category: event.type,
    date: dateOnly,
    expectedGuests: event.guestCount,
    totalBudget: budgetNum,
    occasionDescription: event.description || '',
    completionPercentage: 10,
    guestBreakdown: {
      adults: Math.round(event.guestCount * 0.8),
      children: Math.round(event.guestCount * 0.15),
      elderly: Math.round(event.guestCount * 0.05),
    },
    dietaryPreferences: ['Standard'],
    accessibilityRequirements: [],
    preferences: {
      atmosphere: event.theme || 'Classic & Elegant',
      style: event.theme || 'Modern',
      food: 'Standard catering',
      decoration: 'Celebration styling',
      photography: 'Documentary & portraits',
      entertainment: 'Celebration music',
      cultural: 'Traditional & contemporary',
    },
    priorities: {
      foodQuality: 4,
      guestExperience: 4,
      venue: 4,
      decoration: 3,
      photography: 3,
      entertainment: 3,
      accessibility: 3,
    },
    mustHaves: [],
    avoidances: [],
    preferredSpendingLevel: 'balanced',
  };
}

