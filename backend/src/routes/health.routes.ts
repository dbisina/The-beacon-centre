// backend/src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'The Beacon Centre API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Database health check
router.get('/db', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      res.status(200).json({
        success: true,
        message: 'Database not configured - running in development mode',
        timestamp: new Date().toISOString(),
        status: 'no-database'
      });
      return;
    }

    // Try to query the database
    const { prisma, isDatabaseConfigured } = await import('../config/database');
    
    if (!isDatabaseConfigured) {
      res.status(200).json({
        success: true,
        message: 'Database not configured',
        timestamp: new Date().toISOString(),
        status: 'no-database'
      });
      return;
    }

    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
      status: 'connected'
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'error'
    });
  }
}));

// Detailed system health
router.get('/system', asyncHandler(async (req: Request, res: Response) => {
  const healthCheck = {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    services: {
      database: { status: 'unknown', message: '' },
      cloudinary: { status: 'unknown', message: '' },
      jwt: { status: 'unknown', message: '' },
    },
  };

  // Check JWT configuration
  if (process.env.JWT_SECRET && process.env.JWT_REFRESH_SECRET) {
    healthCheck.services.jwt = { status: 'configured', message: 'JWT secrets configured' };
  } else {
    healthCheck.services.jwt = { status: 'using-defaults', message: 'Using default JWT secrets (development)' };
  }

  // Check database
  try {
    if (!process.env.DATABASE_URL) {
      healthCheck.services.database = { status: 'not-configured', message: 'No DATABASE_URL provided' };
    } else {
      const { prisma, isDatabaseConfigured } = await import('../config/database');
      
      if (!isDatabaseConfigured) {
        healthCheck.services.database = { status: 'not-configured', message: 'Database not configured' };
      } else {
        await prisma.$queryRaw`SELECT 1 as health_check`;
        healthCheck.services.database = { status: 'healthy', message: 'Connected and responsive' };
      }
    }
  } catch (error: any) {
    healthCheck.services.database = { status: 'unhealthy', message: error.message };
    healthCheck.success = false;
  }

  // Check Cloudinary configuration
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    healthCheck.services.cloudinary = { status: 'configured', message: 'All environment variables present' };
  } else {
    healthCheck.services.cloudinary = { status: 'not-configured', message: 'Missing environment variables (optional)' };
  }

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
}));

export default router;