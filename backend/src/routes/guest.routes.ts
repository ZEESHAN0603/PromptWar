import { Router } from 'express';
import { GuestController } from '../controllers/guest.controller.js';

export const guestRouter = Router({ mergeParams: true });
guestRouter.post('/', GuestController.createGuest);
guestRouter.get('/', GuestController.listGuests);
guestRouter.get('/:guestId', GuestController.getGuestById);
guestRouter.patch('/:guestId', GuestController.updateGuest);
guestRouter.delete('/:guestId', GuestController.deleteGuest);

export const guestSummaryRouter = Router({ mergeParams: true });
guestSummaryRouter.get('/', GuestController.getGuestSummary);

