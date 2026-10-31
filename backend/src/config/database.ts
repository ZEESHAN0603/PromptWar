import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

// Extend global namespace to prevent multiple PrismaClient instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface DatabaseHealthStatus {
  connected: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Checks database connection health by executing a lightweight query
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthStatus> {
  const start = Date.now();
  try {
    // $queryRaw is used here solely for connection verification
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    logger.warn({ error: message }, 'Database connection healthcheck failed');
    return {
      connected: false,
      error: message,
    };
  }
}

/**
 * Graceful database disconnection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database client disconnected');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting database client');
  }
}
