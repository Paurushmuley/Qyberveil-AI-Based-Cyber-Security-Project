import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.service.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  name?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that requires a valid JWT Bearer token
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please provide a valid Bearer token.',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const parts = authHeader.split(' ');
  const token = parts[1];
  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token missing.',
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as unknown as { id: string; email: string; role: string };
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_DEACTIVATED',
          message: 'User account is inactive or no longer exists.',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired session token. Please log in again.',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Middleware that extracts user if Bearer token is provided,
 * but falls back gracefully to demo user if absent (preserving demo compatibility)
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'demo-system-user',
      email: 'security-lead@qyberveil.local',
      role: 'SECURITY_ANALYST',
      name: 'Security Lead',
    };
    return next();
  }

  const parts = authHeader.split(' ');
  const token = parts[1];
  if (!token) {
    req.user = {
      id: 'demo-system-user',
      email: 'security-lead@qyberveil.local',
      role: 'SECURITY_ANALYST',
      name: 'Security Lead',
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as unknown as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };
    } else {
      req.user = {
        id: 'demo-system-user',
        email: 'security-lead@qyberveil.local',
        role: 'SECURITY_ANALYST',
        name: 'Security Lead',
      };
    }
  } catch {
    req.user = {
      id: 'demo-system-user',
      email: 'security-lead@qyberveil.local',
      role: 'SECURITY_ANALYST',
      name: 'Security Lead',
    };
  }

  next();
}
