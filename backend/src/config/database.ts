// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

const isDatabaseConfigured = process.env.DATABASE_URL && process.env.DATABASE_URL !== '';

try {
  if (isDatabaseConfigured) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
    });
    console.log('📊 Database: Prisma Client initialized');
  } else {
    console.log('⚠️  Database: No DATABASE_URL provided - running without database');
    // Create a mock prisma client for basic server functionality
    prisma = {} as PrismaClient;
  }
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  console.log('⚠️  Running without database connection');
  // Create a mock client for development
  prisma = {} as PrismaClient;
}

export { prisma, isDatabaseConfigured };