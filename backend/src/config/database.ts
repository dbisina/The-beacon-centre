import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  });
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  // Create a mock client for development
  prisma = {} as PrismaClient;
}

export { prisma };