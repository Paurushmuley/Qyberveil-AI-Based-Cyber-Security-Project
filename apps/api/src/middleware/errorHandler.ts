import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@vulnsight/shared-types';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload failed schema validation',
        details: err.flatten().fieldErrors,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle generic / unhandled errors without leaking sensitive stack traces in production
  const isDev = process.env.NODE_ENV === 'development';
  const statusCode = (err as any).statusCode || 500;
  const errorCode = (err as any).code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');

  if (statusCode >= 500) {
    console.error('[API Error]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || (isDev ? 'An unexpected server error occurred' : 'An error occurred processing your request'),
      ...(isDev && statusCode >= 500 && { details: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
}
