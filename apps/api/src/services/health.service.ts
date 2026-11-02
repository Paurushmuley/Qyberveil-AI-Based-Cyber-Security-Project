import { ServiceHealthStatus } from '@vulnsight/shared-types';
import { checkDatabaseHealth } from './prisma.service.js';
import { checkRedisHealth } from './redis.service.js';
import { config } from '../config/index.js';

export class HealthService {
  private static startTime = Date.now();

  public static async getHealthStatus(): Promise<ServiceHealthStatus> {
    const dbCheck = await checkDatabaseHealth();
    const redisCheck = await checkRedisHealth();

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (!dbCheck.connected) {
      overallStatus = 'unhealthy';
    } else if (!redisCheck.connected) {
      overallStatus = 'degraded'; // API & DB work, scan queue worker degraded until Redis starts
    }

    return {
      status: overallStatus,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - HealthService.startTime) / 1000),
      environment: config.NODE_ENV,
      services: {
        database: {
          status: dbCheck.connected ? 'connected' : 'disconnected',
          latencyMs: dbCheck.latencyMs,
          error: dbCheck.error,
        },
        redis: {
          status: redisCheck.connected ? 'connected' : 'disconnected',
          latencyMs: redisCheck.latencyMs,
          error: redisCheck.error,
        },
      },
    };
  }
}
