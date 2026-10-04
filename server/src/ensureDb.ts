// @ts-ignore
const EmbeddedPostgres = require('embedded-postgres');
import path from 'path';
import net from 'net';

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

export async function ensureDatabase(): Promise<void> {
  const isOpen = await isPortOpen(5432);
  if (isOpen) {
    console.log('📦 PostgreSQL is already active on port 5432');
    return;
  }

  console.log('🔄 Starting Embedded PostgreSQL engine...');
  const dbDir = path.resolve(process.cwd(), '.postgres-data');
  const pg = new EmbeddedPostgres({
    port: 5432,
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    persistent: true,
  });

  try {
    await pg.initialise();
  } catch (e: any) {
    // If already initialized, ignore
  }

  try {
    await pg.start();
    try {
      await pg.createDatabase('qpforge');
    } catch {
      // Database already exists
    }
    console.log('✅ Embedded PostgreSQL engine initialized & running on port 5432');
  } catch (err: any) {
    console.warn('⚠️ Could not start embedded postgres directly (may already be running in background):', err.message);
  }
}
