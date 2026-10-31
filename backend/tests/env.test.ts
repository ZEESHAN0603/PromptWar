import { describe, it, expect } from 'vitest';
import { validateEnv, getSanitizedEnv } from '../src/config/env.js';

describe('Environment Configuration Validation', () => {
  it('should validate and parse valid environment variables', () => {
    const rawEnv = {
      PORT: '4000',
      NODE_ENV: 'production' as const,
      FRONTEND_URL: 'https://eventpilot.ai',
      DATABASE_URL: 'postgresql://postgres:secret@db.supabase.co:6543/postgres',
      DIRECT_URL: 'postgresql://postgres:secret@db.supabase.co:5432/postgres',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-token-12345',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret-key-987654321',
      JWT_SECRET: 'super-secure-production-jwt-secret-string-at-least-32-chars',
      AI_SERVICE_URL: 'http://ai:8000',
    };

    const config = validateEnv(rawEnv as NodeJS.ProcessEnv);

    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe('production');
    expect(config.DATABASE_URL).toBe(rawEnv.DATABASE_URL);
    expect(config.JWT_SECRET).toBe(rawEnv.JWT_SECRET);
  });

  it('should reject invalid PORT values', () => {
    const rawEnv = {
      PORT: 'invalid-port',
      DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/db',
    };

    expect(() => validateEnv(rawEnv as NodeJS.ProcessEnv)).toThrow(
      /Environment Configuration Error/
    );
  });

  it('should reject short JWT_SECRET values', () => {
    const rawEnv = {
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/db',
      JWT_SECRET: 'short',
    };

    expect(() => validateEnv(rawEnv as NodeJS.ProcessEnv)).toThrow(
      /JWT_SECRET must be at least 16 characters/
    );
  });

  it('should mask sensitive credentials in sanitized config output', () => {
    const validConfig = {
      PORT: 5000,
      NODE_ENV: 'development' as const,
      FRONTEND_URL: 'http://localhost:3000',
      DATABASE_URL: 'postgresql://postgres:supersecretpassword@localhost:5432/db',
      DIRECT_URL: 'postgresql://postgres:supersecretpassword@localhost:5432/db',
      SUPABASE_URL: 'https://sample.supabase.co',
      SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      SUPABASE_SERVICE_ROLE_KEY: 'secret-service-role-key-never-leak-in-logs',
      JWT_SECRET: 'topsecretjwtpasswordstring1234567890',
      AI_SERVICE_URL: 'http://localhost:8000',
    };

    const sanitized = getSanitizedEnv(validConfig);

    expect(sanitized.DATABASE_URL).not.toContain('supersecretpassword');
    expect(sanitized.DATABASE_URL).toContain('...');
    expect(sanitized.SUPABASE_SERVICE_ROLE_KEY).not.toContain('never-leak-in-logs');
    expect(sanitized.JWT_SECRET).not.toContain('topsecretjwtpasswordstring1234567890');
    expect(sanitized.PORT).toBe(5000);
    expect(sanitized.NODE_ENV).toBe('development');
  });
});
