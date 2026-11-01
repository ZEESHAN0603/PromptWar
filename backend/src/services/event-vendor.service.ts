import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

async function verifyEventAccess(eventId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: userId } });
  const isAdmin = profile?.role === 'admin';
  const event = await prisma.event.findFirst({
    where: isAdmin ? { id: eventId } : { id: eventId, userId },
  });
  if (!event) {
    throw ApiError.notFound('Event not found or access denied');
  }
  return event;
}

export async function addVendorToEvent(
  eventId: string,
  userId: string,
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
  // 1. Verify event ownership or admin access
  const event = await verifyEventAccess(eventId, userId);

  // 2. Verify community vendor
  const vendor = await prisma.communityVendor.findUnique({
    where: { id: data.vendorId },
  });

  if (!vendor || vendor.status !== 'approved') {
    throw ApiError.notFound('Community vendor not found or not approved');
  }

  // 3. Check duplicate attachment
  const existing = await prisma.eventVendor.findUnique({
    where: {
      eventId_vendorId: {
        eventId,
        vendorId: data.vendorId,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict('Vendor is already assigned to this celebration event');
  }

  const category = data.category || vendor.category;

  return prisma.eventVendor.create({
    data: {
      eventId,
      vendorId: data.vendorId,
      category,
      selectionStatus: data.selectionStatus || 'shortlisted',
      contactStatus: data.contactStatus || 'not_contacted',
      estimatedCost: data.estimatedCost || 0,
      actualCost: data.actualCost !== undefined ? data.actualCost : null,
      currency: data.currency || event.currency || 'INR',
      privateNotes: data.privateNotes?.trim() || null,
    },
    include: {
      vendor: true,
      expenses: true,
    },
  });
}

export async function listEventVendors(eventId: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  return prisma.eventVendor.findMany({
    where: { eventId },
    include: {
      vendor: true,
      expenses: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateEventVendor(
  eventId: string,
  id: string,
  userId: string,
  data: {
    category?: string;
    selectionStatus?: string;
    contactStatus?: string;
    estimatedCost?: number;
    actualCost?: number | null;
    currency?: string;
    privateNotes?: string | null;
  }
) {
  await verifyEventAccess(eventId, userId);

  const eventVendor = await prisma.eventVendor.findFirst({
    where: { id, eventId },
  });

  if (!eventVendor) {
    throw ApiError.notFound('Event vendor record not found');
  }

  return prisma.eventVendor.update({
    where: { id },
    data: {
      category: data.category !== undefined ? data.category : eventVendor.category,
      selectionStatus: data.selectionStatus !== undefined ? data.selectionStatus : eventVendor.selectionStatus,
      contactStatus: data.contactStatus !== undefined ? data.contactStatus : eventVendor.contactStatus,
      estimatedCost: data.estimatedCost !== undefined ? data.estimatedCost : eventVendor.estimatedCost,
      actualCost: data.actualCost !== undefined ? data.actualCost : eventVendor.actualCost,
      currency: data.currency !== undefined ? data.currency : eventVendor.currency,
      privateNotes: data.privateNotes !== undefined ? data.privateNotes : eventVendor.privateNotes,
    },
    include: {
      vendor: true,
      expenses: true,
    },
  });
}

export async function deleteEventVendor(eventId: string, id: string, userId: string) {
  await verifyEventAccess(eventId, userId);

  const eventVendor = await prisma.eventVendor.findFirst({
    where: { id, eventId },
  });

  if (!eventVendor) {
    throw ApiError.notFound('Event vendor record not found');
  }

  await prisma.eventVendor.delete({
    where: { id },
  });

  return { success: true, message: 'Vendor removed from event workspace' };
}

