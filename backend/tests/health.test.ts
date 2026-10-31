import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import * as dbModule from '../src/config/database.js';

describe('Health Endpoints', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return HTTP 200 with standard response structure', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'EventPilot AI backend is running',
        data: {
          status: 'healthy',
          service: 'eventpilot-backend',
          version: '1.0.0',
        },
      });
    });
  });

  describe('GET /api/health/db', () => {
    it('should return 200 when database connectivity check succeeds', async () => {
      vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        connected: true,
        latencyMs: 12,
      });

      const response = await request(app).get('/api/health/db');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(true);
      expect(response.body.data.latencyMs).toBe(12);
    });

    it('should return 503 when database connectivity fails', async () => {
      vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        connected: false,
        error: 'Connection timeout to PostgreSQL host',
      });

      const response = await request(app).get('/api/health/db');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(true);
      expect(response.body.data.connected).toBe(false);
      expect(response.body.data.error).toBe('Connection timeout to PostgreSQL host');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return comprehensive telemetry including database status', async () => {
      vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValueOnce({
        connected: true,
        latencyMs: 8,
      });

      const response = await request(app).get('/api/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.service).toBe('eventpilot-backend');
      expect(response.body.data.database.connected).toBe(true);
      expect(typeof response.body.data.uptimeSeconds).toBe('number');
      expect(typeof response.body.data.timestamp).toBe('string');
    });
  });
});

