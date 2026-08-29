import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// 1. Load from dedicated secrets directory if present
const secretsDir = path.resolve(__dirname, '../../secrets');
if (fs.existsSync(secretsDir)) {
  const secretFiles = ['app.env', 'database.env', 'auth.env'];
  secretFiles.forEach((file) => {
    const fullPath = path.join(secretsDir, file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: true });
    }
  });
}

// 2. Fallback to standard .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number).refine((value) => Number.isInteger(value) && value > 0 && value <= 65535, 'PORT must be a valid TCP port'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
}).superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;

  if (/replace-with|change-me|example/i.test(value.JWT_SECRET)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['JWT_SECRET'], message: 'JWT_SECRET must not use a placeholder in production' });
  }
  if (/replace-with|change-me|example/i.test(value.COOKIE_SECRET)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['COOKIE_SECRET'], message: 'COOKIE_SECRET must not use a placeholder in production' });
  }

  value.CLIENT_URL.split(',').map((entry) => entry.trim()).filter(Boolean).forEach((origin) => {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' || parsed.origin !== origin || parsed.username || parsed.password) throw new Error();
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['CLIENT_URL'], message: 'Production CLIENT_URL entries must be exact HTTPS origins' });
    }
  });
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
