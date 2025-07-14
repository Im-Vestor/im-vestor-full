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
  const auth = await getAuth(opts.req);

  // Cast the session claims to our defined type
  const sessionClaims = auth.sessionClaims as SessionClaims;

  return {
    auth: {
      ...auth,
      sessionClaims,
    },
    db
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
