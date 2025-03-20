import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button } from "~/components/ui/button";

export default function SignUp() {
  const [accountType, setAccountType] = useState<"entrepreneur" | "investor" | null>(
    null,
  );

  const router = useRouter();

  const handleNext = async () => {
    if (accountType === "entrepreneur") {
      await router.push(`/sign-up/entrepreneur`);
    } else if (accountType === "investor") {
      await router.push(`/sign-up/investor`);
    }
  };

  return (
    <>
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border-4 border-white/10 bg-background bg-opacity-30 p-6 backdrop-blur-md">
          <h2 className="mt-4 text-center text-4xl font-semibold">
            Choose your <span className="text-[#E5CD82]">account type</span>
          </h2>
          <p className="mt-4 text-center">
            Entrepreneur or Investor, Personalize Your Journey with Us.
          </p>
          <div className="mt-10 flex max-w-4xl items-center justify-center gap-4">
            <button
              onClick={() => setAccountType("entrepreneur")}
              className={`flex h-40 w-full flex-col items-center justify-center rounded-2xl border bg-background bg-opacity-30 p-6 backdrop-blur-md transition-all duration-300 ${accountType === "entrepreneur"
                  ? "border-2 border-[#E5CD82] scale-105 shadow-lg shadow-[#E5CD82]/20"
                  : "border border-white/10 hover:border-white/30 hover:opacity-75"
                }`}
            >
              <Image
                src="images/individual.svg"
                alt="entrepreneur"
                width={64}
                height={64}
              />
              <h3 className="mt-2 text-center text-xl font-semibold">
                Entrepreneur
              </h3>
            </button>
            <button
              onClick={() => setAccountType("investor")}
              className={`flex h-40 w-full flex-col items-center justify-center rounded-2xl border bg-background bg-opacity-30 p-6 backdrop-blur-md transition-all duration-300 ${accountType === "investor"
                  ? "border-2 border-[#E5CD82] scale-105 shadow-lg shadow-[#E5CD82]/20"
                  : "border border-white/10 hover:border-white/30 hover:opacity-75"
                }`}
            >
              <Image
                src="images/vc-group.svg"
                alt="entrepreneur"
                width={80}
                height={80}
                className="mt-1"
              />
              <h3 className="mt-2 text-center text-xl font-semibold">
                Investor
              </h3>
            </button>
          </div>

          <Button
            className="mt-10 w-full"
            disabled={!accountType}
            onClick={handleNext}
          >
            Next <ArrowRight />
          </Button>

          <p className="mt-8 text-sm">
            Have an account?{" "}
            <Link
              href="/login"
              className="text-[#F0D687] underline hover:opacity-70"
            >
              <span className="text-[#F0D687] underline hover:opacity-70">
                Sign In
              </span>
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
