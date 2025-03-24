import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { areaRouter } from "./routers/area";
import { countryRouter } from "./routers/country";
import { investorRouter } from "./routers/investor";
import { projectRouter } from "./routers/project";
import { referralRouter } from "./routers/referral";
import { entrepreneurRouter } from "./routers/entrepreneur";
import { userRouter } from "./routers/user";
import { adminRouter } from "./routers/admin";
import { partnerRouter } from "./routers/partner";
import { connectionRouter } from "./routers/connection";

export const appRouter = createTRPCRouter({
  area: areaRouter,
  country: countryRouter,
  investor: investorRouter,
  partner: partnerRouter,
  project: projectRouter,
  referral: referralRouter,
  entrepreneur: entrepreneurRouter,
  user: userRouter,
  admin: adminRouter,
  connection: connectionRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
