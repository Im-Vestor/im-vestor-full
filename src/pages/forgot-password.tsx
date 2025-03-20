import { useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const { isLoaded, signIn } = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setIsPending(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      setIsSuccessful(true);
      toast.success("Password reset email sent. Please check your inbox.");
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(
          err.errors[0]?.message ??
            "Failed to reset password. Please try again.",
        );
      } else {
        toast.error("Failed to reset password. Please try again.");
        console.error(JSON.stringify(err, null, 2));
      }
    } finally {
      setIsPending(false);
      await router.push("/reset-password");
    }
  };

  return (
    <>
      <main className="flex min-h-screen">
        {/* Left side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <Image
            src="/images/login-image.png"
            alt="Forgot Password"
            className="h-screen w-full object-cover"
            width={1920}
            height={1080}
          />
        </div>

        {/* Right side - Forgot password form */}
        <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-3xl font-bold text-[#E5CD82]">
                Forgot Password
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                {isSuccessful
                  ? "Please check your email for reset instructions"
                  : "Enter your email to reset your password"}
              </p>
            </div>

            {!isSuccessful ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-normal text-neutral-200">
                      Email*
                    </Label>
                    <Input
                      onChange={(e) => setEmail(e.target.value)}
                      value={email}
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="example@email.com"
                      disabled={isPending}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? (
                    "Sending reset email..."
                  ) : (
                    <>
                      Reset Password <ArrowRight className="ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="mt-8 space-y-6">
                <Button
                  onClick={() => setIsSuccessful(false)}
                  variant="outline"
                  className="w-full"
                >
                  Send Again
                </Button>
              </div>
            )}

            <div className="mt-6">
              <p className="mt-8 text-center text-xs">
                Remember your password?{" "}
                <Link href="/login" className="underline hover:opacity-70">
                  <span className="text-[#F0D687] underline hover:opacity-70">
                    Login
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
