// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendError } from '../utils/responses';
import { AuthenticatedRequest } from '../types';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Access token required', 401);
      return;
    }

    const token = authHeader.substring(7);
    const result = await AuthService.verifyToken(token);

    if (!result.success) {
      sendError(res, result.error, 401);
      return;
    }

    // Find admin details
    const { prisma } = await import('../config/database');
    const admin = await prisma.admin.findUnique({
      where: { id: result.data.adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      sendError(res, 'Invalid authentication', 401);
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed', 401);
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (req.admin.role === 'super_admin' || req.admin.permissions.includes(permission)) {
      next();
      return;
    }

    sendError(res, 'Insufficient permissions', 403);
  };
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (roles.includes(req.admin.role)) {
      next();
      return;
    }

    sendError(res, 'Insufficient role permissions', 403);
  };
};