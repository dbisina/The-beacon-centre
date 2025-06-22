// backend/src/middleware/auth.middleware.ts - COMPLETE FIXED VERSION
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, JWTPayload, AdminRole } from '../types';
import { sendError } from '../utils/responses';

// Initialize Prisma client with error handling
let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.warn('Auth middleware: Prisma client initialization failed');
  prisma = null;
}

// JWT secrets with fallbacks for development
const JWT_SECRET = process.env.JWT_SECRET || 'beacon-centre-dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'beacon-centre-dev-refresh-secret';

// FIXED: Main authentication middleware
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      sendError(res, 'Access token required', 401);
      return;
    }

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError: any) {
      console.warn('JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        sendError(res, 'Token expired', 401, { expired: true });
      } else if (jwtError.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token', 401, { invalid: true });
      } else {
        sendError(res, 'Token verification failed', 401);
      }
      return;
    }

    // Validate token payload
    if (!decoded.adminId || !decoded.email) {
      sendError(res, 'Invalid token payload', 401);
      return;
    }

    // Try to fetch admin from database, fallback to token data if DB unavailable
    let admin = null;
    
    if (prisma) {
      try {
        admin = await prisma.admin.findUnique({
          where: { id: decoded.adminId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            permissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            loginCount: true,
          },
        });

        // Check if admin exists and is active
        if (!admin) {
          sendError(res, 'Admin not found', 401);
          return;
        }

        if (!admin.isActive) {
          sendError(res, 'Admin account is inactive', 401);
          return;
        }
      } catch (dbError) {
        console.warn('Database query failed in auth middleware, using token data:', dbError);
        
        // Fallback to token data when database is unavailable
        admin = {
          id: decoded.adminId,
          email: decoded.email,
          name: 'Admin User', // Default name
          role: decoded.role || AdminRole.ADMIN,
          permissions: decoded.permissions || [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          loginCount: 1,
        };
      }
    } else {
      // Database not available, use token data
      admin = {
        id: decoded.adminId,
        email: decoded.email,
        name: 'Admin User',
        role: decoded.role || AdminRole.ADMIN,
        permissions: decoded.permissions || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
        loginCount: 1,
      };
    }

    // Attach admin data to request
    req.admin = admin;
    req.adminId = admin.id;

    console.log(`✅ Authentication successful for admin: ${admin.email}`);
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    sendError(res, 'Authentication failed', 500, error);
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRoles: AdminRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const hasRequiredRole = requiredRoles.includes(req.admin.role as AdminRole);
    
    if (!hasRequiredRole) {
      sendError(res, 'Insufficient permissions', 403, {
        required: requiredRoles,
        current: req.admin.role,
      });
      return;
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const adminPermissions = req.admin.permissions as string[] || [];
    const hasAllPermissions = requiredPermissions.every(permission =>
      adminPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      sendError(res, 'Insufficient permissions', 403, {
        required: requiredPermissions,
        current: adminPermissions,
      });
      return;
    }

    next();
  };
};

// Super admin only middleware
export const requireSuperAdmin = requireRole([AdminRole.SUPER_ADMIN]);

// JWT token generation utilities
export const generateTokens = (admin: any) => {
  const payload: JWTPayload = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions || [],
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token
    issuer: 'beacon-centre-api',
    audience: 'beacon-centre-admin',
  });

  const refreshToken = jwt.sign(
    { adminId: admin.id }, 
    JWT_REFRESH_SECRET, 
    {
      expiresIn: '7d', // Long-lived refresh token
      issuer: 'beacon-centre-api',
      audience: 'beacon-centre-admin',
    }
  );

  return { accessToken, refreshToken };
};

// Refresh token verification
export const verifyRefreshToken = (token: string): { adminId: number } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { adminId: number };
    return decoded;
  } catch (error: any) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
};

// Optional authentication middleware (for endpoints that work with or without auth)
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // Try to authenticate, but don't fail if it doesn't work
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      
      if (prisma) {
        const admin = await prisma.admin.findUnique({
          where: { id: decoded.adminId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            permissions: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            loginCount: true,
          },
        });

        if (admin && admin.isActive) {
          req.admin = admin;
          req.adminId = admin.id;
        }
      } else {
        // Database not available, create fallback admin
        const admin = {
          id: decoded.adminId,
          email: decoded.email,
          name: 'Admin User',
          role: decoded.role || AdminRole.ADMIN,
          permissions: decoded.permissions || [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: new Date(),
          loginCount: 1,
        };
        req.admin = admin;
        req.adminId = admin.id;
      }
    } catch (authError) {
      // Authentication failed, but we continue anyway
      console.log('Optional auth failed:', authError);
    }

    next();
  } catch (error) {
    // Don't fail the request, just continue without auth
    console.warn('Optional auth middleware error:', error);
    next();
  }
};

// Development helper - creates a default admin if none exists
export const ensureDefaultAdmin = async (): Promise<void> => {
  if (!prisma || process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const adminCount = await prisma.admin.count();
    
    if (adminCount === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await prisma.admin.create({
        data: {
          email: 'admin@beaconcentre.org',
          passwordHash: hashedPassword,
          name: 'Default Admin',
          role: AdminRole.SUPER_ADMIN,
          permissions: ['*'], // All permissions
          isActive: true,
        },
      });
      
      console.log('✅ Default admin created: admin@beaconcentre.org / admin123');
    }
  } catch (error) {
    console.warn('Failed to create default admin:', error);
  }
};

// Call this on server startup
if (process.env.NODE_ENV !== 'production') {
  ensureDefaultAdmin();
}

export default {
  authenticate,
  requireRole,
  requirePermission,
  requireSuperAdmin,
  optionalAuth,
  generateTokens,
  verifyRefreshToken,
};