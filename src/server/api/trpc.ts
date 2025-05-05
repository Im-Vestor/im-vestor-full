import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { type Context } from '../context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

// check if the user is signed in, otherwise throw an UNAUTHORIZED code
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
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

  /*   if (ctx.auth.sessionClaims?.publicMetadata?.userIsAdmin !== true) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'User is not an admin' });
    } */

  return next({
    ctx: {
      auth: ctx.auth,
      db: ctx.db,
    },
  });
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);
