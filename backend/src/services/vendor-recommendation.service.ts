import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export interface ScoreDetails {
  categoryMatch: { matched: boolean; score: number; maxScore: number };
  cityMatch: { matched: boolean; score: number; maxScore: number };
  serviceAreaMatch: { matched: boolean; score: number; maxScore: number };
  eventTypeMatch: { matched: boolean; score: number; maxScore: number };
  budgetMatch: {
    matched: boolean;
    score: number;
    maxScore: number;
    startingPrice?: number;
    budgetLimit?: number;
  };
}

export interface RecommendedVendorResult {
  vendor: any;
  score: number;
  scoreDetails: ScoreDetails;
  reasons: string[];
}

/**
 * Deterministic recommendation engine for event celebrations.
 * Evaluates approved community vendors against the event's location, category,
 * event type, and budget allocations.
 */
export async function getRecommendationsForEvent(
  eventId: string,
  userId: string,
  options: {
    category?: string;
    limit?: number;
  } = {}
): Promise<RecommendedVendorResult[]> {
  // 1. Fetch event and verify ownership (or admin privileges)
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';

  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
    include: {
      budgetCategories: true,
    },
  });

  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }

  // 2. Query approved community vendors
  const whereClause: any = {
    status: 'approved',
  };

  if (options.category) {
    whereClause.category = { equals: options.category, mode: 'insensitive' };
  }

  const vendors = await prisma.communityVendor.findMany({
    where: whereClause,
  });

  const eventCity = (event.location || '').split(',')[0].trim().toLowerCase();
  const eventType = (event.type || 'Wedding').trim().toLowerCase();
  const totalEventBudget = Number(event.budget) || 0;

  const results: RecommendedVendorResult[] = [];

  for (const vendor of vendors) {
    let totalScore = 0;
    const reasons: string[] = [];

    // Check relevant budget category allocation
    const targetCategoryName = options.category || vendor.category;
    const matchedCategory = event.budgetCategories.find(
      (c) => c.name.toLowerCase().includes(targetCategoryName.toLowerCase()) ||
             targetCategoryName.toLowerCase().includes(c.name.toLowerCase())
    );
    const categoryBudgetLimit = matchedCategory
      ? Number(matchedCategory.allocatedAmount)
      : totalEventBudget;

    // 1. Category Match (40 pts)
    const categoryMatched = options.category
      ? vendor.category.toLowerCase() === options.category.toLowerCase()
      : true; // if no category filter requested, full category baseline
    const categoryScore = categoryMatched ? 40 : 0;
    totalScore += categoryScore;
    if (categoryMatched) {
      reasons.push(`Specializes in ${vendor.category}`);
    }

    // 2. City Match (25 pts)
    const vendorCity = (vendor.city || '').trim().toLowerCase();
    const cityMatched = Boolean(eventCity && vendorCity && (eventCity.includes(vendorCity) || vendorCity.includes(eventCity)));
    const cityScore = cityMatched ? 25 : 0;
    totalScore += cityScore;
    if (cityMatched) {
      reasons.push(`Locally based in ${vendor.city}`);
    }

    // 3. Service Area Match (15 pts)
    let serviceAreaMatched = false;
    let serviceAreaScore = 0;
    if (!cityMatched && Array.isArray(vendor.serviceAreas)) {
      const areas = (vendor.serviceAreas as string[]).map((a) => String(a).toLowerCase());
      serviceAreaMatched = areas.some((a) => eventCity && (a.includes(eventCity) || eventCity.includes(a)));
      if (serviceAreaMatched) {
        serviceAreaScore = 15;
        totalScore += serviceAreaScore;
        reasons.push(`Serves your event location (${event.location})`);
      }
    } else if (cityMatched) {
      // If city matched directly, award service area points as well
      serviceAreaMatched = true;
      serviceAreaScore = 15;
      totalScore += serviceAreaScore;
    }

    // 4. Event Type Match (10 pts)
    let eventTypeMatched = false;
    let eventTypeScore = 0;
    if (Array.isArray(vendor.eventTypes)) {
      const types = (vendor.eventTypes as string[]).map((t) => String(t).toLowerCase());
      eventTypeMatched = types.some((t) => t.includes(eventType) || eventType.includes(t));
      if (eventTypeMatched) {
        eventTypeScore = 10;
        totalScore += eventTypeScore;
        reasons.push(`Experienced with ${event.type} celebrations`);
      }
    }

    // 5. Budget Compatibility Match (10 pts)
    let budgetMatched = false;
    let budgetScore = 0;
    const priceInfo = (vendor.priceInformation || {}) as any;
    const startingPrice = Number(priceInfo.startingPrice) || 0;

    if (startingPrice > 0 && categoryBudgetLimit > 0) {
      if (startingPrice <= categoryBudgetLimit) {
        budgetMatched = true;
        budgetScore = 10;
        totalScore += budgetScore;
        reasons.push('Starting pricing fits within your allocated budget');
      }
    } else if (startingPrice === 0) {
      // Flexible or unconstrained
      budgetMatched = true;
      budgetScore = 8;
      totalScore += budgetScore;
      reasons.push('Flexible pricing model suitable for diverse budgets');
    }

    results.push({
      vendor,
      score: totalScore,
      scoreDetails: {
        categoryMatch: { matched: categoryMatched, score: categoryScore, maxScore: 40 },
        cityMatch: { matched: cityMatched, score: cityScore, maxScore: 25 },
        serviceAreaMatch: { matched: serviceAreaMatched, score: serviceAreaScore, maxScore: 15 },
        eventTypeMatch: { matched: eventTypeMatched, score: eventTypeScore, maxScore: 10 },
        budgetMatch: {
          matched: budgetMatched,
          score: budgetScore,
          maxScore: 10,
          startingPrice: startingPrice > 0 ? startingPrice : undefined,
          budgetLimit: categoryBudgetLimit > 0 ? categoryBudgetLimit : undefined,
        },
      },
      reasons,
    });
  }

  // Sort descending by score, then by vendor rating, then name
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const bRating = Number(b.vendor.rating) || 0;
    const aRating = Number(a.vendor.rating) || 0;
    if (bRating !== aRating) return bRating - aRating;
    return a.vendor.name.localeCompare(b.vendor.name);
  });

  const limit = options.limit || 10;
  return results.slice(0, limit);
}

