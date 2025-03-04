import {
  ArrowDownRight,
  ArrowRight,
  Briefcase,
  Compass,
  Handshake,
  Instagram,
  Linkedin,
  LogIn,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import router from "next/router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSignIn } from "@clerk/nextjs";
import { toast } from "sonner";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { LanguageSwitcher } from "~/components/ui/language-switcher";
import { useTranslation } from "~/hooks/useTranslation";

export default function Home() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const t = useTranslation();

  const { isLoaded, signIn, setActive } = useSignIn();

  const handleLogin = async () => {
    if (!isLoaded) return;

    setIsPending(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        await router.push("/profile");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(
          err.errors[0]?.message ?? "Failed to login. Please try again.",
        );
      } else {
        toast.error("Failed to login. Please try again.");
        console.error(JSON.stringify(err, null, 2));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <main className="relative min-h-screen bg-[#20222D]">
        <div className="absolute -top-[480px] left-1/2 h-[500px] w-[300px] -translate-x-1/2 rounded-full bg-[#E5CD82]/20 blur-3xl md:w-[800px]" />
        <header className="m-6 flex justify-end gap-2">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="outline" className="border-2 border-white/10">
              <LogIn className="h-6 w-6" />
              {t("signIn")}
            </Button>
          </Link>
        </header>
        <div className="mt-2 flex flex-col items-center text-center">
          <Image
            src="/logo/imvestor.png"
            alt="Imvestor"
            width={64}
            height={64}
          />
          <h3 className="mt-2 text-2xl font-medium">Im-Vestor</h3>
          <h1 className="mt-8 h-24 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-5xl font-medium tracking-wide text-transparent md:text-7xl">
            {t("weMeanBusiness")}
          </h1>
          <h1 className="mt-4 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-3xl font-medium text-transparent">
            {t("connectingEntrepreneursAndInvestors")}
          </h1>
          <Button
            onClick={async () => await router.push("/signup")}
            className="mt-8 rounded-full hover:opacity-75"
          >
            {t("getStarted")} <ArrowDownRight />
          </Button>
          <hr className="mt-24 h-0.5 w-full max-w-4xl rounded-full bg-neutral-100 opacity-5" />
          <div className="mt-24">
            <AnimatePresence>
              {!isVideoPlaying && (
                <div className="relative">
                  <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
                  <Image
                    src="/images/home-video.png"
                    className="relative cursor-pointer rounded-full transition-transform hover:scale-105"
                    alt="Imvestor"
                    width={240}
                    height={240}
                    onMouseEnter={() => setIsVideoPlaying(true)}
                  />
                </div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isVideoPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full max-w-2xl"
                >
                  <video
                    className="w-full rounded-lg"
                    autoPlay
                    controls
                    onClick={(e) => e.stopPropagation()}
                  >
                    <source
                      src="https://r1pf0du9n17u37qf.public.blob.vercel-storage.com/Investor-LfT3nXCTFM9WBb33OA3Oyq4qfGQlto.mp4"
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <h1 className="mt-24 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-6xl font-medium tracking-wide text-transparent">
            {t("whyChooseImVestor")}{" "}
            <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text">
              Im-Vestor?
            </span>
          </h1>
          <div className="mt-8 p-6">
            <div className="mx-auto mb-6 grid max-w-4xl grid-cols-1 gap-4 text-center md:grid-cols-3 md:grid-rows-3 md:text-start">
              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 p-6 backdrop-blur-md md:col-span-2">
                <div className="flex flex-col items-center text-center">
                  <Compass className="mx-auto h-12 w-12 text-[#E5CD82] md:mx-0" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#E5CD82]">
                    {t("navigateConfidence")}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t("navigateConfidenceDesc")}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t("navigateConfidenceShort")}
                  </p>
                </div>
              </div>
              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 p-6 backdrop-blur-md">
                <div className="flex flex-col items-center text-center">
                  <Handshake className="mx-auto h-12 w-12 text-[#E5CD82] md:mx-0" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#E5CD82]">
                    {t("smartMatching")}
                  </h2>
                  <p className="mt-2 text-gray-300">{t("smartMatchingDesc")}</p>
                </div>
              </div>

              <div className="row-span-1 rounded-2xl border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 p-6 backdrop-blur-md md:row-span-2">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Briefcase className="mx-auto h-12 w-12 text-[#E5CD82] md:mx-0" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#E5CD82]">
                    {t("seamlessNegotiations")}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t("seamlessNegotiationsDesc")}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t("seamlessNegotiationsShort")}
                  </p>
                </div>
              </div>

              <div className="hidden flex-col items-center justify-center md:flex">
                <Image
                  src={"/images/home-diamond.svg"}
                  alt="Imvestor"
                  width={180}
                  height={180}
                />
              </div>

              <div className="rounded-2xl border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 p-6 backdrop-blur-md">
                <div className="flex flex-col items-center text-center">
                  <Zap className="mx-auto h-12 w-12 text-[#E5CD82] md:mx-0" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#E5CD82]">
                    {t("pokeBoost")}
                  </h2>
                  <p className="mt-2 text-gray-300">{t("pokeBoostDesc")}</p>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 p-6 backdrop-blur-md md:col-span-2">
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck className="mx-auto h-12 w-12 text-[#E5CD82] md:mx-0" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#E5CD82]">
                    {t("investmentsProtected")}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t("investmentsProtectedDesc")}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t("investmentsProtectedShort")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative w-full">
            <Image
              src="/images/bg-stars.png"
              alt="Stars Background"
              fill
              priority
              unoptimized
              className="absolute inset-0 bg-cover bg-center"
            />
            <div className="relative z-10 mb-48">
              <h1 className="mx-4 mt-48 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-5xl font-medium tracking-wide md:mx-0">
                {t("businessRevolution")}{" "}
                <span className="text-[#EFD687]">{t("revolution")}</span>
              </h1>
              <h3 className="mt-4 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-2xl font-medium tracking-wide">
                {t("selectPath")}
              </h3>
              <div className="mt-8 p-6">
                <div className="mx-auto flex max-w-4xl flex-col justify-center gap-4 md:flex-row">
                  <div className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-[#363848] bg-opacity-30 px-6 py-16 backdrop-blur-md">
                    <Image
                      src={"/images/astronaut.png"}
                      alt="Imvestor"
                      width={64}
                      height={180}
                    />
                    <h2 className="mt-4 text-xl font-semibold text-[#EFD687]">
                      {t("entrepreneur")}
                    </h2>
                    <p className="mt-2 max-w-xs text-center text-gray-300">
                      {t("entrepreneurDesc")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-[#363848] bg-opacity-30 px-6 py-16 backdrop-blur-md">
                    <Image
                      src={"/images/rocket.png"}
                      alt="Imvestor"
                      width={82}
                      height={180}
                      className="mt-6"
                    />
                    <h2 className="mt-4 text-xl font-semibold text-[#EFD687]">
                      {t("investor")}
                    </h2>
                    <p className="mt-2 max-w-xs text-center text-gray-300">
                      {t("investorDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 flex w-full max-w-4xl flex-col justify-center gap-24 p-6 text-center md:flex-row md:text-start">
            <div className="w-full md:w-1/2">
              <h3 className="bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-4xl font-medium tracking-wide text-transparent">
                <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-transparent">
                  {t("joinUsNow").split(" ")[0]}
                </span>{" "}
                {t("joinUsNow").split(" ").slice(1).join(" ")}
              </h3>
              <p className="mt-8 max-w-96 text-2xl tracking-wide text-gray-300">
                {t("receiveUpdates")}{" "}
                <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-transparent">
                  {t("exclusiveUpdates")}
                </span>{" "}
                {t("beNotified")}{" "}
                <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-transparent">
                  {t("specialGift")}
                </span>{" "}
                {t("forBeingFirst")} 🎁.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="flex flex-col items-center justify-center rounded-2xl border-[1px] border-white/10 bg-[#20222c] bg-opacity-30 p-6 text-center backdrop-blur-md">
                <Image
                  src={"/images/home-diamond.svg"}
                  alt="Imvestor"
                  width={32}
                  height={180}
                />
                <h3 className="mt-4 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-2xl font-medium tracking-wide text-transparent">
                  {t("takeYourSpecialGift").split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-transparent">
                    {t("takeYourSpecialGift").split(" ").slice(-1)[0]}
                  </span>
                </h3>
                <p className="mt-2 text-xs text-gray-300">
                  {t("dontHaveAccount")}{" "}
                  <Link
                    href="/signup"
                    className="text-[#F0D687] underline hover:opacity-70"
                  >
                    {t("createOne")}
                  </Link>
                </p>
                <Input
                  className="mt-8"
                  placeholder={t("enterYourEmail")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  className="mt-4"
                  placeholder={t("password")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="mt-4 flex w-full items-center justify-between">
                  <Link
                    href="/reset-password"
                    className="text-xs underline hover:opacity-70"
                  >
                    {t("forgotPassword")}
                  </Link>
                  <Button onClick={handleLogin} disabled={isPending}>
                    {isPending ? t("loggingIn") : t("login")} <ArrowRight />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <footer className="mx-auto mb-16 mt-32 w-full max-w-7xl px-12">
            <hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
            <div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
              <p>{t("followUs")}</p>
              <Link href={"#"} className="hover:opacity-70">
                <Linkedin className="ml-2 h-6 w-6" />
              </Link>
              <Link href={"#"} className="hover:opacity-70">
                <Instagram className="h-6 w-6" />
              </Link>
              <p>@Im-Vestor</p>
              <Link
                href={"mailto:media@Im-Vestor.com"}
                className="hover:opacity-70"
              >
                <p>media@Im-Vestor.com</p>
              </Link>
            </div>
            <hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
            <div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
              <Link href={"#"} className="hover:opacity-70">
                <p>{t("termsAndConditions")}</p>
              </Link>
              <p>{t("copyright")}</p>
            </div>
            <p className="mt-4 text-center text-xs text-gray-700">
              The material presented via this website is for informational
              purposes only. Nothing in this website constitutes a solicitation
              for the purchase or sale of any financial product or service.
              Material presented on this website does not constitute a public
              offering of securities or investment management services in any
              jurisdiction. Investing in startup and early stage companies
              involves risks, including loss of capital, illiquidity, lack of
              dividends and dilution, and it should be done only as part of a
              diversified portfolio. The Investments presented in this website
              are suitable only for investors who are sufficiently sophisticated
              to understand these risks and make their own investment decisions.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
