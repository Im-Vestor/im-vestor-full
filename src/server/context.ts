import type * as trpc from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import { getAuth } from '@clerk/nextjs/server';
import { db } from './db';
import type { UserType } from '@prisma/client';

// Define the session claims type
type SessionClaims = {
  publicMetadata?: {
    userType?: UserType;
    userIsAdmin?: boolean;
  };
};

export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
  try {
    const auth = getAuth(opts.req);

    // Cast the session claims to our defined type
    const sessionClaims = auth.sessionClaims as SessionClaims;

    // Add additional validation to ensure auth is properly loaded
    if (!auth.userId && !auth.sessionId) {
      // If no userId or sessionId, return empty auth to prevent 401 errors
      return {
        auth: {
          userId: null,
          sessionId: null,
          sessionClaims: null,
          getToken: async () => null,
          has: () => false,
        },
        db,
      };
    }

    return {
      auth: {
        ...auth,
        sessionClaims,
      },
      db,
    };
  } catch (error) {
    // If there's an error getting auth, return empty auth object
    // This prevents the entire request from failing due to auth issues
    console.warn('Auth context creation failed:', error);
    return {
      auth: {
        userId: null,
        sessionId: null,
        sessionClaims: null,
        getToken: async () => null,
        has: () => false,
      },
      db,
    };
  }
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
