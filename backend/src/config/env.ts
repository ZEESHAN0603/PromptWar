import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from process.cwd() and backend/.env directory
dotenv.config();
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

/**
 * Environment variables schema definition using Zod
 */
export const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .refine(
      (val) => {
        const parsed = parseInt(val, 10);
        return !isNaN(parsed) && parsed > 0 && parsed <= 65535;
      },
      { message: 'PORT must be a valid integer between 1 and 65535' }
    )
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FRONTEND_URL: z
    .string()
    .default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .default('postgresql://postgres:postgres@localhost:5432/eventpilot'),
  DIRECT_URL: z
    .string()
    .optional(),
  SUPABASE_URL: z
    .string()
    .url('SUPABASE_URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  SUPABASE_ANON_KEY: z
    .string()
    .optional()
    .or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional()
    .or(z.literal('')),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters for security')
    .default('eventpilot-ai-default-jwt-secret-min-32-chars-ok'),
  AI_SERVICE_URL: z
    .string()
    .url('AI_SERVICE_URL must be a valid URL')
    .default('http://localhost:8000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validates raw environment dictionary against schema
 */
export function validateEnv(sourceEnv: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = envSchema.safeParse(sourceEnv);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    const errorMessage = `❌ [Environment Configuration Error] Invalid or missing environment variables:\n${errorDetails}`;
    throw new Error(errorMessage);
  }

  return result.data;
}

/**
 * Mask sensitive values so they are never printed in plaintext logs
 */
export function getSanitizedEnv(config: EnvConfig): Record<string, string | number> {
  const mask = (val?: string) => {
    if (!val) return '(empty)';
    if (val.length <= 8) return '********';
    return `${val.substring(0, 4)}...${val.substring(val.length - 4)}`;
  };

  return {
    PORT: config.PORT,
    NODE_ENV: config.NODE_ENV,
    FRONTEND_URL: config.FRONTEND_URL,
    DATABASE_URL: mask(config.DATABASE_URL),
    DIRECT_URL: config.DIRECT_URL ? mask(config.DIRECT_URL) : '(not configured)',
    SUPABASE_URL: config.SUPABASE_URL || '(not configured)',
    SUPABASE_ANON_KEY: config.SUPABASE_ANON_KEY ? mask(config.SUPABASE_ANON_KEY) : '(not configured)',
    SUPABASE_SERVICE_ROLE_KEY: config.SUPABASE_SERVICE_ROLE_KEY ? mask(config.SUPABASE_SERVICE_ROLE_KEY) : '(not configured)',
    JWT_SECRET: mask(config.JWT_SECRET),
    AI_SERVICE_URL: config.AI_SERVICE_URL,
  };
}

// Global cached config
export const env = validateEnv();
