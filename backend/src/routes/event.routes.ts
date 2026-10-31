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
