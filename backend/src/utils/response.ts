import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: Record<string, unknown>) {
  return res.status(statusCode).json({
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  fieldErrors?: Record<string, string[]>
) {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(fieldErrors ? { fieldErrors } : {}),
    },
  });
}
