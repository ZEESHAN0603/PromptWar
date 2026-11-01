import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export interface IdeaInput {
  title: string;
  description: string;
  category: string;
  estimatedBudgetRange: string;
  matchReason: string;
  alternatives?: string[];
  tags?: string[];
}

/**
 * Default personalized ideas template generator for events without ideas.
 */
function generateDefaultIdeasForEvent(event: any): IdeaInput[] {
  const eventType = event.type || 'Wedding';
  const city = (event.location || 'Bengaluru').split(',')[0].trim();
  const theme = event.theme || 'Classic & Elegant';

  return [
    {
      title: 'Twilight Botanical Fairy-Light Canopy',
      description: `Suspended warm Edison fairy bulbs interwoven with fresh eucalyptus and fragrant rajnigandha vines over the open lawn dining zone in ${city}.`,
      category: 'decor',
      estimatedBudgetRange: '₹35,000 – ₹55,000',
      matchReason: `Matches your ${theme} atmosphere while creating high-impact sunset photo backdrops for ${event.guestCount || 150} guests.`,
      alternatives: ['Bistro filament bulb strings with bamboo lantern clusters (₹22,000 budget option)'],
      tags: ['Eco-friendly', 'Romantic', 'Evening'],
    },
    {
      title: 'Live Chaat & Artisanal Kulhad Chai Bar',
      description: 'Interactive live street-food stations featuring Dahi Puri shots, freshly roasted Banarasi Paan, and steaming saffron masala chai served in terracotta kulhads.',
      category: 'food',
      estimatedBudgetRange: '₹25,000 – ₹38,000',
      matchReason: 'Perfect for the sunset transition before dinner, delighting both elderly guests and children with authentic live experiences.',
      alternatives: ['Pre-packaged savory canapés tray-passed by servers'],
      tags: ['Crowd-pleaser', 'Interactive', 'Traditional'],
    },
    {
      title: 'Acoustic Sitar & Handpan Fusion Ensemble',
      description: `A 3-piece contemporary instrumental trio playing soothing acoustic interpretations of classic melodies during the ${eventType.toLowerCase()} banquet dinner hour.`,
      category: 'entertainment',
      estimatedBudgetRange: '₹20,000 – ₹30,000',
      matchReason: 'Elevates banquet ambiance without drowning out family conversations and networking.',
      alternatives: ['Curated vintage jazz & acoustic instrumental digital playlist (₹0 budget option)'],
      tags: ['Acoustic', 'Low-decibel', 'Sophisticated'],
    },
    {
      title: 'Instant Retro Polaroid Guestbook Table',
      description: 'Vintage brass camera station where guests snap portraits, stick them in a custom leather album, and write handwritten wishes with metallic gel pens.',
      category: 'activities',
      estimatedBudgetRange: '₹8,000 – ₹12,000',
      matchReason: 'Creates a deeply cherished personal family keepsake without requiring extra event staff.',
      alternatives: ['Digital QR code audio guestbook recorded on smartphones'],
      tags: ['Keepsake', 'Interactive', 'Memories'],
    },
    {
      title: 'Heritage Brass Urli Floating Blossom Pathway',
      description: 'Handcrafted antiqued brass urlis filled with fresh rose petals, marigolds, and floating wax candles lining the entrance pathway.',
      category: 'decor',
      estimatedBudgetRange: '₹15,000 – ₹24,000',
      matchReason: `Delivers an opulent traditional grand arrival sequence tailored for ${city} venues.`,
      alternatives: ['Terracotta floral diya bowls (₹7,500 budget option)'],
      tags: ['Traditional', 'Grand Arrival', 'Aesthetic'],
    },
    {
      title: 'Artisanal Dessert & Paan Gelato Station',
      description: 'Handcrafted fusion gelato cart serving gulkand paan, Alphonso mango kulfi, and dark chocolate cardamom scoops.',
      category: 'food',
      estimatedBudgetRange: '₹18,000 – ₹28,000',
      matchReason: 'Memorable sweet finale that doubles as a fun interactive dessert station.',
      alternatives: ['Plated traditional mini-pastry dessert spread'],
      tags: ['Gourmet', 'Interactive', 'Modern'],
    },
  ];
}

/**
 * Retrieve personalized ideas for an event celebration.
 * Auto-seeds tailored ideas if none exist yet.
 */
export async function getEventIdeas(eventId: string, userId: string, category?: string) {
  // Verify event access
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
  });

  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }

  // Check if ideas already exist for this event
  let existingIdeas = await prisma.personalizedIdea.findMany({
    where: { eventId },
    orderBy: { createdAt: 'asc' },
  });

  // If no ideas exist yet, auto-seed tailored concepts
  if (existingIdeas.length === 0) {
    const templates = generateDefaultIdeasForEvent(event);
    for (const t of templates) {
      await prisma.personalizedIdea.create({
        data: {
          eventId,
          title: t.title,
          description: t.description,
          category: t.category,
          estimatedBudgetRange: t.estimatedBudgetRange,
          matchReason: t.matchReason,
          alternatives: t.alternatives || [],
          tags: t.tags || [],
          isSaved: t.category === 'decor' || t.category === 'food',
        },
      });
    }

    existingIdeas = await prisma.personalizedIdea.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Filter by category if requested
  if (category && category !== 'all') {
    return existingIdeas.filter(
      (idea) => idea.category.toLowerCase() === category.toLowerCase()
    );
  }

  return existingIdeas;
}

/**
 * Toggle saved/bookmarked status of an idea.
 */
export async function toggleSaveIdea(eventId: string, ideaId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
  });

  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }

  const idea = await prisma.personalizedIdea.findFirst({
    where: { id: ideaId, eventId },
  });

  if (!idea) {
    throw ApiError.notFound('Personalized idea not found');
  }

  const updated = await prisma.personalizedIdea.update({
    where: { id: ideaId },
    data: { isSaved: !idea.isSaved },
  });

  return updated;
}

/**
 * Create a new custom or AI idea.
 */
export async function createIdea(eventId: string, userId: string, data: IdeaInput) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
  });

  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }

  const idea = await prisma.personalizedIdea.create({
    data: {
      eventId,
      title: data.title,
      description: data.description,
      category: data.category,
      estimatedBudgetRange: data.estimatedBudgetRange || '₹10,000 – ₹25,000',
      matchReason: data.matchReason || 'Matches your celebration vibe',
      alternatives: data.alternatives || [],
      tags: data.tags || [],
      isSaved: false,
    },
  });

  return idea;
}

