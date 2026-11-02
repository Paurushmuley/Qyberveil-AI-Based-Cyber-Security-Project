import { Request, Response, NextFunction } from 'express';
import { AIConfigService } from '../services/ai-config.service.js';
import { ApiResponse, AIProvider } from '@vulnsight/shared-types';
import { ConfigureAiProviderInput } from '@vulnsight/validation';

export class AIController {
  private static getUserId(req: Request): string {
    return (req as unknown as { user?: { id: string } }).user?.id || 'demo-system-user';
  }

  public static async getConfigs(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = AIController.getUserId(req);
      const configs = await AIConfigService.getUserConfigs(userId);
      res.json({
        success: true,
        data: configs,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async saveConfig(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = AIController.getUserId(req);
      const input = req.body as ConfigureAiProviderInput;
      await AIConfigService.saveConfig(userId, input);

      res.status(200).json({
        success: true,
        data: { message: `Configuration for ${input.provider} saved successfully.` },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async testConnection(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = AIController.getUserId(req);
      const { provider, modelName, apiKey, baseUrl } = req.body as {
        provider: AIProvider;
        modelName: string;
        apiKey?: string;
        baseUrl?: string;
      };

      if (!provider) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Provider is required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const result = await AIConfigService.testProvider(userId, {
        provider,
        modelName,
        apiKey,
        baseUrl,
      });

      res.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async deleteConfig(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const userId = AIController.getUserId(req);
      const providerParam = req.params.provider as string;

      if (!Object.values(AIProvider).includes(providerParam as AIProvider)) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Invalid provider: ${providerParam}` },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await AIConfigService.deleteConfig(userId, providerParam as AIProvider);
      res.json({
        success: true,
        data: { message: `Credentials for ${providerParam} removed.` },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getModels(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const providerParam = req.params.provider as string;
      if (!Object.values(AIProvider).includes(providerParam as AIProvider)) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Invalid provider: ${providerParam}` },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const models = AIConfigService.getSupportedModels(providerParam as AIProvider);
      res.json({
        success: true,
        data: models,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
