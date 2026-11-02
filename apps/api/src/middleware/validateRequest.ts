import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export function validateBody(schema: ZodType<unknown>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: error.flatten().fieldErrors,
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      next(error);
    }
  };
}
