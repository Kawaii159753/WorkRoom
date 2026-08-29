import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ERROR_CODES } from '../constants/index.js';
import { AuthenticatedRequest, AuthUser } from '../types/index.js';
import { AppError } from './errorHandler.js';

interface JwtPayload {
  userId: string;
  email: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Authentication required. Please log in.',
        401
      );
    }

    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'workroom-api',
      audience: 'workroom-web',
    }) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'User not found or session expired.',
        401
      );
    }

    req.user = user as AuthUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(
        new AppError(
          ERROR_CODES.UNAUTHORIZED,
          'Invalid or expired authentication token',
          401
        )
      );
    }
    next(error);
  }
}
