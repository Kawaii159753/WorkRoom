import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../config/prisma.js';
import { ERROR_CODES } from '../../constants/index.js';
import { AppError } from '../../middleware/errorHandler.js';
import { LoginInput, RegisterInput } from './auth.schemas.js';

export class AuthService {
  static async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        'An account with this email already exists',
        409
      );
    }

    const passwordHash = await argon2.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        displayName: input.displayName,
        avatarUrl: input.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = this.generateToken(user.id, user.email);

    return { user, token };
  }

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Invalid email or password',
        401
      );
    }

    const isValidPassword = await argon2.verify(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw new AppError(
        ERROR_CODES.UNAUTHORIZED,
        'Invalid email or password',
        401
      );
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  static generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }
}
