import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

// 1. Fallback to standard .env file first (provides base defaults if any)
dotenv.config();

// 2. Discover and load from dedicated secrets directories
const rawDirs = [
  process.env.WORKROOM_SECRETS_DIR,
  path.resolve(__dirname, '../../secrets'), // backend/secrets relative to src/config or dist/config
  path.resolve(__dirname, '../../../secrets'), // root secrets
  path.resolve(process.cwd(), 'secrets'), // cwd/secrets
  path.resolve(process.cwd(), 'backend/secrets'), // cwd/backend/secrets
  path.resolve(process.cwd(), '../secrets'), // cwd/../secrets
];

const candidateDirs = rawDirs.filter((dir): dir is string => typeof dir === 'string' && dir.length > 0 && fs.existsSync(dir));

const uniqueDirs = Array.from(new Set(candidateDirs.map((d) => path.resolve(d))));
const secretFiles = ['app.env', 'database.env', 'auth.env'];

for (const dir of uniqueDirs) {
  for (const file of secretFiles) {
    const fullPath = path.join(dir, file);
    if (fs.existsSync(fullPath)) {
      dotenv.config({ path: fullPath, override: true });
    }
  }
}

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
