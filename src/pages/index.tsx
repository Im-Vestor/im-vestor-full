'use client';

import {
  ArrowRight,
  Briefcase,
  Compass,
  Handshake,
  Instagram,
  Linkedin,
  ShieldCheck,
  Zap,
  Play,
  ArrowUpRight,
  LogIn,
  Flag,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '~/components/ui/button';
import { useState, useEffect } from 'react';
import { useTranslation } from '~/hooks/use-translation';
import { LanguageSwitcher } from '~/components/ui/language-switcher';
import { useRouter } from 'next/router';

const StarField = dynamic(() => import('~/components/ui/StarField'), {
  ssr: false,
  loading: () => <div className="relative w-full overflow-hidden bg-black min-h-[400px]" />,
});

const VideoModal = dynamic(() => import('~/components/landing/VideoModal'), {
  ssr: false,
});

const LoginSection = dynamic(() => import('~/components/landing/LoginSection'), {
  ssr: false,
  loading: () => <div className="min-h-[400px]" />,
});

const PartnersMarquee = dynamic(() => import('~/components/landing/PartnersMarquee'), {
  ssr: false,
  loading: () => <div className="min-h-[300px]" />,
});

export default function Home() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const t = useTranslation();
  const router = useRouter();

  useEffect(() => {
    if (isVideoPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVideoPlaying]);

  return (
    <div className="w-full">
      <main className="min-h-screen pt-32">
        <div className="absolute -top-[500px] left-1/2 h-[600px] w-[500px] -translate-x-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl md:w-[1000px] z-[10] hidden md:block" />
        <header className="md:m-6 flex justify-end gap-2 fixed top-0 md:top-10 md:right-2 bg-background/90 border md:border-none md:bg-transparent border-white/10 w-full sm:right-40 z-50 py-2 px-2 md:py-4 md:px-6">
          <div className="flex items-center justify-between md:justify-end w-full">
            <div className="flex items-center justify-start gap-2 md:hidden">
              <Image src="/logo/imvestor.png" alt="Imvestor" width={24} height={24} />
              <h1 className="text-xs font-bold text-white">Im-Vestor</h1>
            </div>
            <div className="flex items-center justify-end gap-2">
              <LanguageSwitcher />
              <Link href="/login">
                <Button variant="outline" className="opacity-100 border-2 border-white/15 hover:opacity-80">
                  <LogIn className="h-6 w-6" />
                  {t('signIn')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex w-full flex-col items-center text-center">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Image src="/logo/imvestor.png" alt="Imvestor" width={64} height={64} />
            </div>
            <span className="mt-2 text-2xl font-medium">
              Im-Vestor
            </span>
            <h1 className="mt-8 md:mt-16 px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              {t('weMeanBusiness')}
            </h1>
            <span className="mt-4 md:mt-6 w-full md:w-2/3 px-4 font-['Segoe UI'] text-base md:text-xl leading-[140%] text-white/50 font-light">
              {t('connectingEntrepreneursAndInvestors')}
            </span>
            <div>
              <Button
                onClick={async () => await router.push('/sign-up')}
                className="mt-8 md:mt-16 rounded-full hover:opacity-75 hover:scale-x-105 transition-all duration-500"
              >
                {t('getStarted')} <ArrowUpRight />
              </Button>
            </div>
          </div>

          <div className="my-16 md:my-32 w-full relative">
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
            <div
              onClick={() => setIsVideoPlaying(true)}
              className="relative aspect-video mx-auto max-w-6xl px-4 border-2 border-white/10 bg-background group border-b-background p-6 rounded-2xl cursor-pointer overflow-hidden z-10 hover:scale-[1.02] hover:opacity-95 active:scale-[0.98] transition-transform duration-300"
            >
              <div className="absolute inset-0 overflow-hidden opacity-70">
                <Image
                  src="/images/video-thumb.png"
                  className="rounded-xl w-full object-scale-down mt-14"
                  alt="Imvestor"
                  fill
                  priority
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="rounded-full bg-primary p-3 animate-pulse-glow hover:scale-110 active:scale-95 transition-transform duration-200">
                  <Play className="h-12 w-12 text-background" />
                </div>
              </div>
            </div>

            <VideoModal isOpen={isVideoPlaying} onClose={() => setIsVideoPlaying(false)} />

            <div className="absolute -top-20 left-1/2 h-[90%] w-[80%] -translate-x-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl opacity-30" />
          </div>

          <div className="py-12 md:py-24 w-full px-4 bg-gradient-to-b from-background to-black">
            <h2 className="mb-8 md:mb-12 px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
              {t('whyChooseImVestor')}{' '}
              <span className="bg-primary-gradient bg-clip-text text-transparent">Im-Vestor</span>
            </h2>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 text-center md:grid-cols-3 md:grid-rows-3 md:text-start relative opacity-70">
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center animate-breathe">
                <div className="absolute inset-0 flex items-center justify-center animate-breathe-slow">
                  <Image src="/images/vector-bg-features.svg" alt="Imvestor" fill priority />
                  <div className="absolute top-1/2 left-1/2 h-2/3 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl" />
                </div>
              </div>
              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#38bdf8]/10 to-background/80 p-6 backdrop-blur-md md:col-span-2 relative overflow-hidden group hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#38bdf8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#38bdf8]/20 blur-md animate-breathe" />
                    <Compass className="mx-auto h-12 w-12 text-[#38bdf8] relative z-10 md:mx-0" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#38bdf8]">
                    {t('navigateConfidence')}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t('navigateConfidenceDesc')}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t('navigateConfidenceShort')}
                  </p>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#a855f7]/10 to-background/80 p-6 backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#a855f7]/20 blur-md animate-breathe" />
                    <Handshake className="mx-auto h-12 w-12 text-[#a855f7] relative z-10 md:mx-0" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#a855f7]">
                    {t('smartMatching')}
                  </h2>
                  <p className="mt-2 text-gray-300">{t('smartMatchingDesc')}</p>
                </div>
              </div>

              <div className="row-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#22d3ee]/10 to-background/80 p-6 backdrop-blur-md md:row-span-2 relative overflow-hidden group hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#22d3ee]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex h-full flex-col items-center justify-center text-center relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#22d3ee]/20 blur-md animate-breathe" />
                    <Briefcase className="mx-auto h-12 w-12 text-[#22d3ee] relative z-10 md:mx-0" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#22d3ee]">
                    {t('seamlessNegotiations')}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t('seamlessNegotiationsDesc')}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t('seamlessNegotiationsShort')}
                  </p>
                </div>
              </div>

              <div className="hidden flex-col items-center justify-center md:flex">
                <Image src={'/images/home-diamond.svg'} alt="Imvestor" width={180} height={180} />
              </div>

              <div className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#facc15]/10 to-background/80 p-6 backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_20px_rgba(250,204,21,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#facc15]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#facc15]/20 blur-md animate-breathe" />
                    <Zap className="mx-auto h-12 w-12 text-[#facc15] relative z-10 md:mx-0" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#facc15]">{t('pokeBoost')}</h2>
                  <p className="mt-2 text-gray-300">{t('pokeBoostDesc')}</p>
                </div>
              </div>

              <div className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#f87171]/10 to-background/80 p-6 backdrop-blur-md md:col-span-2 relative overflow-hidden group hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_20px_rgba(248,113,113,0.3)] transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f87171]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-[#f87171]/20 blur-md animate-breathe" />
                    <ShieldCheck className="mx-auto h-12 w-12 text-[#f87171] relative z-10 md:mx-0" />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#f87171]">
                    {t('investmentsProtected')}
                  </h2>
                  <p className="mt-2 hidden text-gray-300 md:block">
                    {t('investmentsProtectedDesc')}
                  </p>
                  <p className="mt-2 block text-gray-300 md:hidden">
                    {t('investmentsProtectedShort')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <StarField>
            <div className="relative w-full overflow-hidden">
              <div className="relative z-10 mb-20 px-4">
                <h2 className="mb-8 md:mb-12 mx-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent md:mx-0">
                  {t('businessRevolution')}
                </h2>
                <div className="p-6">
                  <div className="mx-auto flex max-w-4xl flex-col justify-center gap-10 md:flex-row">
                    <div className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-background/20 bg-opacity-30 px-6 py-16 backdrop-blur-md relative overflow-hidden group hover:scale-105 hover:brightness-110 hover:shadow-[0_0_25px_rgba(229,205,130,0.3)] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="relative z-10 group-hover:-translate-y-2 transition-transform duration-300">
                        <Image
                          src={'/images/astronaut.png'}
                          alt="Imvestor"
                          width={64}
                          height={180}
                        />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-primary relative z-10">
                        {t('entrepreneur')}
                      </h2>
                      <p className="mt-2 max-w-xs text-center text-gray-300 relative z-10">
                        {t('entrepreneurDesc')}
                      </p>

                      <Link className="mt-8 z-50" href="/sign-up/entrepreneur">
                        <Button>
                          {t('joinAs')} {t('entrepreneur')}
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                    <div className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-background/20 bg-opacity-30 px-6 py-16 backdrop-blur-md relative overflow-hidden group hover:scale-105 hover:brightness-110 hover:shadow-[0_0_25px_rgba(229,205,130,0.3)] transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <div className="relative z-10 mt-6 group-hover:-translate-y-2 transition-transform duration-300">
                        <Image src={'/images/rocket.png'} alt="Imvestor" width={82} height={180} />
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-primary relative z-10">
                        {t('investor')}
                      </h2>
                      <p className="mt-2 max-w-xs text-center text-gray-300 relative z-10">
                        {t('investorDesc')}
                      </p>

                      <Link className="mt-8 z-50" href="/sign-up/investor">
                        <Button>
                          {t('joinAs')} {t('investor')}
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </StarField>

          <StarField>
            <LoginSection />
          </StarField>

          <StarField>
            <PartnersMarquee />
          </StarField>

          <StarField>
            <footer className="mx-auto mb-16 mt-16 md:mt-32 w-full max-w-7xl px-6 md:px-12">
              <hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
              <div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
                <p>{t('followUs')}</p>
                <Link
                  href="https://www.linkedin.com/in/guilherme-beauvalet-3227b3291"
                  className="hover:opacity-70"
                >
                  <Linkedin className="ml-2 h-6 w-6" />
                </Link>
                <Link href="https://www.instagram.com/im_vestor/" className="hover:opacity-70">
                  <Instagram className="h-6 w-6" />
                </Link>
                <p>@Im-Vestor</p>
                <Link href={'mailto:help@im-vestor.com'} className="hover:opacity-70">
                  <p>help@im-vestor.com</p>
                </Link>
              </div>
              <hr className="h-0.5 w-full bg-neutral-100 opacity-10" />
              <div className="my-8 flex w-full flex-col items-center gap-6 text-gray-500 md:flex-row">
                <Link href="/terms" className="hover:opacity-70">
                  <p>{t('termsAndConditions')}</p>
                </Link>
                <p>{t('copyright')}</p>
              </div>
              <p className="mt-4 text-center text-xs text-gray-700">{t('legalDisclaimer')}</p>
            </footer>
          </StarField>
        </div>
      </main>
    </div>
  );
}
