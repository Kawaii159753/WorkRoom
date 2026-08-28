import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODES } from '../constants/index.js';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode, err.fieldErrors);
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((issue) => {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });

    return sendError(
      res,
      ERROR_CODES.VALIDATION_ERROR,
      'Invalid input parameters or request body',
      400,
      fieldErrors
    );
  }

  logger.error('Unhandled server error:', err);

  return sendError(
    res,
    ERROR_CODES.INTERNAL_ERROR,
    'An unexpected internal server error occurred',
    500
  );
}
