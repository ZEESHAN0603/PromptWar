import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  budgetCategoryRouter,
  expenseRouter,
  budgetSummaryRouter,
} from './budget.routes.js';
import { guestRouter, guestSummaryRouter } from './guest.routes.js';
import { taskRouter } from './task.routes.js';
import { timelineRouter } from './timeline.routes.js';
import {
  getEventRecommendationsHandler,
  listEventVendorsHandler,
  addEventVendorHandler,
  updateEventVendorHandler,
  deleteEventVendorHandler,
} from '../controllers/vendor.controller.js';
import {
  generateIdeasHandler,
  getEventIdeasHandler,
  getIdeaByIdHandler,
  saveIdeaHandler,
  removeSavedIdeaHandler,
  deleteIdeaHandler,
  toggleSaveIdeaHandler,
  createIdeaHandler,
} from '../controllers/idea.controller.js';
import { replanRouter, versionRouter } from './replan.routes.js';
import { generateIdeasRateLimiter } from '../middleware/rate-limit.middleware.js';

export const eventRouter = Router();

// All event operations require authentication
eventRouter.use(requireAuth);

// Core Event CRUD
eventRouter.post('/', EventController.createEvent);
eventRouter.get('/', EventController.listEvents);
eventRouter.get('/:eventId', EventController.getEventDetails);
eventRouter.patch('/:eventId', EventController.updateEvent);
eventRouter.delete('/:eventId', EventController.deleteEvent);

// Phase 3 Modules
// Budget Planner & Expenses (primary routes and path aliases)
eventRouter.use('/:eventId/budget-categories', budgetCategoryRouter);
eventRouter.use('/:eventId/budget/categories', budgetCategoryRouter);
eventRouter.use('/:eventId/expenses', expenseRouter);
eventRouter.use('/:eventId/budget/expenses', expenseRouter);
eventRouter.use('/:eventId/budget-summary', budgetSummaryRouter);
eventRouter.use('/:eventId/budget/summary', budgetSummaryRouter);

// Guest Management (primary routes and path aliases)
eventRouter.use('/:eventId/guests', guestRouter);
eventRouter.use('/:eventId/guest-summary', guestSummaryRouter);
eventRouter.use('/:eventId/guests/summary/stats', guestSummaryRouter);

// Tasks & Task Dependencies
eventRouter.use('/:eventId/tasks', taskRouter);

// Timeline Activities
eventRouter.use('/:eventId/timeline', timelineRouter);

// Phase 4: Vendor Recommendations & Event Vendor Selections
eventRouter.get('/:eventId/vendor-recommendations', getEventRecommendationsHandler);
eventRouter.get('/:eventId/recommendations/vendors', getEventRecommendationsHandler);
eventRouter.get('/:eventId/vendors', listEventVendorsHandler);
eventRouter.post('/:eventId/vendors', addEventVendorHandler);
eventRouter.patch('/:eventId/vendors/:id', updateEventVendorHandler);
eventRouter.delete('/:eventId/vendors/:id', deleteEventVendorHandler);

// Phase 5: Personalized Celebration Ideas Engine
eventRouter.post('/:eventId/ideas/generate', generateIdeasRateLimiter, generateIdeasHandler);
eventRouter.get('/:eventId/ideas', getEventIdeasHandler);
eventRouter.get('/:eventId/ideas/:id', getIdeaByIdHandler);
eventRouter.post('/:eventId/ideas/:id/save', saveIdeaHandler);
eventRouter.delete('/:eventId/ideas/:id/save', removeSavedIdeaHandler);
eventRouter.delete('/:eventId/ideas/:id', deleteIdeaHandler);
eventRouter.post('/:eventId/ideas', createIdeaHandler);
eventRouter.patch('/:eventId/ideas/:id/toggle-save', toggleSaveIdeaHandler);
eventRouter.post('/:eventId/ideas/:id/toggle-save', toggleSaveIdeaHandler);

// Phase 6: Adaptive Event Re-Planning Engine & Version History
eventRouter.use('/:eventId/replan', replanRouter);
eventRouter.use('/:eventId/versions', versionRouter);

