import { checkDatabaseHealth, DatabaseHealthStatus } from '../config/database.js';

export interface ServiceHealthData {
  status: 'healthy';
  service: string;
  version: string;
}

export interface DetailedHealthData {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseHealthStatus;
}

export class HealthService {
  private static readonly SERVICE_NAME = 'eventpilot-backend';
  private static readonly SERVICE_VERSION = '1.0.0';

  /**
   * Returns base service health
   */
  static getBasicHealth(): ServiceHealthData {
    return {
      status: 'healthy',
      service: this.SERVICE_NAME,
      version: this.SERVICE_VERSION,
    };
  }

  /**
   * Returns database connection status
   */
  static async getDatabaseHealth(): Promise<DatabaseHealthStatus> {
    return await checkDatabaseHealth();
  }

  /**
   * Returns comprehensive health including database
   */
  static async getDetailedHealth(): Promise<DetailedHealthData> {
    const dbStatus = await checkDatabaseHealth();
    return {
      status: dbStatus.connected ? 'healthy' : 'degraded',
      service: this.SERVICE_NAME,
      version: this.SERVICE_VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    };
  }
}
