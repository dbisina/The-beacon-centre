// backend/src/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';

/**
 * Enhanced rate limiting with different limits for different user types
 * - Generous limits for authenticated admin users
 * - Moderate limits for public mobile API
 * - Strict limits for unauthenticated admin attempts
 */

// General API rate limiter - for public mobile endpoints
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased for mobile app usage
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for admin endpoints (they have their own limiter)
    return req.path.startsWith('/api/admin/');
  },
});

// Admin authentication attempts - strict limiting
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Admin API operations - very generous for authenticated users
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request): number => {
    // Check if user is authenticated
    const authReq = req as AuthenticatedRequest;
    if (authReq.admin) {
      return 2000; // Very generous limit for authenticated admin users
    }
    return 50; // Stricter limit for unauthenticated requests
  },
  message: {
    success: false,
    message: 'Too many admin requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use admin ID if authenticated, otherwise use IP with fallback
    const authReq = req as AuthenticatedRequest;
    return authReq.admin 
      ? `admin_${authReq.admin.id}` 
      : req.ip || 'unknown-ip';
  },
});

// File upload limiter - moderate restrictions
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 uploads per hour
  message: {
    success: false,
    message: 'Upload limit exceeded, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Analytics tracking - very generous for mobile apps
export const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for mobile analytics
  message: {
    success: false,
    message: 'Analytics limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Development environment - no limits
export const createDevLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 0, // No limit in development
  skip: () => process.env.NODE_ENV === 'development',
});

// Smart rate limiter that adapts based on endpoint and authentication
export const smartRateLimiter = (req: Request, res: Response, next: any) => {
  // Skip all rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const path = req.path;
  
  // Admin authentication endpoints
  if (path.includes('/admin/auth/')) {
    return adminAuthLimiter(req, res, next);
  }
  
  // Admin API endpoints
  if (path.startsWith('/api/admin/')) {
    return adminApiLimiter(req, res, next);
  }
  
  // Upload endpoints
  if (path.includes('/upload')) {
    return uploadLimiter(req, res, next);
  }
  
  // Analytics endpoints
  if (path.includes('/analytics')) {
    return analyticsLimiter(req, res, next);
  }
  
  // General API endpoints
  return generalApiLimiter(req, res, next);
};