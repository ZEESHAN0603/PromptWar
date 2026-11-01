import { Router } from 'express';
import {
  getAdminPendingContributionsHandler,
  reviewContributionHandler,
} from '../controllers/vendor.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

export const adminRouter = Router();

// Enforce authentication & admin role
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/vendor-contributions', getAdminPendingContributionsHandler);
adminRouter.post('/vendor-contributions/:id/review', reviewContributionHandler);

