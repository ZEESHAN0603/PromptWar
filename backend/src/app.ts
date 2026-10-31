import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/request-logger.middleware.js';
import { notFoundHandler } from './middleware/not-found.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { userRouter } from './routes/user.routes.js';
import { eventRouter } from './routes/event.routes.js';

export function createApp(): Application {
  const app: Application = express();

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging
  app.use(requestLogger);

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/users', userRouter);
  app.use('/api/events', eventRouter);

  // Root welcome / metadata route
  app.get('/', (_req, res) => {
    res.json({
      name: 'EventPilot AI Backend API',
      status: 'active',
      docs: '/api/docs (Planned)',
      health: '/api/health',
      version: '1.0.0',
    });
  });

  // 404 Not Found Catch-All Middleware
  app.use(notFoundHandler);

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  return app;
}

export const app = createApp();

