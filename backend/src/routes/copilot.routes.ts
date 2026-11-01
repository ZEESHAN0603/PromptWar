import { Router } from 'express';
import { CopilotController } from '../controllers/copilot.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { createRateLimiter } from '../middleware/rate-limit.middleware.js';

export const copilotRouter = Router();

// Rate limiter for Co-Pilot chat: 25 requests per minute per user/IP
const copilotChatRateLimiter = createRateLimiter(60 * 1000, 25);

// All Co-Pilot operations strictly require authentication
copilotRouter.use(requireAuth);

// Chat & AI interaction
copilotRouter.post('/chat', copilotChatRateLimiter, CopilotController.chat);

// Conversation management
copilotRouter.get('/conversations', CopilotController.listConversations);
copilotRouter.post('/conversations', CopilotController.createConversation);
copilotRouter.get('/conversations/:id', CopilotController.getConversation);
copilotRouter.delete('/conversations/:id', CopilotController.deleteConversation);

// Two-step confirmed action workflow
copilotRouter.post('/actions/preview', CopilotController.previewAction);
copilotRouter.post('/actions/confirm', CopilotController.confirmAction);

