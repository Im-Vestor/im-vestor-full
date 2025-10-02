/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import './src/env.js';

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,

  i18n: {
    locales: ['en-US', 'pt-PT', 'pt-BR'],
    defaultLocale: 'en-US',
  },
  transpilePackages: ['geist'],
  images: {
    remotePatterns: [
      {
        hostname: '**',
        protocol: 'https',
      },
    ],
  },
};

export default config;
