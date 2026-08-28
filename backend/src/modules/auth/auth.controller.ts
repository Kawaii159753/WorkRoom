import { CookieOptions, Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { AuthenticatedRequest } from '../../types/index.js';
import { sendSuccess } from '../../utils/response.js';
import { AuthService } from './auth.service.js';

function authCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);

      res.cookie('token', result.token, authCookieOptions());

      return sendSuccess(res, { user: result.user }, 201);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      res.cookie('token', result.token, authCookieOptions());

      return sendSuccess(res, { user: result.user }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      const options = authCookieOptions();
      delete options.maxAge;
      res.clearCookie('token', options);
      return sendSuccess(res, { message: 'Logged out successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, { user: req.user }, 200);
    } catch (error) {
      next(error);
    }
  }
}
