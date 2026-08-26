import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { initSocketServer } from './realtime/socket.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // Check DB Connection
    await prisma.$connect();
    logger.info(' Connected to PostgreSQL database via Prisma');

    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.IO Server
    initSocketServer(server);
    logger.info(' Realtime WebSocket (Socket.IO) server initialized');

    server.listen(env.PORT, () => {
      logger.info(` WorkRoom Backend Server running on http://localhost:${env.PORT}`);
      logger.info(` Environment: ${env.NODE_ENV}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database connection closed. Process terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
