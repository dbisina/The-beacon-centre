// backend/src/server.ts (Complete Final Version)
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import configurations
import { corsOptions } from './config/cors';

// Import routes
import devotionalRoutes from './routes/devotional.routes';
import videoSermonRoutes from './routes/videoSermon.routes';
import audioSermonRoutes from './routes/audioSermon.routes';
import announcementRoutes from './routes/announcement.routes';
import categoryRoutes from './routes/category.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Trust proxy for deployment platforms like Railway, Render, etc.
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Static files (for uploaded files if not using Cloudinary)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'The Beacon Centre API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      devotionals: '/api/devotionals',
      videoSermons: '/api/video-sermons',
      audioSermons: '/api/audio-sermons',
      announcements: '/api/announcements',
      categories: '/api/categories',
      analytics: '/api/analytics',
      admin: '/api/admin',
      upload: '/api/upload',
    },
  });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    const { prisma } = await import('./config/database');
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get some basic stats
    const stats = await Promise.all([
      prisma.devotional.count(),
      prisma.videoSermon.count(),
      prisma.audioSermon.count(),
      prisma.announcement.count(),
      prisma.category.count(),
      prisma.admin.count(),
    ]);

    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      stats: {
        devotionals: stats[0],
        videoSermons: stats[1],
        audioSermons: stats[2],
        announcements: stats[3],
        categories: stats[4],
        admins: stats[5],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes
app.use('/api/devotionals', devotionalRoutes);
app.use('/api/video-sermons', videoSermonRoutes);
app.use('/api/audio-sermons', audioSermonRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// API Documentation placeholder
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      public: {
        devotionals: {
          'GET /api/devotionals': 'List all devotionals',
          'GET /api/devotionals/today': 'Get today\'s devotional',
          'GET /api/devotionals/date/:date': 'Get devotional by date',
          'GET /api/devotionals/:id': 'Get specific devotional',
        },
        videoSermons: {
          'GET /api/video-sermons': 'List all video sermons',
          'GET /api/video-sermons/featured': 'Get featured videos',
          'GET /api/video-sermons/category/:categoryId': 'Get videos by category',
          'GET /api/video-sermons/:id': 'Get specific video',
        },
        audioSermons: {
          'GET /api/audio-sermons': 'List all audio sermons',
          'GET /api/audio-sermons/featured': 'Get featured audio',
          'GET /api/audio-sermons/category/:categoryId': 'Get audio by category',
          'GET /api/audio-sermons/:id': 'Get specific audio',
        },
        announcements: {
          'GET /api/announcements': 'List all announcements',
          'GET /api/announcements/active': 'Get active announcements',
          'GET /api/announcements/:id': 'Get specific announcement',
        },
        categories: {
          'GET /api/categories': 'List all categories',
          'GET /api/categories/:id': 'Get specific category',
        },
        analytics: {
          'POST /api/analytics/track': 'Track content interaction',
          'POST /api/analytics/session': 'Track app session',
        },
      },
      protected: {
        note: 'All admin endpoints require Authorization: Bearer <token>',
        auth: {
          'POST /api/admin/auth/login': 'Admin login',
          'POST /api/admin/auth/refresh': 'Refresh access token',
          'GET /api/admin/auth/me': 'Get admin profile',
          'POST /api/admin/auth/logout': 'Logout',
        },
        contentManagement: {
          'POST /api/devotionals': 'Create devotional',
          'PUT /api/devotionals/:id': 'Update devotional',
          'DELETE /api/devotionals/:id': 'Delete devotional',
          'POST /api/devotionals/bulk': 'Bulk create devotionals',
          // Similar CRUD operations available for video-sermons, audio-sermons, announcements, categories
        },
        uploads: {
          'POST /api/upload/audio': 'Upload audio file',
          'POST /api/upload/image': 'Upload image',
          'POST /api/upload/thumbnail': 'Upload thumbnail',
          'DELETE /api/upload/:publicId': 'Delete file',
        },
        analytics: {
          'GET /api/analytics/dashboard': 'Get analytics overview',
          'GET /api/analytics/content-performance': 'Content performance metrics',
          'GET /api/analytics/user-engagement': 'User engagement stats',
        },
      },
    },
  });
});

// 404 handler - must be after all routes
app.use(notFound);

// Error handler - must be last
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  try {
    const { prisma } = await import('./config/database');
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  try {
    const { prisma } = await import('./config/database');
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 The Beacon Centre API Server is running!

📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🗄️  Database Check: http://localhost:${PORT}/health/db
📖 API Docs: http://localhost:${PORT}/api/docs

🔑 Default Admin Login:
   Email: admin@beaconcentre.org
   Password: admin123

⚠️  Remember to:
   1. Set up your database connection
   2. Configure Cloudinary credentials
   3. Change default admin password
   4. Set strong JWT secrets in production

🎉 Ready to serve The Beacon Centre community!
  `);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

export default app;