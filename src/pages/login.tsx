import { useClerk, useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { UserStatus } from '@prisma/client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { api } from '~/utils/api';
import { isProfileCompleted } from '~/utils/profile-completion';
import { logger } from '~/utils/logger';

export default function Login() {
  const user = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { isLoaded, signIn, setActive } = useSignIn();

  const { mutateAsync: checkUserStatus } = api.user.checkUserStatus.useMutation();
  // Avoid mounting the user.getUser query until we know the user is signed in.
  // This prevents unnecessary 401s on the login page.
  function AuthRedirector() {
    const { data: userData } = api.user.getUser.useQuery(undefined, {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: false,
    });
    const hasRedirected = useRef(false);

    useEffect(() => {
      if (hasRedirected.current) return;
      if (user.isLoaded && user.isSignedIn && userData) {
        hasRedirected.current = true;
        const profileCompleted = isProfileCompleted(userData);
        if (profileCompleted) {
          void router.push('/home');
        } else {
          void router.push('/profile');
        }
      }
    }, [user.isLoaded, user.isSignedIn, userData, router]);

    return null;
  }

  useEffect(() => {
    // Check if user was redirected after account deletion
    if (router.query.deleted === 'true') {
      toast.success('Your account has been successfully deleted. Thank you for using Im-Vestor.');
    }

    // Check email verification status messages
    if (router.query.message === 'email-verified') {
      toast.success('Email verified successfully! You can now log in.');
    } else if (router.query.message === 'already-verified') {
      toast.info('Your email is already verified. You can log in now.');
    }
  }, [router.query.deleted, router.query.message]);

  const mapClerkErrorToMessage = (code?: string, fallback?: string) => {
    switch (code) {
      case 'form_password_incorrect':
      case 'invalid_password':
        return 'Incorrect password. Please try again.';
      case 'form_identifier_not_found':
      case 'identifier_not_found':
        return 'Email not found. Please check and try again.';
      case 'too_many_attempts':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'not_allowed_to_sign_in':
        return 'You are not allowed to sign in.';
      case 'user_locked':
        return 'Your account is temporarily locked. Please try again later.';
      default:
        return fallback ?? 'Failed to login. Please try again.';
    }
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);

    const emailRegex =
      // Simple RFC 5322-compliant-ish email regex for client validation
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }
    if (!password || password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      isValid = false;
    }
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    if (!validateForm()) {
      setFormError('Please fix the errors below and try again.');
      toast.error('Please fix the errors in the form.');
      return;
    }

    setIsPending(true);

    try {
      if (user.isLoaded && user.isSignedIn) {
        await signOut({
          redirectUrl: '/login',
        });
      }

      const userStatus = await checkUserStatus({ email });

      if (userStatus === UserStatus.INACTIVE) {
        toast.error('Your account has been deactivated. Please contact support.');
        return;
      }

      if (userStatus === UserStatus.PENDING_EMAIL_VERIFICATION) {
        toast.warning('Please verify your email before logging in.');
        return;
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        toast.success('Logged in successfully. Redirecting...');
        // Redirect immediately to /home
        void router.push('/home');
      } else {
        logger.error('Sign in attempt incomplete:', signInAttempt);
        toast.error('Login could not be completed. Please try again.');
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const first = err.errors?.[0];
        const message = mapClerkErrorToMessage(first?.code, first?.message);
        // Try to map inline errors too
        if (first?.code === 'form_identifier_not_found' || first?.code === 'identifier_not_found') {
          setEmailError('Email not found.');
        } else if (first?.code === 'form_password_incorrect' || first?.code === 'invalid_password') {
          setPasswordError('Incorrect password.');
        }
        setFormError(message);
        toast.error(message);
      } else {
        toast.error('Failed to login. Please try again.');
        logger.error('Login error:', err);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      {user.isLoaded && user.isSignedIn ? <AuthRedirector /> : null}
      <main className="flex min-h-screen">
        {/* Left side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <Image
            src="/images/login-image.png"
            alt="Login"
            className="h-screen w-full object-cover"
            width={1920}
            height={1080}
          />
        </div>

        {/* Right side - Login form */}
        <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-3xl font-bold text-[#E5CD82]">Login</h2>
              <p className="mt-2 text-sm text-gray-300">Please sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">Email*</Label>
                  <Input
                    onChange={e => setEmail(e.target.value)}
                    value={email}
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="example@email.com"
                    disabled={isPending}
                  />
                  {emailError ? (
                    <p className="text-sm text-red-400">{emailError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">Password*</Label>
                  <Input
                    onChange={e => setPassword(e.target.value)}
                    value={password}
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                  {passwordError ? (
                    <p className="text-sm text-red-400">{passwordError}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password">
                  <Button
                    variant="link"
                    type="button"
                    className="h-6 font-normal text-neutral-200"
                    size="sm"
                  >
                    Forgot password?
                  </Button>
                </Link>
              </div>

              {formError ? (
                <div className="rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
                  {formError}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  'Logging in...'
                ) : (
                  <>
                    Login <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <p className="mt-8 text-center text-xs">
                Don&apos;t have an account?{' '}
                <Link href="/sign-up" className="underline hover:opacity-70">
                  <span className="text-[#F0D687] underline hover:opacity-70">Create one</span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
