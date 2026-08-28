import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(100),
    avatarUrl: z.string().url().max(2048).refine((value) => new URL(value).protocol === 'https:', 'Avatar URL must use HTTPS').optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').max(254),
    password: z.string().min(1, 'Password is required').max(128),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
