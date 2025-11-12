import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';
import { areaRouter } from './routers/area';
import { countryRouter } from './routers/country';
import { investorRouter } from './routers/investor';
import { projectRouter } from './routers/project';
import { referralRouter } from './routers/referral';
import { entrepreneurRouter } from './routers/entrepreneur';
import { userRouter } from './routers/user';
import { partnerRouter } from './routers/partner';
import { connectionRouter } from './routers/connection';
import { notificationsRouter } from './routers/notifications';
import { meetingRouter } from './routers/meeting';
import { preferredHoursRouter } from './routers/preferred-hours';
import { supportRouter } from './routers/support';
import { negotiationRouter } from './routers/negotiation';
import { vcGroupRouter } from './routers/vc-group';
import { incubatorRouter } from './routers/incubator';
import { offerRouter } from './routers/offers';
import { potentialUserRouter } from './routers/potentialUser';
import { newsRouter } from './routers/news';
import { pokeRouter } from './routers/poke';
import { boostRouter } from './routers/boost';
import { recommendationsRouter } from './routers/recommendations';
import { adminRouter } from './routers/admin';
import { hypertrainRouter } from './routers/hypertrain';
import { contentRouter } from './routers/content';
import { validationRouter } from './routers/validation';

export const appRouter = createTRPCRouter({
  area: areaRouter,
  country: countryRouter,
  offer: offerRouter,
  investor: investorRouter,
  partner: partnerRouter,
  project: projectRouter,
  referral: referralRouter,
  entrepreneur: entrepreneurRouter,
  user: userRouter,
  connection: connectionRouter,
  notifications: notificationsRouter,
  meeting: meetingRouter,
  preferredHours: preferredHoursRouter,
  support: supportRouter,
  negotiation: negotiationRouter,
  vcGroup: vcGroupRouter,
  incubator: incubatorRouter,
  potentialUser: potentialUserRouter,
  news: newsRouter,
  poke: pokeRouter,
  boost: boostRouter,
  recommendations: recommendationsRouter,
  admin: adminRouter,
  hypertrain: hypertrainRouter,
  content: contentRouter,
  validation: validationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
