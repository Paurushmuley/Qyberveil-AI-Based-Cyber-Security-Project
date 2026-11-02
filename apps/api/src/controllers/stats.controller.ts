import { Request, Response, NextFunction } from 'express';
import { StatsService } from '../services/stats.service.js';
import { ApiResponse, DashboardMetrics } from '@vulnsight/shared-types';

export class StatsController {
  public static async getMetrics(req: Request, res: Response<ApiResponse<DashboardMetrics>>, next: NextFunction): Promise<void> {
    try {
      const userId = (req as unknown as { user?: { id: string } }).user?.id;
      const metrics = await StatsService.getDashboardMetrics(userId);
      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
