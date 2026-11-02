import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ApiResponse, AuthResponse, ForgotPasswordResponse, ResetPasswordResponse, UserSummary } from '@vulnsight/shared-types';

export class AuthController {
  public static async register(
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(
    req: Request,
    res: Response<ApiResponse<AuthResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async forgotPassword(
    req: Request,
    res: Response<ApiResponse<ForgotPasswordResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async resetPassword(
    req: Request,
    res: Response<ApiResponse<ResetPasswordResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.resetPassword(req.body);
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(
    req: Request,
    res: Response<ApiResponse<UserSummary>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const user = await AuthService.getMe(userId);
      res.json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateProfile(
    req: Request,
    res: Response<ApiResponse<UserSummary>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const updated = await AuthService.updateProfile(userId, req.body);
      res.json({
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}
