// Test setup - shared across all tests
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Expose PrismaClient as global for afterAll hooks
export const prisma = new PrismaClient({
  log: ['query', 'warn', 'error'],
});

declare global {
  var prisma: PrismaClient;
}

global.prisma = prisma;