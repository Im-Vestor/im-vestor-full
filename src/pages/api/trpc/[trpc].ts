import * as trpcNext from '@trpc/server/adapters/next';
import { createContext } from 'src/server/context';
import { appRouter } from '~/server/api/root';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: createContext,
});
