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

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [code, setCode] = useState("");

  const { isLoaded, signIn, setActive } = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsPending(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Password has been reset successfully");
      } else {
        console.error(JSON.stringify(result, null, 2));
        toast.error("Failed to reset password. Please try again.");
      }
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
      void router.push("/profile");
    }
  };

  return (
    <>
      <main className="flex min-h-screen">
        {/* Left side - Image */}
        <div className="hidden lg:block lg:w-1/2">
          <Image
            src="/images/login-image.png"
            alt="Reset Password"
            className="h-screen w-full object-cover"
            width={1920}
            height={1080}
          />
        </div>

        {/* Right side - Reset password form */}
        <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-3xl font-bold text-[#E5CD82]">
                Reset Password
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Create a new password for your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">
                    Verification Code*
                  </Label>
                  <Input
                    onChange={(e) => setCode(e.target.value)}
                    value={code}
                    id="code"
                    name="code"
                    type="text"
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">
                    New Password*
                  </Label>
                  <Input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">
                    Confirm Password*
                  </Label>
                  <Input
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="••••••••"
                    disabled={isPending}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  "Resetting Password..."
                ) : (
                  <>
                    Reset Password <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </form>

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
