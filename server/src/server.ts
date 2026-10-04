import { app } from './app';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { ensureDatabase } from './ensureDb';

dotenv.config();

const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

async function bootstrap() {
  await ensureDatabase();
  await prisma.$connect();
  console.log('✅ Database connected');

  const server = app.listen(PORT, () => {
    console.log(`🚀 QPForge API running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 Graceful shutdown...');
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);
  });
}

bootstrap().catch((e) => {
  console.error('❌ Server startup failed:', e);
  process.exit(1);
});