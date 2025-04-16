import type * as trpc from '@trpc/server';
import type * as trpcNext from '@trpc/server/adapters/next';
import { getAuth } from '@clerk/nextjs/server';
import { db } from './db';

export const createContext = async (opts: trpcNext.CreateNextContextOptions) => {
  return { auth: getAuth(opts.req), db };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
