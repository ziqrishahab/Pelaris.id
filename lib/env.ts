/**
 * Environment Variable Validation for Frontend
 * 
 * Validates required environment variables at build/runtime.
 * Provides type-safe access to environment configuration.
 */

// ==================== TYPE DEFINITIONS ====================

interface EnvConfig {
  // API Configuration
  apiUrl: string;
  
  // Feature Flags
  isDev: boolean;
  isProd: boolean;
  
  // Optional Services
  sentryDsn?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ==================== VALIDATION ====================

/**
 * Validate all required environment variables
 */
function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      errors.push('NEXT_PUBLIC_API_URL is required in production');
    }
  }
  
  // Optional but recommended
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    warnings.push('NEXT_PUBLIC_SENTRY_DSN not set - error tracking disabled');
  }
  
  // Validate URL format if provided
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_API_URL);
    } catch {
      errors.push('NEXT_PUBLIC_API_URL is not a valid URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ==================== ENVIRONMENT CONFIG ====================

// ==================== URL CONSTANTS ====================

/**
 * Production API URL - centralized for consistency
 */
export const PRODUCTION_API_URL = 'https://api-pelaris.ziqrishahab.com';
export const PRODUCTION_API_BASE = `${PRODUCTION_API_URL}/api`;

/**
 * Get the API URL with proper fallbacks
 */
function getApiUrl(): string {
  // Explicit env always wins
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5100/api';
  }
  
  // Production fallback (should be set via env)
  return PRODUCTION_API_BASE;
}

/**
 * Get Socket URL (API URL without /api path)
 */
export function getSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5100';
  }
  
  return PRODUCTION_API_URL;
}

/**
 * Parsed and validated environment configuration
 */
export const env: EnvConfig = {
  // API
  apiUrl: getApiUrl(),
  
  // Environment flags
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  
  // Optional services
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  emailjsServiceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
  emailjsTemplateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
  emailjsPublicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
};

// ==================== INITIALIZATION ====================

/**
 * Run validation on module load (development only)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const result = validateEnv();
  
  if (result.warnings.length > 0) {
    console.warn('[Env] Warnings:', result.warnings);
  }
  
  if (!result.isValid) {
    console.error('[Env] Configuration errors:', result.errors);
  }
}

/**
 * Export validation function for testing/debugging
 */
export { validateEnv };

// ==================== TYPE EXPORTS ====================

export type { EnvConfig, ValidationResult };
