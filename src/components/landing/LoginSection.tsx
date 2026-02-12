import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useTranslation } from '~/hooks/use-translation';
import { api } from '~/utils/api';
import { isProfileCompleted } from '~/utils/profile-completion';
import { logger } from '~/utils/logger';

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

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function LoginSection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const t = useTranslation();
  const router = useRouter();
  const hasRedirected = useRef(false);

  const { isLoaded, signIn, setActive } = useSignIn();
  const { user, isLoaded: isUserLoaded } = useUser();

  const { data: userData } = api.user.getUser.useQuery(undefined, {
    enabled: isUserLoaded && !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const handleLogin = async () => {
    if (!isLoaded) return;

    setIsPending(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        logger.error('Sign in attempt incomplete:', signInAttempt);
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(err.errors[0]?.message ?? 'Failed to login. Please try again.');
      } else {
        toast.error('Failed to login. Please try again.');
        logger.error('Login error:', err);
      }
    } finally {
      setIsPending(false);
    }
  };

  useEffect(() => {
    if (hasRedirected.current) return;

    if (isUserLoaded && user && userData) {
      hasRedirected.current = true;
      const profileCompleted = isProfileCompleted(userData);
      if (profileCompleted) {
        void router.push('/home');
      }
    }
  }, [isUserLoaded, user, userData, router]);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ delayChildren: 0.4, staggerChildren: 0.3 }}
      className="mt-12 md:mt-24 flex w-full flex-col justify-center gap-10 md:gap-24 px-4 text-center md:flex-row md:text-start"
    >
      <motion.div
        variants={fadeIn}
        transition={{ duration: 1 }}
        className="w-full md:w-[600px]"
      >
        <h2 className="font-['Segoe UI'] text-3xl sm:text-4xl md:text-[66px] leading-[120%] bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          <span className="bg-primary-gradient bg-clip-text text-transparent">
            {t('joinUsNow').split(' ')[0]}
          </span>{' '}
          {t('joinUsNow').split(' ').slice(1).join(' ')}
        </h2>
        <p className="mt-4 md:mt-8 max-w-96 mx-auto md:mx-0 text-lg md:text-2xl tracking-wider text-white/90">
          {t('receiveUpdates')}{' '}
          <span className="bg-primary-gradient bg-clip-text text-transparent">
            {t('exclusiveUpdates')}
          </span>{' '}
          {t('beNotified')}{' '}
          <span className="bg-primary-gradient bg-clip-text text-transparent">
            {t('specialGift')}
          </span>{' '}
          {t('forBeingFirst')} 🎁.
        </p>
      </motion.div>
      <motion.div
        variants={fadeIn}
        transition={{ duration: 1 }}
        className="w-full md:w-1/2"
      >
        <div className="flex flex-col items-center justify-center rounded-2xl border-[1px] border-white/10 bg-background/20 p-6 text-center backdrop-blur-sm h-full">
          <Image src={'/images/home-diamond.svg'} alt="Imvestor" width={32} height={180} />
          <h2 className="mt-4 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-2xl font-medium tracking-wide text-transparent">
            {t('takeYourSpecialGift').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-primary-gradient bg-clip-text text-transparent">
              {t('takeYourSpecialGift').split(' ').slice(-1)[0]}
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-300">
            {t('dontHaveAccount')}{' '}
            <Link href="/sign-up" className="text-primary hover:opacity-70">
              {t('createOne')}
            </Link>
          </p>
          <Input
            className="mt-8"
            placeholder={t('enterYourEmail')}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            className="mt-4"
            placeholder={t('password')}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <div className="mt-4 flex w-full items-center justify-between">
            <Link href="/reset-password" className="text-xs text-primary hover:opacity-70">
              {t('forgotPassword')}
            </Link>
            <Button onClick={handleLogin} disabled={isPending || !email || !password}>
              {isPending ? t('loggingIn') : t('login')} <ArrowRight />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
