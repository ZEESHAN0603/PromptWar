import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import {
  getUserContributionsHandler,
  listSavedVendorsHandler,
  saveVendorHandler,
  updateSavedVendorHandler,
  removeSavedVendorHandler,
} from '../controllers/vendor.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const userRouter = Router();

// All user profile routes require authentication
userRouter.use(requireAuth);

userRouter.get('/me', UserController.getMe);
userRouter.patch('/me', UserController.updateMe);
userRouter.get('/me/events', UserController.getMyEvents);

// Phase 4: User Vendor Contributions & Saved Vendors
userRouter.get('/me/vendor-contributions', getUserContributionsHandler);
userRouter.get('/me/saved-vendors', listSavedVendorsHandler);
userRouter.post('/me/saved-vendors', saveVendorHandler);
userRouter.patch('/me/saved-vendors/:id', updateSavedVendorHandler);
userRouter.delete('/me/saved-vendors/:id', removeSavedVendorHandler);


