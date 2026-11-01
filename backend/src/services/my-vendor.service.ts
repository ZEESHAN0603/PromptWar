import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export async function saveVendorToMyVendors(
  userId: string,
  vendorId: string,
  personalNotes?: string | null
) {
  // Check if vendor exists and is approved
  const vendor = await prisma.communityVendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor || vendor.status !== 'approved') {
    throw ApiError.notFound('Community vendor not found or not active');
  }

  // Check if already in user's saved vendors
  const existing = await prisma.myVendor.findUnique({
    where: {
      userId_vendorId: {
        userId,
        vendorId,
      },
    },
  });

  if (existing) {
    throw ApiError.conflict('Vendor is already in your saved vendors list');
  }

  return prisma.myVendor.create({
    data: {
      userId,
      vendorId,
      personalNotes: personalNotes?.trim() || null,
    },
    include: {
      vendor: true,
    },
  });
}

export async function listUserSavedVendors(userId: string) {
  return prisma.myVendor.findMany({
    where: { userId },
    include: {
      vendor: true,
    },
    orderBy: { savedAt: 'desc' },
  });
}

export async function updateSavedVendorNotes(
  userId: string,
  id: string,
  personalNotes?: string | null
) {
  const existing = await prisma.myVendor.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw ApiError.notFound('Saved vendor bookmark not found');
  }

  return prisma.myVendor.update({
    where: { id },
    data: {
      personalNotes: personalNotes !== undefined ? personalNotes : existing.personalNotes,
    },
    include: {
      vendor: true,
    },
  });
}

export async function removeSavedVendor(userId: string, id: string) {
  const existing = await prisma.myVendor.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw ApiError.notFound('Saved vendor bookmark not found');
  }

  await prisma.myVendor.delete({
    where: { id },
  });

  return { success: true, message: 'Vendor removed from your saved list' };
}

