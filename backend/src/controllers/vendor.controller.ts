import { Request, Response, NextFunction } from 'express';
import {
  listCommunityVendors,
  getCommunityVendorById,
  submitVendorContribution,
  getUserVendorContributions,
  getAdminPendingContributions,
  reviewVendorContribution,
} from '../services/vendor.service.js';
import { detectPotentialDuplicates } from '../services/vendor-duplicate.service.js';
import { getRecommendationsForEvent } from '../services/vendor-recommendation.service.js';
import {
  saveVendorToMyVendors,
  listUserSavedVendors,
  updateSavedVendorNotes,
  removeSavedVendor,
} from '../services/my-vendor.service.js';
import {
  addVendorToEvent,
  listEventVendors,
  updateEventVendor,
  deleteEventVendor,
} from '../services/event-vendor.service.js';
import {
  createVendorContributionSchema,
  checkDuplicateVendorSchema,
  queryVendorsSchema,
  adminReviewContributionSchema,
  createMyVendorSchema,
  updateMyVendorSchema,
  createEventVendorSchema,
  updateEventVendorSchema,
  recommendationQuerySchema,
} from '../validators/vendor.validator.js';
import { ApiError } from '../utils/ApiError.js';
import { extractEventId, getParam } from '../utils/params.js';

// --- Community Vendor Discovery ---

export async function getVendorsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = queryVendorsSchema.parse(req.query);
    const result = await listCommunityVendors(query);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getVendorByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getParam(req, 'id');
    const vendor = await getCommunityVendorById(id);
    res.json({
      success: true,
      data: { vendor },
    });
  } catch (err) {
    next(err);
  }
}

// --- Customer Vendor Contributions ---

export async function submitContributionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const body = createVendorContributionSchema.parse(req.body);
    const result = await submitVendorContribution(userId, body);

    res.status(201).json({
      success: true,
      message: 'Vendor contribution submitted successfully for review',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkDuplicatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = checkDuplicateVendorSchema.parse(req.query);
    const result = await detectPotentialDuplicates(query);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserContributionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const contributions = await getUserVendorContributions(userId);
    res.json({
      success: true,
      data: { contributions },
    });
  } catch (err) {
    next(err);
  }
}

// --- Admin Review & Moderation ---

export async function getAdminPendingContributionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const contributions = await getAdminPendingContributions();
    res.json({
      success: true,
      data: { contributions },
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewContributionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const adminId = req.user?.id;
    if (!adminId) throw ApiError.unauthorized('Authentication required');

    const id = getParam(req, 'id');
    const { action, reviewNotes } = adminReviewContributionSchema.parse(req.body);

    const result = await reviewVendorContribution(adminId, id, action, reviewNotes);
    res.json({
      success: true,
      message: `Contribution has been successfully ${action}ed`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// --- My Saved Vendors ---

export async function listSavedVendorsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const savedVendors = await listUserSavedVendors(userId);
    res.json({
      success: true,
      data: { savedVendors },
    });
  } catch (err) {
    next(err);
  }
}

export async function saveVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const { vendorId, personalNotes } = createMyVendorSchema.parse(req.body);
    const saved = await saveVendorToMyVendors(userId, vendorId, personalNotes);

    res.status(201).json({
      success: true,
      message: 'Vendor saved to personal list',
      data: { savedVendor: saved },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSavedVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const id = getParam(req, 'id');
    const { personalNotes } = updateMyVendorSchema.parse(req.body);
    const updated = await updateSavedVendorNotes(userId, id, personalNotes);

    res.json({
      success: true,
      message: 'Personal notes updated',
      data: { savedVendor: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function removeSavedVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const id = getParam(req, 'id');
    const result = await removeSavedVendor(userId, id);
    res.json({
      success: true,
      message: 'Vendor removed from saved vendors',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// --- Recommendation Engine ---

export async function getEventRecommendationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const eventId = extractEventId(req.params);
    const query = recommendationQuerySchema.parse(req.query);

    const recommendations = await getRecommendationsForEvent(eventId, userId, query);
    res.json({
      success: true,
      data: { recommendations },
    });
  } catch (err) {
    next(err);
  }
}

// --- Event Vendor Management ---

export async function listEventVendorsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const eventId = extractEventId(req.params);
    const eventVendors = await listEventVendors(eventId, userId);

    res.json({
      success: true,
      data: { eventVendors },
    });
  } catch (err) {
    next(err);
  }
}

export async function addEventVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const eventId = extractEventId(req.params);
    const body = createEventVendorSchema.parse(req.body);

    const created = await addVendorToEvent(eventId, userId, body);
    res.status(201).json({
      success: true,
      message: 'Vendor assigned to event workspace',
      data: { eventVendor: created },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEventVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const eventId = extractEventId(req.params);
    const id = getParam(req, 'id');
    const body = updateEventVendorSchema.parse(req.body);

    const updated = await updateEventVendor(eventId, id, userId, body);
    res.json({
      success: true,
      message: 'Event vendor updated successfully',
      data: { eventVendor: updated },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEventVendorHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized('Authentication required');

    const eventId = extractEventId(req.params);
    const id = getParam(req, 'id');

    const result = await deleteEventVendor(eventId, id, userId);
    res.json({
      success: true,
      message: 'Vendor removed from event',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

