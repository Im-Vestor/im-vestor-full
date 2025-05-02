import { useClerk, useSignIn, useUser } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export default function Login() {
  const user = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();

  useEffect(() => {
    if (user.isLoaded && user.isSignedIn) {
      router.push('/profile');
    }
  }, [user.isLoaded, user.isSignedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('handleSubmit');
    console.log(email, password);
    console.log(isLoaded);

    if (!isLoaded) return;

    setIsPending(true);

    try {
      if (user.isLoaded && user.isSignedIn) {
        await signOut({
          redirectUrl: '/login',
        });
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        await router.push('/profile');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(err.errors[0]?.message ?? 'Failed to login. Please try again.');
      } else {
        toast.error('Failed to login. Please try again.');
        console.error(JSON.stringify(err, null, 2));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <main className="flex min-h-screen">
        {/* Left side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <Image
            src="/images/login-image.png" // Add your image here
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
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/forgot-password">
                  <Button variant="link" className="h-6 font-normal text-neutral-200" size="sm">
                    Forgot password?
                  </Button>
                </Link>
              </div>

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
