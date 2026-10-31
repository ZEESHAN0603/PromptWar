import { Router } from 'express';
import { EventController } from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const eventRouter = Router();

// All event operations require authentication
eventRouter.use(requireAuth);

eventRouter.post('/', EventController.createEvent);
eventRouter.get('/', EventController.listEvents);
eventRouter.get('/:eventId', EventController.getEventDetails);
eventRouter.patch('/:eventId', EventController.updateEvent);
eventRouter.delete('/:eventId', EventController.deleteEvent);

