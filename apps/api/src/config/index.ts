import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8000),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:8000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/vulnsight?schema=public'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  ALLOW_PRIVATE_TARGETS: z.enum(['true', 'false']).default('false'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').default('vulnsight_ai_super_secret_master_key_32_bytes!'),
  JWT_SECRET: z.string().min(16).default('qyberveil_jwt_super_secret_signing_key_2026_dev'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
