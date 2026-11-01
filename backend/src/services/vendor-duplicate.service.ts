import { prisma } from '../config/database.js';

export interface DuplicateMatch {
  vendorId: string;
  name: string;
  category: string;
  city: string;
  matchReason: string;
  confidence: number; // 0 to 100
}

export interface DuplicateCheckResult {
  hasPotentialDuplicate: boolean;
  highestConfidence: number;
  matches: DuplicateMatch[];
}

export function normalizeVendorName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\b(pvt|ltd|events|decor|decors|caterers|catering|photography|studios|creations|services|enterprise)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

export function normalizeDomain(url?: string | null): string {
  if (!url) return '';
  return url
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim();
}

/**
 * Checks existing community vendors for potential duplicates based on
 * normalized name, city, phone number, and website domain.
 */
export async function detectPotentialDuplicates(params: {
  name: string;
  city?: string | null;
  category?: string | null;
  publicPhone?: string | null;
  websiteUrl?: string | null;
  excludeVendorId?: string;
}): Promise<DuplicateCheckResult> {
  const normName = normalizeVendorName(params.name);
  const normCity = params.city ? params.city.trim().toLowerCase() : '';
  const normPhone = normalizePhone(params.publicPhone);
  const normDomain = normalizeDomain(params.websiteUrl);

  // Fetch active/approved and pending vendors to detect existing entries
  const existingVendors = await prisma.communityVendor.findMany({
    where: {
      id: params.excludeVendorId ? { not: params.excludeVendorId } : undefined,
      status: { in: ['approved', 'pending'] },
    },
    select: {
      id: true,
      name: true,
      category: true,
      city: true,
      publicPhone: true,
      websiteUrl: true,
      status: true,
    },
  });

  const matches: DuplicateMatch[] = [];

  for (const v of existingVendors) {
    const vNormName = normalizeVendorName(v.name);
    const vNormCity = v.city ? v.city.trim().toLowerCase() : '';
    const vNormPhone = normalizePhone(v.publicPhone);
    const vNormDomain = normalizeDomain(v.websiteUrl);

    let matchScore = 0;
    const matchReasons: string[] = [];

    // 1. Phone Match
    if (normPhone && vNormPhone && normPhone === vNormPhone) {
      matchScore = Math.max(matchScore, 95);
      matchReasons.push('Matching verified phone number');
    }

    // 2. Domain Match
    if (normDomain && vNormDomain && normDomain === vNormDomain) {
      matchScore = Math.max(matchScore, 90);
      matchReasons.push('Matching official website domain');
    }

    // 3. Name Match + City Match
    if (normName && vNormName) {
      if (normName === vNormName) {
        if (normCity && vNormCity && normCity === vNormCity) {
          matchScore = Math.max(matchScore, 92);
          matchReasons.push(`Exact business name match in same city (${v.city})`);
        } else {
          matchScore = Math.max(matchScore, 65);
          matchReasons.push('Identical business name across regions');
        }
      } else if (normName.includes(vNormName) || vNormName.includes(normName)) {
        if (normCity && vNormCity && normCity === vNormCity) {
          matchScore = Math.max(matchScore, 75);
          matchReasons.push(`Similar business name in same city (${v.city})`);
        }
      }
    }

    if (matchScore >= 60) {
      matches.push({
        vendorId: v.id,
        name: v.name,
        category: v.category,
        city: v.city,
        matchReason: matchReasons.join(', '),
        confidence: matchScore,
      });
    }
  }

  // Sort descending by confidence
  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    hasPotentialDuplicate: matches.length > 0,
    highestConfidence: matches.length > 0 ? matches[0].confidence : 0,
    matches,
  };
}

