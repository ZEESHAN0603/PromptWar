import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export class HealthController {
  /**
   * GET /api/health
   * Standard backend health endpoint
   */
  static getHealth(_req: Request, res: Response, _next: NextFunction): void {
    const healthData = HealthService.getBasicHealth();
    ApiResponse.success(
      res,
      healthData,
      'EventPilot AI backend is running',
      200
    );
  }

  /**
   * GET /api/health/db
   * Database connectivity verification endpoint
   */
  static async getDatabaseHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dbStatus = await HealthService.getDatabaseHealth();
      const statusCode = dbStatus.connected ? 200 : 503;
      const message = dbStatus.connected
        ? 'Database connection is healthy'
        : 'Database connection is unavailable or degraded';

      ApiResponse.success(res, dbStatus, message, statusCode);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/health/detailed
   * Full system telemetry
   */
  static async getDetailedHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const detailed = await HealthService.getDetailedHealth();
      const statusCode = detailed.status === 'healthy' ? 200 : 503;
      ApiResponse.success(res, detailed, `Backend system status is ${detailed.status}`, statusCode);
    } catch (error) {
      next(error);
    }
  }
}

