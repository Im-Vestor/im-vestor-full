import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from '../context';
import { performanceTracker } from '~/utils/performance-logger';

const isDevelopment = process.env.NODE_ENV === 'development';

// Performance tracking utilities
const performanceColors = {
  fast: '\x1b[32m',     // Green
  medium: '\x1b[33m',   // Yellow
  slow: '\x1b[31m',     // Red
  reset: '\x1b[0m',
};

function getPerformanceColor(ms: number): string {
  if (ms < 100) return performanceColors.fast;
  if (ms < 500) return performanceColors.medium;
  return performanceColors.slow;
}

function formatDuration(ms: number): string {
  const color = getPerformanceColor(ms);
  return `${color}${ms}ms${performanceColors.reset}`;
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

// Performance logging middleware
const performanceLogger = t.middleware(async ({ path, type, next, rawInput }) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  if (isDevelopment) {
    console.log(`\n🔵 [${timestamp}] ${type.toUpperCase()} ${path}`);
    if (rawInput && Object.keys(rawInput).length > 0) {
      console.log(`   Input:`, JSON.stringify(rawInput).substring(0, 100));
    }
  }

  try {
    const result = await next();
    const duration = Date.now() - start;

    // Track performance metrics
    if (isDevelopment) {
      performanceTracker.log({
        endpoint: path,
        duration,
        timestamp: new Date(),
        success: true,
        input: rawInput,
      });

      console.log(`✅ [${timestamp}] ${type.toUpperCase()} ${path} - ${formatDuration(duration)}`);

      // Flag slow endpoints for optimization
      if (duration > 500) {
        console.warn(`⚠️  SLOW ENDPOINT DETECTED: ${path} took ${duration}ms`);
        console.warn(`   Consider optimizing queries, adding indexes, or implementing caching`);
      }
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;

    // Track failed requests
    if (isDevelopment) {
      performanceTracker.log({
        endpoint: path,
        duration,
        timestamp: new Date(),
        success: false,
        input: rawInput,
      });

      console.error(`❌ [${timestamp}] ${type.toUpperCase()} ${path} - ${formatDuration(duration)}`);
      console.error(`   Error:`, error instanceof Error ? error.message : 'Unknown error');
    }

    throw error;
  }
});

// check if the user is signed in, otherwise throw an UNAUTHORIZED code
const isAuthed = t.middleware(({ next, ctx }) => {
  // Add more robust checking for auth state
  if (!ctx.auth?.userId) {
    // Log the auth state for debugging (only in development)
    if (isDevelopment) {
      console.warn('Auth middleware: Missing auth or userId', {
        hasAuth: !!ctx.auth,
        hasUserId: !!ctx.auth?.userId,
        hasSessionId: !!ctx.auth?.sessionId,
      });
    }

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Please ensure you are logged in and try again.'
    });
  }
  return next({
    ctx: {
      auth: ctx.auth,
    },
  });
});

// check if the user is an admin
const isAdmin = t.middleware(async ({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.auth.sessionClaims?.publicMetadata?.userIsAdmin !== true) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'User is not an admin' });
  }

  return next({
    ctx: {
      auth: ctx.auth,
      db: ctx.db,
    },
  });
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Apply performance logging to all procedures
export const publicProcedure = t.procedure.use(performanceLogger);
export const protectedProcedure = t.procedure.use(performanceLogger).use(isAuthed);
export const adminProcedure = t.procedure.use(performanceLogger).use(isAuthed).use(isAdmin);
