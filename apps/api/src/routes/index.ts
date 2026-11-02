import { Router } from 'express';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import targetRoutes from './target.routes.js';
import scanRoutes from './scan.routes.js';
import statsRoutes from './stats.routes.js';
import aiRoutes from './ai.routes.js';
import authRoutes from './auth.routes.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/health', healthRoutes);
apiRouter.use('/projects', optionalAuth, projectRoutes);
apiRouter.use('/targets', optionalAuth, targetRoutes);
apiRouter.use('/scans', optionalAuth, scanRoutes);
apiRouter.use('/stats', optionalAuth, statsRoutes);
apiRouter.use('/ai', optionalAuth, aiRoutes);

export default apiRouter;
