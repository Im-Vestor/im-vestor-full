import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { areaRouter } from "./routers/area";
import { countryRouter } from "./routers/country";
import { investorRouter } from "./routers/investor";
import { projectRouter } from "./routers/project";
import { referralRouter } from "./routers/referral";
import { entrepreneurRouter } from "./routers/entrepreneur";

export const appRouter = createTRPCRouter({
  area: areaRouter,
  country: countryRouter,
  investor: investorRouter,
  project: projectRouter,
  referral: referralRouter,
  entrepreneur: entrepreneurRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
