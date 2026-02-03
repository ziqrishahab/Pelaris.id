/**
 * Frontend Logger Utility
 * Only logs in development, silent in production
 * Errors are always sent to Sentry in production
 */

import * as Sentry from '@sentry/nextjs';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    } else {
      // Send warnings to Sentry in production
      Sentry.captureMessage(args.map(a => String(a)).join(' '), 'warning');
    }
  },

  error: (...args: any[]) => {
    // Always log errors to console
    console.error(...args);
    
    // Send to Sentry in production
    if (!isDevelopment) {
      const error = args[0];
      if (error instanceof Error) {
        Sentry.captureException(error, {
          extra: { additionalArgs: args.slice(1) }
        });
      } else {
        Sentry.captureMessage(args.map(a => String(a)).join(' '), 'error');
      }
    }
  },
};
