import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_BUCKET: z.string(),
    CLOUDFLARE_ACCESS_KEY_ID: z.string(),
    CLOUDFLARE_SECRET_ACCESS_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    DAILY_API_KEY: z.string(),
    DAILY_REST_DOMAIN: z.string(),
    STRIPE_PUBLISHABLE_KEY: z.string(),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_POKE_PRICE_ID: z.string(),
    STRIPE_BOOST_PRICE_ID: z.string(),
    STRIPE_DAILY_PITCH_TICKET_PRICE_ID: z.string(),
    STRIPE_HYPER_TRAIN_TICKET_PRICE_ID: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    NOTION_API_KEY: z.string(),
    NOTION_PAGE_ID_ENTREPRENEUR: z.string().optional(),
    NOTION_PAGE_ID_INVESTOR: z.string().optional(),
    NOTION_PAGE_ID_PARTNER: z.string().optional(),
    NOTION_NEWS_PAGE_ID: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
    NEXT_PUBLIC_GA_ID: z.string(),
    NEXT_PUBLIC_DAILY_DOMAIN: z.string(),
    NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
    CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_DAILY_DOMAIN: process.env.NEXT_PUBLIC_DAILY_DOMAIN,
    DAILY_API_KEY: process.env.DAILY_API_KEY,
    DAILY_REST_DOMAIN: process.env.DAILY_REST_DOMAIN,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_POKE_PRICE_ID: process.env.STRIPE_POKE_PRICE_ID,
    STRIPE_BOOST_PRICE_ID: process.env.STRIPE_BOOST_PRICE_ID,
    STRIPE_DAILY_PITCH_TICKET_PRICE_ID: process.env.STRIPE_DAILY_PITCH_TICKET_PRICE_ID,
    STRIPE_HYPER_TRAIN_TICKET_PRICE_ID: process.env.STRIPE_HYPER_TRAIN_TICKET_PRICE_ID,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NOTION_API_KEY: process.env.NOTION_API_KEY,
    NOTION_PAGE_ID_ENTREPRENEUR: process.env.NOTION_PAGE_ID_ENTREPRENEUR,
    NOTION_PAGE_ID_INVESTOR: process.env.NOTION_PAGE_ID_INVESTOR,
    NOTION_PAGE_ID_PARTNER: process.env.NOTION_PAGE_ID_PARTNER,
    NOTION_NEWS_PAGE_ID: process.env.NOTION_NEWS_PAGE_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
