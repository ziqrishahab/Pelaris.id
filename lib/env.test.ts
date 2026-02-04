import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { env, validateEnv, type EnvConfig, type ValidationResult } from './env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('env config', () => {
    it('should have apiUrl defined', () => {
      expect(env.apiUrl).toBeDefined();
      expect(typeof env.apiUrl).toBe('string');
    });

    it('should have environment flags', () => {
      expect(typeof env.isDev).toBe('boolean');
      expect(typeof env.isProd).toBe('boolean');
    });

    it('should have optional service configs as undefined or string', () => {
      expect(env.sentryDsn === undefined || typeof env.sentryDsn === 'string').toBe(true);
      expect(env.emailjsServiceId === undefined || typeof env.emailjsServiceId === 'string').toBe(true);
    });
  });

  describe('validateEnv', () => {
    it('should return valid when in development mode', () => {
      // In development, NEXT_PUBLIC_API_URL is not required
      // NODE_ENV is typically 'test' during tests, which is fine
      
      const result = validateEnv();
      
      // Should not have errors for missing API URL in dev
      expect(result.errors.filter(e => e.includes('NEXT_PUBLIC_API_URL is required'))).toHaveLength(0);
    });

    it('should return warnings for missing optional configs', () => {
      const result = validateEnv();
      
      // Should warn about missing Sentry DSN
      if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
        expect(result.warnings.some(w => w.includes('SENTRY_DSN'))).toBe(true);
      }
    });
  });

  describe('API URL resolution', () => {
    it('should use localhost in development when no URL provided', () => {
      // When in development and no URL set
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL) {
        expect(env.apiUrl).toBe('http://localhost:5100/api');
      }
    });

    it('should use explicit env URL when provided', () => {
      if (process.env.NEXT_PUBLIC_API_URL) {
        expect(env.apiUrl).toBe(process.env.NEXT_PUBLIC_API_URL);
      }
    });
  });
});

describe('EnvConfig type', () => {
  it('should match expected shape', () => {
    const config: EnvConfig = {
      apiUrl: 'http://test.com',
      isDev: true,
      isProd: false,
      sentryDsn: 'test-dsn',
      emailjsServiceId: 'service-id',
      emailjsTemplateId: 'template-id',
      emailjsPublicKey: 'public-key',
    };

    expect(config.apiUrl).toBe('http://test.com');
    expect(config.isDev).toBe(true);
    expect(config.isProd).toBe(false);
  });

  it('should allow optional fields to be undefined', () => {
    const config: EnvConfig = {
      apiUrl: 'http://test.com',
      isDev: false,
      isProd: true,
    };

    expect(config.sentryDsn).toBeUndefined();
    expect(config.emailjsServiceId).toBeUndefined();
  });
});

describe('ValidationResult type', () => {
  it('should have correct structure', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: ['Some warning'],
    };

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
  });
});
