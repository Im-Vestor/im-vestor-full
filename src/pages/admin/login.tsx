import { useClerk, useSignIn, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export default function Login() {
  const user = useUser();
  const router = useRouter();
  const { signOut } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const { isLoaded, signIn, setActive } = useSignIn();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setIsPending(true);

    try {
      if (user.isLoaded && user.isSignedIn) {
        await signOut({
          redirectUrl: "/",
        });
      }

      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        await router.push("/admin/dashboard");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        toast.error(
          err.errors[0]?.message ?? "Failed to login. Please try again.",
        );
      } else {
        toast.error("Failed to login. Please try again.");
        console.error(JSON.stringify(err, null, 2));
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <main className="flex min-h-screen">
        {/* Right side - Login form */}
        <div className="flex w-full items-center justify-center px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h2 className="mt-6 text-3xl font-bold text-[#E5CD82]">Admin Panel</h2>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">Email*</Label>
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
                <div className="space-y-2">
                  <Label className="font-normal text-neutral-200">
                    Password*
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
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  "Logging in..."
                ) : (
                  <>
                    Login <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
