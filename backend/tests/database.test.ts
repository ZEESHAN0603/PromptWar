import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkDatabaseHealth, disconnectDatabase, prisma } from '../src/config/database.js';

describe('Database Configuration & Health', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should report healthy when query succeeds', async () => {
    vi.spyOn(prisma, '$queryRaw').mockResolvedValueOnce([{ '?column?': 1 }]);

    const status = await checkDatabaseHealth();

    expect(status.connected).toBe(true);
    expect(typeof status.latencyMs).toBe('number');
    expect(status.error).toBeUndefined();
  });

  it('should report disconnected with error message when query fails', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(
      new Error('Connection refused at 5432')
    );

    const status = await checkDatabaseHealth();

    expect(status.connected).toBe(false);
    expect(status.error).toBe('Connection refused at 5432');
    expect(status.latencyMs).toBeUndefined();
  });

  it('should disconnect cleanly without throwing errors', async () => {
    vi.spyOn(prisma, '$disconnect').mockResolvedValueOnce();

    await expect(disconnectDatabase()).resolves.not.toThrow();
  });
});

