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

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import adminVideoSermonRoutes from './routes/admin.videoSermon.routes';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for deployment platforms
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors(corsOptions));

// Compression and parsing
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
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