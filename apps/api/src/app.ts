import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';
import healthRoutes from './routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // CORS Configuration
  app.use(cors({
    origin: config.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Request body parsing with safe 1MB default limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Safe Request Logger (omits sensitive headers and bodies)
  app.use(requestLogger);

  // Top-level direct health check for containers/load-balancers
  app.use('/health', healthRoutes);

  // Versioned API Router
  app.use('/api', apiRouter);

  // Serve static frontend assets if built
  const possibleStaticDirs = [
    path.resolve(process.cwd(), 'apps/web/dist'),
    path.resolve(process.cwd(), '../web/dist'),
    path.resolve(process.cwd(), '../../apps/web/dist'),
  ];
  const staticDir = possibleStaticDirs.find((dir) => fs.existsSync(dir));

  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // 404 handler for unknown routes
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested resource does not exist',
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
