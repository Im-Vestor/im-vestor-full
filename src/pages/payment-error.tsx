import { LogIn, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function PaymentError() {
  return (
    <main className="min-h-screen">
      <div className="absolute -top-[480px] left-1/2 h-[500px] md:w-[800px] w-[300px] -translate-x-1/2 rounded-md bg-[#E5CD82]/20 blur-3xl" />
      <div className="flex min-h-screen flex-col items-center justify-center text-center p-6">
        <XCircle className="h-24 w-24 text-[#E5CD82] mb-6" />
        <h1 className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-5xl md:text-6xl font-medium tracking-wide text-transparent">
          Payment Failed
        </h1>
        <p className="mt-6 max-w-md text-xl text-gray-300">
          We apologize, but there was an error processing your payment. Please try again or contact our support team if the problem persists.
        </p>
        <div className="mt-12 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" onClick={() => window.history.back()} className="hover:opacity-75 text-lg">
            <RefreshCw className="mr-2 h-6 w-6" />
            Try Again
          </Button>
          <Link href="/login">
            <Button size="lg" variant="outline" className="hover:opacity-75 text-lg">
              <LogIn className="mr-2 h-6 w-6" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
} 