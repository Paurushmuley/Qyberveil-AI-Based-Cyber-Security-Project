import { Request, Response, NextFunction } from 'express';
import { ScanService } from '../services/scan.service.js';
import { ReportService } from '../services/report.service.js';
import { AIAnalystService } from '../services/ai-analyst.service.js';
import { ApiResponse, AuditReportType } from '@vulnsight/shared-types';

export class ScanController {
  private static getUserId(req: Request): string {
    return (req as unknown as { user?: { id: string } }).user?.id || 'demo-system-user';
  }

  public static async triggerScan(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = ScanController.getUserId(req);
      const scan = await ScanService.triggerScan(userId, req.body);
      res.status(202).json({
        success: true,
        data: scan,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getScan(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Scan ID parameter is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const scan = await ScanService.getScanDetails(id);
      if (!scan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Scan ${id} not found` },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        success: true,
        data: scan,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async cancelScan(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Scan ID parameter is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const cancelled = await ScanService.cancelScan(id);
      res.json({
        success: true,
        data: cancelled,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async compareScans(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { projectId, baseScanId, targetScanId } = req.body as {
        projectId: string;
        baseScanId: string;
        targetScanId: string;
      };

      if (!projectId || !baseScanId || !targetScanId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'projectId, baseScanId, and targetScanId are required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const comparison = await ScanService.compareScans(projectId, baseScanId, targetScanId);
      res.json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async analyzeFinding(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = ScanController.getUserId(req);
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      if (!id) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Finding ID parameter is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const analysis = await AIAnalystService.analyzeFinding(userId, id);
      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scanId = typeof req.params.id === 'string' ? req.params.id : undefined;
      const reportType = (req.query.type as AuditReportType) || AuditReportType.TECHNICAL_DETAILED;

      if (!scanId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Scan ID parameter is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { pdfBuffer, filename } = await ReportService.generateReport(scanId, reportType);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}
