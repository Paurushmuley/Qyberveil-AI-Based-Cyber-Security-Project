import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const path = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log safe HTTP metadata only
    if (process.env.NODE_ENV !== 'test') {
      const color = statusCode >= 500 ? '\x1b[31m' : statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
      console.log(`[HTTP] ${method} ${path} -> ${color}${statusCode}\x1b[0m (${duration}ms)`);
    }
  });

  next();
}
