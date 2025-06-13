import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
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
});

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api/', limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Database status check
app.get('/health/db', async (req, res) => {
  try {
    const { prisma } = await import('./config/database');
    await prisma.$connect();
    await prisma.$disconnect();
    res.json({
      success: true,
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
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

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server function
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🗄️  Database check: http://localhost:${PORT}/health/db`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /health - Server health check');
      console.log('   GET  /health/db - Database health check');
      console.log('   GET  /api/devotionals - Devotionals endpoint');
      console.log('   GET  /api/video-sermons - Video sermons endpoint');
      console.log('   GET  /api/audio-sermons - Audio sermons endpoint');
      console.log('   GET  /api/announcements - Announcements endpoint');
      console.log('   GET  /api/categories - Categories endpoint');
      console.log('   POST /api/analytics/track - Analytics tracking');
      console.log('   POST /api/admin/auth/login - Admin authentication');
      console.log('   POST /api/upload/image - File upload');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n⏳ Shutting down gracefully...');
  try {
    const { prisma } = await import('./config/database');
    await prisma.$disconnect();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.log('⚠️  Database was not connected');
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();