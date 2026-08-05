// backend/src/server.ts - UPDATED with smart rate limiting
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Prisma returns BigInt for money/file-size columns; JSON.stringify throws on
// a raw BigInt, so every response serializer needs this shim in place first.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Import configurations
import { corsOptions } from './config/cors';

// Import enhanced rate limiting
import { smartRateLimiter, createDevLimiter } from './middleware/rateLimiter';

// Import routes
import devotionalRoutes from './routes/devotional.routes';
import videoSermonRoutes from './routes/videoSermon.routes';
import audioSermonRoutes from './routes/audioSermon.routes';
import announcementRoutes from './routes/announcement.routes';
import categoryRoutes from './routes/category.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import csgRoutes from './routes/csg.routes';
import givingRoutes from './routes/giving.routes';
import projectRoutes from './routes/project.routes';
import deviceRoutes from './routes/device.routes';
import notifyRoutes from './routes/notify.routes';
import prayerRequestRoutes from './routes/prayerRequest.routes';
import contactRoutes from './routes/contact.routes';
import userRoutes from './routes/user.routes';
import appUserAuthRoutes from './routes/appUserAuth.routes';
import liveScheduleRoutes from './routes/liveSchedule.routes';
import collageRoutes from './routes/collage.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Using simple config for debugging
app.use(cors(corsOptions));

// Compression and parsing
app.use(compression());
app.use(cookieParser());
app.use(express.json({
  limit: '50mb',
  // Capture the raw body bytes alongside the parsed JSON - the Paystack
  // webhook needs to HMAC the exact bytes Paystack sent, and re-stringifying
  // req.body isn't guaranteed to produce an identical byte sequence.
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Enhanced rate limiting with smart detection
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Rate limiting disabled');
  app.use('/api/', createDevLimiter());
} else {
  console.log('🛡️ Production mode: Smart rate limiting enabled');
  app.use('/api/', smartRateLimiter);
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'The Beacon Centre API',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    rateLimit: process.env.NODE_ENV === 'development' ? 'disabled' : 'smart',
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
      csgs: '/api/csgs',
      giving: '/api/giving',
      projects: '/api/projects',
      devices: '/api/devices',
      notify: '/api/notify',
      prayerRequests: '/api/prayer-requests',
      contact: '/api/contact',
      users: '/api/users',
      liveSchedule: '/api/live-schedule',
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
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy!',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected', // Will be updated when we add DB health check
      storage: 'available',
    },
  });
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
app.use('/api/csgs', csgRoutes);
app.use('/api/giving', givingRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/prayer-requests', prayerRequestRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', appUserAuthRoutes);
app.use('/api/live-schedule', liveScheduleRoutes);
app.use('/api/collages', collageRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 The Beacon Centre API Server Started Successfully!

📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server URL: http://localhost:${PORT}
🛡️ Rate Limiting: ${process.env.NODE_ENV === 'development' ? 'Disabled (Dev Mode)' : 'Smart Limiting Enabled'}

📋 Available Endpoints:
   ├── GET  /                    - API Info
   ├── GET  /health              - Health Check
   ├── GET  /api/health          - API Health Check
   ├── GET  /api/devotionals     - List devotionals
   ├── GET  /api/video-sermons   - List video sermons
   ├── GET  /api/audio-sermons   - List audio sermons
   ├── GET  /api/announcements   - List announcements
   ├── GET  /api/categories      - List categories
   ├── POST /api/analytics/track - Track analytics
   └── /api/admin/*              - Admin endpoints (auth required)

💡 Admin Dashboard: Configure to point to this API
📱 Mobile App: Configure to point to this API

${process.env.NODE_ENV === 'development' ? 
  '🔧 Development Tips:\n   - Rate limiting is disabled\n   - Detailed error messages enabled\n   - CORS allows all origins' : 
  '🏭 Production Mode:\n   - Smart rate limiting active\n   - Error messages sanitized\n   - CORS restricted to allowed origins'
}
  `);
});

export default app;