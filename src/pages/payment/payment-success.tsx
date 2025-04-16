import { CheckCircle, LogIn } from 'lucide-react';
import Link from 'next/link';
import { Button } from '~/components/ui/button';

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen">
      <div className="absolute -top-[480px] left-1/2 h-[500px] md:w-[800px] w-[300px] -translate-x-1/2 rounded-md bg-[#E5CD82]/20 blur-3xl" />
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
        <CheckCircle className="h-24 w-24 text-[#E5CD82] mb-6" />
        <h1 className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-5xl md:text-6xl font-medium tracking-wide text-transparent">
          Payment Successful!
        </h1>
        <p className="mt-6 max-w-md text-xl text-gray-300">
          Thank you for your payment. Your transaction has been completed successfully. You can now
          access all the features of your account.
        </p>
        <Link href="/login" className="mt-12">
          <Button size="lg" className="hover:opacity-75 text-lg">
            <LogIn className="mr-2 h-6 w-6" />
            Log into your account
          </Button>
        </Link>
      </div>
    </main>
  );
}
