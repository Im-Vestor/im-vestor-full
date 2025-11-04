/**
 * Logger utility that only logs in development mode
 * This helps improve performance in production by removing unnecessary console calls
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but only in development format them with JSON.stringify
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log minimal error info
      const errorMessage = args[0] instanceof Error
        ? args[0].message
        : typeof args[0] === 'string'
          ? args[0]
          : 'An error occurred';
      console.error(errorMessage);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};


