// backend/src/config/cors.ts - UPDATED VERSION
import { CorsOptions } from 'cors';

// Development URLs
const developmentOrigins = [
  'http://localhost:3000',        // Next.js admin dashboard
  'http://localhost:19006',       // Expo mobile app web
  'http://localhost:8081',        // React Native Metro bundler
  'exp://localhost:19000',        // Expo development
  'exp://192.168.1.100:19000',   // Expo on local network (update IP as needed)
  'http://192.168.1.100:19006',  // Expo web on local network
];

// Production URLs (update these with your actual domains)
const productionOrigins = [
  'https://beacon-centre-admin.vercel.app',  // Admin dashboard production
  'https://your-production-domain.com',      // Your main website
  // Add your production mobile app domains if using web build
];

// Get additional origins from environment
const envOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [];

// Combine all allowed origins
const allowedOrigins = [
  ...developmentOrigins,
  ...(process.env.NODE_ENV === 'production' ? productionOrigins : []),
  ...envOrigins,
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost on any port
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      // Allow local network IPs (for mobile testing)
      if (/^https?:\/\/192\.168\.\d+\.\d+/.test(origin)) {
        return callback(null, true);
      }
      // Allow Expo development URLs
      if (origin.startsWith('exp://')) {
        return callback(null, true);
      }
    }

    // Log rejected origins for debugging
    console.log(`🚫 CORS: Rejected origin: ${origin}`);
    callback(new Error(`CORS: Origin ${origin} not allowed`), false);
  },

  credentials: true, // Allow cookies and authorization headers

  methods: [
    'GET',
    'POST', 
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
    'HEAD'
  ],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Device-Platform',    // For mobile analytics
    'X-App-Version',        // For mobile app version tracking
    'X-Device-ID',          // For anonymous analytics
  ],

  exposedHeaders: [
    'X-Total-Count',        // For pagination
    'X-Rate-Limit-Limit',   // Rate limiting info
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset',
  ],

  // Handle preflight requests
  optionsSuccessStatus: 200,
  
  // Cache preflight responses for 24 hours
  maxAge: 86400,
};

// Log CORS configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 CORS: Allowed origins:', allowedOrigins);
}