import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service.js';
import { ApiResponse, ProjectSummary } from '@vulnsight/shared-types';

export class ProjectController {
  public static async listProjects(req: Request, res: Response<ApiResponse<ProjectSummary[]>>, next: NextFunction): Promise<void> {
    try {
      const userId = (req as unknown as { user?: { id: string } }).user?.id;
      const projects = await ProjectService.listProjects(userId);
      res.json({
        success: true,
        data: projects,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getProject(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Valid project ID parameter is required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const userId = (req as unknown as { user?: { id: string } }).user?.id;
      const project = await ProjectService.getProjectById(id, userId);

      if (!project) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Project with ID ${id} not found`,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: project,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async createProject(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = (req as unknown as { user?: { id: string } }).user?.id || 'demo-system-user';
      const created = await ProjectService.createProject(req.body, userId);
      res.status(201).json({
        success: true,
        data: created,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteProject(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Valid project ID parameter is required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const userId = (req as unknown as { user?: { id: string } }).user?.id;
      await ProjectService.deleteProject(id, userId);
      res.json({
        success: true,
        data: { message: `Project ${id} deleted successfully` },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
