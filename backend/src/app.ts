import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { commentRouter } from './modules/comments/comment.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { roomRouter } from './modules/rooms/room.routes.js';
import { workflowRouter } from './modules/workflows/workflow.routes.js';
import { workspaceRouter } from './modules/workspaces/workspace.routes.js';

export function createApp() {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body and Cookie Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // Global API Rate Limiter
  app.use('/api', apiRateLimiter);

  // Health Check Endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/workspaces', workspaceRouter);
  app.use('/api/v1/rooms', roomRouter);
  app.use('/api/v1/workflows', workflowRouter);
  app.use('/api/v1/comments', commentRouter);
  app.use('/api/v1/notifications', notificationRouter);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
