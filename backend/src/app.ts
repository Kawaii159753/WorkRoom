import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
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
import { AppError } from './middleware/errorHandler.js';
import { ERROR_CODES } from './constants/index.js';

export function createApp(): Express {
  const app = express();
  const configuredOrigins = env.CLIENT_URL.split(',').map((value) => value.trim()).filter(Boolean);
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);

  const isAllowedOrigin = (origin: string) => {
    const isConfigured = configuredOrigins.includes(origin);
    const isLocalDevelopment = env.NODE_ENV !== 'production' && (
      origin === 'null' || /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin)
    );
    return isConfigured || isLocalDevelopment;
  };

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        const allowed = isAllowedOrigin(origin);
        callback(allowed ? null : new AppError(ERROR_CODES.FORBIDDEN, 'Origin is not allowed', 403), allowed);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body and Cookie Parsers
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true, limit: '256kb', parameterLimit: 200 }));
  app.use(cookieParser(env.COOKIE_SECRET));

  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.get('origin');
    const usesCookieAuth = Boolean(req.cookies?.token) && !req.get('authorization');
    if (usesCookieAuth && (!origin || !isAllowedOrigin(origin))) {
      return next(new AppError(ERROR_CODES.FORBIDDEN, 'Request origin could not be verified', 403));
    }
    return next();
  });

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
