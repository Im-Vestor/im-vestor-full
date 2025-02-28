import { type AppType } from "next/app";
import { Roboto } from "next/font/google";

import { api } from "~/utils/api";

import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";
import "~/styles/globals.css";
import { Toaster } from "sonner";
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700"],
  display: "swap",
  variable: "--font-sans",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider>
      <Toaster />
      <Head>
        <title>Imvestor</title>
        <meta name="description" content="Imvestor" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className={`${roboto.className} ${roboto.variable} bg-gradient-to-b from-[#20212B] to-[#252935] text-white`}
      >
        <Component {...pageProps} />
      </div>
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
