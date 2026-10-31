import { app } from './app.js';
import { env, getSanitizedEnv } from './config/env.js';
import { logger } from './config/logger.js';
import { disconnectDatabase } from './config/database.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      environment: env.NODE_ENV,
      config: getSanitizedEnv(env),
    },
    `🚀 EventPilot AI Backend started on http://localhost:${PORT}`
  );
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectDatabase();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after timeout if hanging
  setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Rejection at Promise');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception thrown');
  process.exit(1);
});

