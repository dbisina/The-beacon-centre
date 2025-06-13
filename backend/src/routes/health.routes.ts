// src/routes/health.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'The Beacon Centre API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Database health check
router.get('/db', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Try to query the database
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    res.json({
      success: true,
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
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
    services: {
      database: { status: 'unknown', message: '' },
      cloudinary: { status: 'unknown', message: '' },
    },
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1 as health_check`;
    healthCheck.services.database = { status: 'healthy', message: 'Connected' };
  } catch (error: any) {
    healthCheck.services.database = { status: 'unhealthy', message: error.message };
    healthCheck.success = false;
  }

  // Check Cloudinary configuration
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    healthCheck.services.cloudinary = { status: 'configured', message: 'Environment variables present' };
  } else {
    healthCheck.services.cloudinary = { status: 'not-configured', message: 'Missing environment variables' };
  }

  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
}));

export default router;