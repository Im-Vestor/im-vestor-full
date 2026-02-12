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
import { motion } from 'framer-motion';
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

const fadeIn = {
  initial: {
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.25, 0.1, 0.25, 1],
      opacity: { duration: 0.6 },
      filter: { duration: 0.8 },
      scale: { duration: 0.8 },
    },
  },
};

const fadeInScale = {
  initial: {
    opacity: 0,
    scale: 0.85,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1.2,
      ease: [0.34, 1.56, 0.64, 1],
      opacity: { duration: 0.8 },
      filter: { duration: 0.8 },
    },
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const popUp = {
  initial: {
    opacity: 0,
    scale: 0.8,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.34, 1.56, 0.64, 1],
      opacity: { duration: 0.6 },
      filter: { duration: 0.6 },
    },
  },
};

const rotateIn = {
  initial: {
    opacity: 0,
    rotate: -15,
    scale: 0.9,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 1,
      ease: [0.34, 1.56, 0.64, 1],
      opacity: { duration: 0.6 },
      filter: { duration: 0.6 },
    },
  },
};

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
      <div className="w-full fixed top-0 left-0 py-2 bg-card border-b border-white/10 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-center text-sm gap-2">
          <Flag className="w-3 h-3 text-yellow-500" />
          <p className="text-white tracking-wider opacity-70">{t('freeYearPromo')}</p>
        </div>
      </div>
      <main className="min-h-screen pt-32">
        <div className="absolute -top-[500px] left-1/2 h-[600px] w-[500px] -translate-x-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl md:w-[1000px] z-[10] hidden md:block" />
        <motion.header
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="my-3 md:m-6 flex justify-end gap-2 fixed top-6 md:top-10 md:right-2 bg-background/90 border md:border-none md:bg-transparent border-white/10 w-full sm:right-40 z-50 py-2 px-4 md:py-4 md:px-6"
        >
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
        </motion.header>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex w-full flex-col items-center text-center"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div variants={rotateIn} transition={{ delay: 0.8 }} className="relative">
              <Image src="/logo/imvestor.png" alt="Imvestor" width={64} height={64} />
            </motion.div>
            <motion.span
              variants={popUp}
              transition={{ delay: 1 }}
              className="mt-2 text-2xl font-medium"
            >
              Im-Vestor
            </motion.span>
            <motion.h1
              variants={fadeIn}
              transition={{ delay: 1.2 }}
              className="mt-8 md:mt-16 px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
            >
              {t('weMeanBusiness')}
            </motion.h1>
            <motion.span
              variants={fadeIn}
              transition={{ delay: 1.4 }}
              className="mt-4 md:mt-6 w-full md:w-2/3 px-4 font-['Segoe UI'] text-base md:text-xl leading-[140%] text-white/50 font-light"
            >
              {t('connectingEntrepreneursAndInvestors')}
            </motion.span>
            <motion.div variants={popUp} transition={{ delay: 1.6 }}>
              <Button
                onClick={async () => await router.push('/sign-up')}
                className="mt-8 md:mt-16 rounded-full hover:opacity-75 hover:scale-x-105 transition-all duration-500"
              >
                {t('getStarted')} <ArrowUpRight />
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-100px' }}
            className="my-16 md:my-32 w-full relative"
          >
            <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
            <motion.div
              onClick={() => setIsVideoPlaying(true)}
              whileHover={{ scale: 1.02, opacity: 0.95 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className="relative aspect-video mx-auto max-w-6xl px-4 border-2 border-white/10 bg-background group border-b-background p-6 rounded-2xl cursor-pointer overflow-hidden z-10"
            >
              <motion.div
                initial={{ opacity: 0.5 }}
                whileInView={{ opacity: 0.7 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 overflow-hidden"
              >
                <Image
                  src="/images/video-thumb.png"
                  className="rounded-xl w-full object-scale-down mt-14"
                  alt="Imvestor"
                  fill
                  priority
                />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center z-50"
                initial={{ scale: 0.8 }}
                whileInView={{ scale: 1 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                  type: 'spring',
                }}
              >
                <motion.div
                  className="rounded-full bg-primary p-3"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    boxShadow: [
                      '0px 0px 0px rgba(255,255,255,0.2)',
                      '0px 0px 20px rgba(255,255,255,0.5)',
                      '0px 0px 0px rgba(255,255,255,0.2)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  >
                    <Play className="h-12 w-12 text-background" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>

            <VideoModal isOpen={isVideoPlaying} onClose={() => setIsVideoPlaying(false)} />

            <div className="absolute -top-20 left-1/2 h-[90%] w-[80%] -translate-x-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl opacity-30" />
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="py-12 md:py-24 w-full px-4 bg-gradient-to-b from-background to-black"
          >
            <motion.h2
              variants={fadeInScale}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3 }}
              className="mb-8 md:mb-12 px-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent"
            >
              {t('whyChooseImVestor')}{' '}
              <span className="bg-primary-gradient bg-clip-text text-transparent">Im-Vestor</span>
            </motion.h2>

            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 text-center md:grid-cols-3 md:grid-rows-3 md:text-start relative opacity-70">
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 1,
                  }}
                >
                  <Image src="/images/vector-bg-features.svg" alt="Imvestor" fill priority />
                  <div className="absolute top-1/2 left-1/2 h-2/3 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E5CD82]/10 blur-3xl" />
                </motion.div>
              </motion.div>
              <motion.div
                variants={fadeIn}
                whileHover={{
                  scale: 1.02,
                  filter: 'brightness(1.1) blur(0px)',
                  boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
                  transition: {
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#38bdf8]/10 to-background/80 p-6 backdrop-blur-md md:col-span-2 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-[#38bdf8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  animate={{
                    background: [
                      'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 70% 60%, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
                      'radial-gradient(circle at 40% 80%, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 20% 30%, rgba(56, 189, 248, 0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex flex-col items-center text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#38bdf8]/20 blur-md"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
                    />
                    <Compass className="mx-auto h-12 w-12 text-[#38bdf8] relative z-10 md:mx-0" />
                  </motion.div>
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
              </motion.div>

              <motion.div
                variants={fadeIn}
                whileHover={{
                  scale: 1.02,
                  filter: 'brightness(1.1) blur(0px)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                  transition: {
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#a855f7]/10 to-background/80 p-6 backdrop-blur-md relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-[#a855f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  animate={{
                    background: [
                      'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 60% 50%, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
                      'radial-gradient(circle at 30% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 30% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex flex-col items-center text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#a855f7]/20 blur-md"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
                    />
                    <Handshake className="mx-auto h-12 w-12 text-[#a855f7] relative z-10 md:mx-0" />
                  </motion.div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#a855f7]">
                    {t('smartMatching')}
                  </h2>
                  <p className="mt-2 text-gray-300">{t('smartMatchingDesc')}</p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeIn}
                whileHover={{
                  scale: 1.02,
                  filter: 'brightness(1.1) blur(0px)',
                  boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)',
                  transition: {
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className="row-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#22d3ee]/10 to-background/80 p-6 backdrop-blur-md md:row-span-2 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-[#22d3ee]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  animate={{
                    background: [
                      'radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 70% 60%, rgba(34, 211, 238, 0.15) 0%, transparent 70%)',
                      'radial-gradient(circle at 40% 80%, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 20% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex h-full flex-col items-center justify-center text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#22d3ee]/20 blur-md"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
                    />
                    <Briefcase className="mx-auto h-12 w-12 text-[#22d3ee] relative z-10 md:mx-0" />
                  </motion.div>
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
              </motion.div>

              <motion.div
                variants={rotateIn}
                className="hidden flex-col items-center justify-center md:flex"
              >
                <Image src={'/images/home-diamond.svg'} alt="Imvestor" width={180} height={180} />
              </motion.div>

              <motion.div
                variants={fadeIn}
                whileHover={{
                  scale: 1.02,
                  filter: 'brightness(1.1) blur(0px)',
                  boxShadow: '0 0 20px rgba(250, 204, 21, 0.3)',
                  transition: {
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#facc15]/10 to-background/80 p-6 backdrop-blur-md relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-[#facc15]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  animate={{
                    background: [
                      'radial-gradient(circle at 30% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 60% 50%, rgba(250, 204, 21, 0.15) 0%, transparent 70%)',
                      'radial-gradient(circle at 30% 80%, rgba(250, 204, 21, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 30% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex flex-col items-center text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#facc15]/20 blur-md"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
                    />
                    <Zap className="mx-auto h-12 w-12 text-[#facc15] relative z-10 md:mx-0" />
                  </motion.div>
                  <h2 className="mt-4 text-2xl font-semibold text-[#facc15]">{t('pokeBoost')}</h2>
                  <p className="mt-2 text-gray-300">{t('pokeBoostDesc')}</p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeInScale}
                whileHover={{
                  scale: 1.02,
                  filter: 'brightness(1.1) blur(0px)',
                  boxShadow: '0 0 20px rgba(248, 113, 113, 0.3)',
                  transition: {
                    duration: 0.3,
                    ease: [0.25, 0.1, 0.25, 1],
                  },
                }}
                className="col-span-1 rounded-2xl border-2 border-white/10 bg-gradient-to-br from-[#f87171]/10 to-background/80 p-6 backdrop-blur-md md:col-span-2 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-[#f87171]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  animate={{
                    background: [
                      'radial-gradient(circle at 20% 30%, rgba(248, 113, 113, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 70% 60%, rgba(248, 113, 113, 0.15) 0%, transparent 70%)',
                      'radial-gradient(circle at 40% 80%, rgba(248, 113, 113, 0.1) 0%, transparent 70%)',
                      'radial-gradient(circle at 20% 30%, rgba(248, 113, 113, 0.1) 0%, transparent 70%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                />
                <div className="flex flex-col items-center text-center relative z-10">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, -5, 5, 0], transition: { duration: 0.6 } }}
                    className="relative"
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-[#f87171]/20 blur-md"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror' }}
                    />
                    <ShieldCheck className="mx-auto h-12 w-12 text-[#f87171] relative z-10 md:mx-0" />
                  </motion.div>
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
              </motion.div>
            </div>
          </motion.div>

          <StarField>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true }}
              className="relative w-full overflow-hidden"
            >
              <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="relative z-10 mb-20 px-4"
              >
                <motion.h2
                  variants={fadeIn}
                  className="mb-8 md:mb-12 mx-4 font-['Segoe UI'] text-3xl sm:text-5xl md:text-[84px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent md:mx-0"
                >
                  {t('businessRevolution')}
                </motion.h2>
                <motion.div variants={staggerContainer} className="p-6">
                  <div className="mx-auto flex max-w-4xl flex-col justify-center gap-10 md:flex-row">
                    <motion.div
                      variants={fadeIn}
                      whileHover={{
                        scale: 1.05,
                        filter: 'brightness(1.1) blur(0px)',
                        boxShadow: '0 0 25px rgba(229, 205, 130, 0.3)',
                        transition: {
                          duration: 0.3,
                          ease: [0.25, 0.1, 0.25, 1],
                        },
                      }}
                      className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-background/20 bg-opacity-30 px-6 py-16 backdrop-blur-md relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="relative z-10"
                        whileHover={{ y: -10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                      >
                        <Image
                          src={'/images/astronaut.png'}
                          alt="Imvestor"
                          width={64}
                          height={180}
                        />
                      </motion.div>
                      <motion.h2
                        className="mt-4 text-xl font-semibold text-primary relative z-10"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        {t('entrepreneur')}
                      </motion.h2>
                      <motion.p
                        className="mt-2 max-w-xs text-center text-gray-300 relative z-10"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                      >
                        {t('entrepreneurDesc')}
                      </motion.p>

                      <Link className="mt-8 z-50" href="/sign-up/entrepreneur">
                        <Button>
                          {t('joinAs')} {t('entrepreneur')}
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </motion.div>
                    <motion.div
                      variants={fadeIn}
                      whileHover={{
                        scale: 1.05,
                        filter: 'brightness(1.1) blur(0px)',
                        boxShadow: '0 0 25px rgba(229, 205, 130, 0.3)',
                        transition: {
                          duration: 0.3,
                          ease: [0.25, 0.1, 0.25, 1],
                        },
                      }}
                      className="flex flex-col items-center rounded-2xl border-2 border-white/10 bg-background/20 bg-opacity-30 px-6 py-16 backdrop-blur-md relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="relative z-10 mt-6"
                        whileHover={{
                          y: -10,
                          rotate: [0, -5, 5, 0],
                          transition: { rotate: { repeat: Infinity, duration: 2 } },
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                      >
                        <Image src={'/images/rocket.png'} alt="Imvestor" width={82} height={180} />
                      </motion.div>
                      <motion.h2
                        className="mt-4 text-xl font-semibold text-primary relative z-10"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      >
                        {t('investor')}
                      </motion.h2>
                      <motion.p
                        className="mt-2 max-w-xs text-center text-gray-300 relative z-10"
                        initial={{ opacity: 0.8 }}
                        whileHover={{ opacity: 1 }}
                      >
                        {t('investorDesc')}
                      </motion.p>

                      <Link className="mt-8 z-50" href="/sign-up/investor">
                        <Button>
                          {t('joinAs')} {t('investor')}
                          <ArrowRight className="ml-2" />
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </StarField>

          <StarField>
            <LoginSection />
          </StarField>

          <StarField>
            <PartnersMarquee />
          </StarField>

          <StarField>
            <motion.footer
              variants={fadeIn}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mx-auto mb-16 mt-16 md:mt-32 w-full max-w-7xl px-6 md:px-12"
            >
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
            </motion.footer>
          </StarField>
        </motion.div>
      </main>
    </div>
  );
}
