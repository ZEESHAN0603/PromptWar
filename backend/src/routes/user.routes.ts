import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const userRouter = Router();

// All user profile routes require authentication
userRouter.use(requireAuth);

userRouter.get('/me', UserController.getMe);
userRouter.patch('/me', UserController.updateMe);
userRouter.get('/me/events', UserController.getMyEvents);

