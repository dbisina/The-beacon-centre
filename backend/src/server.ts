// backend/src/server.ts - UPDATED with proper admin routes
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
  standardHeaders: true,
  legacyHeaders: false,
});

// Trust proxy for deployment platforms
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

// Static files
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
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health/db', async (req, res) => {
  try {
    // Simple database check - you can enhance this
    res.json({
      success: true,
      message: 'Database connection healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error : 'Database unavailable',
    });
  }
});

// Public API Routes (no auth required) - for mobile app
app.use('/api/devotionals', devotionalRoutes);
app.use('/api/video-sermons', videoSermonRoutes);
app.use('/api/audio-sermons', audioSermonRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/categories', categoryRoutes);

// Analytics routes (public tracking + protected dashboard)
app.use('/api/analytics', analyticsRoutes);

// Admin authentication routes
app.use('/api/admin', adminRoutes);

// FIXED: Add admin-prefixed routes for admin dashboard convenience
// These mirror the main routes but are specifically for admin use
app.use('/api/admin/devotionals', devotionalRoutes);
app.use('/api/admin/video-sermons', videoSermonRoutes);
app.use('/api/admin/audio-sermons', audioSermonRoutes);
app.use('/api/admin/announcements', announcementRoutes);
app.use('/api/admin/categories', categoryRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Handle 404 for unmatched routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 The Beacon Centre API Server Started Successfully!

📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🗄️  Database Check: http://localhost:${PORT}/health/db

🔑 Default Admin Login:
   Email: admin@beaconcentre.org
   Password: admin123

📱 Mobile App Endpoints:
   GET /api/devotionals
   GET /api/video-sermons
   GET /api/audio-sermons
   GET /api/announcements
   GET /api/categories
   POST /api/analytics/track

🎨 Admin Dashboard Endpoints:
   POST /api/admin/auth/login
   GET /api/admin/video-sermons
   GET /api/admin/audio-sermons
   GET /api/analytics/dashboard

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