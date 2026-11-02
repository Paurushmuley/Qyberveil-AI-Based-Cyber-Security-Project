import { Request, Response, NextFunction } from 'express';
import { TargetService } from '../services/target.service.js';
import { ApiResponse } from '@vulnsight/shared-types';

export class TargetController {
  public static async listTargets(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
      if (!projectId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'projectId query parameter is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const targets = await TargetService.listTargets(projectId);
      res.json({
        success: true,
        data: targets,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createTarget(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const created = await TargetService.createTarget(req.body);
      res.status(201).json({
        success: true,
        data: created,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async verifyTarget(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Target ID is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const result = await TargetService.verifyTarget(id);
      res.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
