import { z } from 'zod';

export const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Decoration',
  'Music/DJ',
  'Makeup & Hair',
  'Mehndi',
  'Planner',
  'Attire',
  'Transportation',
  'Other',
] as const;

export const RELATIONSHIP_TYPES = [
  'personally_used',
  'visited',
  'received_quote',
  'recommended',
  'found_elsewhere',
  'customer',
  'past_client',
  'acquaintance',
  'other',
] as const;

export const SELECTION_STATUSES = [
  'shortlisted',
  'contacted',
  'quoted',
  'hired',
  'rejected',
] as const;

export const CONTACT_STATUSES = [
  'not_contacted',
  'contacted',
  'meeting_scheduled',
  'proposal_received',
  'contract_signed',
] as const;

export const createVendorContributionSchema = z.object({
  name: z.string().min(2, 'Vendor business name must be at least 2 characters').max(100),
  category: z.string().min(2, 'Category is required'),
  description: z.string().max(2000).optional().nullable(),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().default('India'),
  address: z.string().max(300).optional().nullable(),
  publicPhone: z.string().max(25).optional().nullable(),
  publicEmail: z.string().email('Invalid email address format').optional().nullable(),
  websiteUrl: z.string().max(300).optional().nullable(),
  socialLinks: z.record(z.string()).optional().nullable(),
  serviceAreas: z.array(z.string()).optional().nullable(),
  eventTypes: z.array(z.string()).optional().nullable(),
  priceInformation: z
    .object({
      startingPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      priceRange: z.string().optional(),
      pricingModel: z.string().optional(),
      currency: z.string().optional().default('INR'),
    })
    .optional()
    .nullable(),
  relationshipType: z.enum(RELATIONSHIP_TYPES, {
    errorMap: () => ({ message: 'Invalid relationship type' }),
  }),
  sourceDescription: z.string().max(500).optional().nullable(),
  privateNotes: z.string().max(1000).optional().nullable(),
  consentConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Consent confirmation is mandatory to submit vendor details' }),
  }),
});

export const checkDuplicateVendorSchema = z.object({
  name: z.string().min(2, 'Name query must be at least 2 characters'),
  city: z.string().optional(),
  category: z.string().optional(),
  publicPhone: z.string().optional(),
  websiteUrl: z.string().optional(),
});

export const queryVendorsSchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(['name', 'rating', 'createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const adminReviewContributionSchema = z.object({
  action: z.enum(['approve', 'reject', 'suspend']),
  reviewNotes: z.string().max(1000).optional().nullable(),
});

export const createMyVendorSchema = z.object({
  vendorId: z.string().uuid('Vendor ID must be a valid UUID'),
  personalNotes: z.string().max(1000).optional().nullable(),
});

export const updateMyVendorSchema = z.object({
  personalNotes: z.string().max(1000).optional().nullable(),
});

export const createEventVendorSchema = z.object({
  vendorId: z.string().uuid('Vendor ID must be a valid UUID'),
  category: z.string().min(2).optional(),
  selectionStatus: z.enum(SELECTION_STATUSES).optional().default('shortlisted'),
  contactStatus: z.enum(CONTACT_STATUSES).optional().default('not_contacted'),
  estimatedCost: z.number().min(0).optional().default(0),
  actualCost: z.number().min(0).optional().nullable(),
  currency: z.string().optional().default('INR'),
  privateNotes: z.string().max(1000).optional().nullable(),
});

export const updateEventVendorSchema = z.object({
  category: z.string().min(2).optional(),
  selectionStatus: z.enum(SELECTION_STATUSES).optional(),
  contactStatus: z.enum(CONTACT_STATUSES).optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional().nullable(),
  currency: z.string().optional(),
  privateNotes: z.string().max(1000).optional().nullable(),
});

export const recommendationQuerySchema = z.object({
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

