import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { GenerateIdeasInput } from '../validators/idea.validator.js';
import { geminiService, EventPromptContext } from './gemini.service.js';

export interface IdeaInput {
  title: string;
  description: string;
  category: string;
  estimatedBudgetRange: string;
  matchReason: string;
  alternatives?: string[];
  tags?: string[];
  content?: any;
  generationId?: string;
}

/**
 * Verifies event ownership or admin privilege and returns the verified event.
 */
async function verifyEventAccess(eventId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
  });

  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }

  return { event, isAdmin };
}

/**
 * Formats estimated budget range string from Gemini cost object.
 */
function formatBudgetRange(costObj: any, currency: string): string {
  if (!costObj) return 'Estimate on request';
  if (costObj.min != null && costObj.max != null) {
    const curr = costObj.currency || currency || 'INR';
    return `${curr} ${Number(costObj.min).toLocaleString()} – ${Number(costObj.max).toLocaleString()}`;
  }
  if (costObj.min != null) {
    const curr = costObj.currency || currency || 'INR';
    return `From ${curr} ${Number(costObj.min).toLocaleString()}`;
  }
  return costObj.basis || 'Custom estimate';
}

/**
 * Generates personalized celebration ideas via Gemini AI, validates output,
 * persists recommendations into Supabase, and preserves past generations.
 */
export async function generateIdeasForEvent(
  eventId: string,
  userId: string,
  input: GenerateIdeasInput
) {
  const { event } = await verifyEventAccess(eventId, userId);

  const eventContext: EventPromptContext = {
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date,
    location: event.location,
    guestCount: event.guestCount,
    budget: Number(event.budget) || 0,
    currency: event.currency || 'INR',
    theme: event.theme,
    description: event.description,
  };

  // Call Gemini through backend service
  const aiResult = await geminiService.generateCelebrationIdeas(eventContext, input);

  const generationId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createdIdeas: any[] = [];

  for (const categoryGroup of aiResult.categories) {
    const categoryName = categoryGroup.category.toLowerCase().trim();

    for (const idea of categoryGroup.ideas) {
      const budgetRange = formatBudgetRange(idea.estimatedCost, event.currency);

      const created = await prisma.personalizedIdea.create({
        data: {
          eventId: event.id,
          title: idea.title,
          description: idea.description,
          category: categoryName,
          estimatedBudgetRange: budgetRange,
          matchReason: idea.reason,
          alternatives: idea.alternatives || [],
          tags: idea.colorPalette || [],
          content: {
            ...idea,
            colorPalette: idea.colorPalette || [],
            implementationTips: idea.implementationTips || [],
            budgetSuitability: idea.budgetSuitability,
            estimatedCost: idea.estimatedCost,
          },
          generationId,
          isSaved: false,
        },
      });

      createdIdeas.push(created);
    }
  }

  return {
    generationId,
    eventContext: {
      eventId: event.id,
      name: event.name,
      type: event.type,
      budget: Number(event.budget),
      guestCount: event.guestCount,
      currency: event.currency,
    },
    ideas: createdIdeas,
    totalGenerated: createdIdeas.length,
  };
}

/**
 * Retrieve personalized ideas for an event celebration.
 * Supports filtering by category and bookmarked status.
 */
export async function getEventIdeas(
  eventId: string,
  userId: string,
  category?: string,
  generationId?: string
) {
  await verifyEventAccess(eventId, userId);

  const whereClause: any = { eventId };

  if (generationId) {
    whereClause.generationId = generationId;
  }

  const ideas = await prisma.personalizedIdea.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
  });

  // Category filter
  if (category && category !== 'all') {
    if (category.toLowerCase() === 'saved') {
      return ideas.filter((idea) => idea.isSaved === true);
    }
    return ideas.filter(
      (idea) => idea.category.toLowerCase() === category.toLowerCase()
    );
  }

  return ideas;
}

/**
 * Retrieve a single personalized idea by ID with ownership verification.
 */
export async function getIdeaById(eventId: string, ideaId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized celebration idea not found');
  }

  return idea;
}

/**
 * Save an idea as favorite / bookmarked (POST /:id/save).
 */
export async function saveIdea(eventId: string, ideaId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized celebration idea not found');
  }

  const updated = await prisma.personalizedIdea.update({
    where: { id: ideaId },
    data: { isSaved: true },
  });

  return updated;
}

/**
 * Remove an idea from favorites (DELETE /:id/save).
 */
export async function removeSavedIdea(eventId: string, ideaId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized celebration idea not found');
  }

  const updated = await prisma.personalizedIdea.update({
    where: { id: ideaId },
    data: { isSaved: false },
  });

  return updated;
}

/**
 * Delete an idea with event ownership verification (DELETE /:id).
 */
export async function deleteIdea(eventId: string, ideaId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized celebration idea not found');
  }

  await prisma.personalizedIdea.delete({
    where: { id: ideaId },
  });

  return {
    id: ideaId,
    deleted: true,
  };
}

/**
 * Toggle saved/bookmarked status of an idea (backward compatibility).
 */
export async function toggleSaveIdea(eventId: string, ideaId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized celebration idea not found');
  }

  const updated = await prisma.personalizedIdea.update({
    where: { id: ideaId },
    data: { isSaved: !idea.isSaved },
  });

  return updated;
}

/**
 * Create a new custom or manually submitted idea.
 */
export async function createIdea(eventId: string, userId: string, data: IdeaInput) {
  await verifyEventAccess(eventId, userId);

  const idea = await prisma.personalizedIdea.create({
    data: {
      eventId,
      title: data.title,
      description: data.description,
      category: data.category,
      estimatedBudgetRange: data.estimatedBudgetRange || 'Custom',
      matchReason: data.matchReason || 'Matches your celebration vibe',
      alternatives: data.alternatives || [],
      tags: data.tags || [],
      content: data.content || null,
      generationId: data.generationId || null,
      isSaved: false,
    },
  });

  return idea;
}
