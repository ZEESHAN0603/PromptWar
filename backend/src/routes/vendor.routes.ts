import { Router } from 'express';
import {
  getVendorsHandler,
  getVendorByIdHandler,
  submitContributionHandler,
  checkDuplicatesHandler,
  listSavedVendorsHandler,
} from '../controllers/vendor.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const vendorRouter = Router();

// Public discovery
vendorRouter.get('/', getVendorsHandler);
vendorRouter.get('/check-duplicates', requireAuth, checkDuplicatesHandler);
vendorRouter.get('/saved', requireAuth, listSavedVendorsHandler);
vendorRouter.post('/contributions', requireAuth, submitContributionHandler);
vendorRouter.get('/:id', getVendorByIdHandler);

