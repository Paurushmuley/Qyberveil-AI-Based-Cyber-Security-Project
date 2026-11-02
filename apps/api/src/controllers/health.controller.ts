import { Request, Response } from 'express';
import { HealthService } from '../services/health.service.js';
import { ApiResponse, ServiceHealthStatus } from '@vulnsight/shared-types';

export class HealthController {
  public static async getHealth(_req: Request, res: Response<ApiResponse<ServiceHealthStatus>>): Promise<void> {
    const health = await HealthService.getHealthStatus();
    
    // Status code: 200 for healthy or degraded (readiness/liveness check), 503 if primary DB is down
    const httpStatus = health.status === 'unhealthy' ? 503 : 200;

    res.status(httpStatus).json({
      success: health.status !== 'unhealthy',
      data: health,
      timestamp: new Date().toISOString(),
    });
  }
}
