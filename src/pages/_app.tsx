import { type AppType } from 'next/app';
import { Roboto } from 'next/font/google';

import { api } from '~/utils/api';

import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';

import { ClerkProvider } from '@clerk/nextjs';
import Head from 'next/head';
import '~/styles/globals.css';
import { Toaster } from 'sonner';
import { LanguageProvider } from '~/contexts/LanguageContext';
import { GoogleAnalytics } from '~/lib/GoogleAnalytics';
import { CookieConsent } from '~/components/ui/cookie-consent';
import { useEffect, useState } from 'react';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '700'],
  display: 'swap',
  variable: '--font-sans',
});

const MyApp: AppType = ({ Component, pageProps }) => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      const settings = JSON.parse(consent);
      setAnalyticsEnabled(settings.analytics);
    }
  }, []);

  return (
    <ClerkProvider>
      <LanguageProvider>
        <Toaster theme="dark" />
        {analyticsEnabled && (
          <>
            <SpeedInsights />
            <Analytics />
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? ''} />
          </>
        )}
        <Head>
          <title>Im-Vestor</title>
          <meta name="description" content="Imvestor" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={`${roboto.className} ${roboto.variable} bg-background text-ui-text`}>
          <Component {...pageProps} />
        </div>
        <CookieConsent />
      </LanguageProvider>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
