import { useUser } from "@clerk/nextjs";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function Referral() {
  const { user } = useUser();
  const { data: referral } = api.referral.getReferralDetails.useQuery();

  return (
    <>
      <div className="relative min-h-screen">
        <div className="absolute -top-1/2 left-1/2 h-[800px] min-h-screen w-[200px] -translate-x-1/2 transform rounded-full bg-white/5 blur-[128px] md:w-[1000px]" />

        <main className="relative mx-4 flex flex-col md:mx-48 md:flex-row md:justify-between">
          <div className="mt-12 flex w-full flex-col items-center md:mt-48 md:w-1/2 md:items-start">
            <Link
              href="/profile"
              className="mb-8 flex cursor-pointer items-center gap-2 hover:opacity-75"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>

            <div className="flex flex-col items-center">
              <Image
                src="/logo/imvestor.png"
                alt="Imvestor"
                width={48}
                height={48}
              />
              <h3 className="mt-2 text-xl font-bold">Im-Vestor</h3>
            </div>
            <h1 className="mt-8 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-center text-3xl font-medium tracking-wide text-transparent md:text-left md:text-4xl">
              Welcome,{" "}
              <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text">
                {user?.firstName}
              </span>
            </h1>
            <p className="mt-8 text-center text-gray-300 md:text-left">
              Our platform connects entrepreneurs and investors, providing
              resources to help businesses thrive. Get ready to explore
              opportunities, make valuable connections, and accelerate your
              growth.{" "}
              <span className="bg-gradient-to-r from-[#E5CD82] via-[#C2AE72] to-[#978760] bg-clip-text text-transparent">
                Stay tuned for our official launch!
              </span>
            </p>
            <Link href="/profile" className="w-full md:w-auto">
              <Button className="mt-8 w-full rounded-full hover:opacity-75 md:w-auto">
                Get your Business Card <ArrowRight />
              </Button>
            </Link>
          </div>

          <div className="relative mt-12 md:mt-0">
            <Image
              src="/images/badge.svg"
              alt="Badge"
              width={320}
              height={320}
              className="hidden md:block"
            />
            <div className="mt-8 flex flex-col items-center justify-center px-8 md:absolute md:inset-0 md:mt-64">
              <h2 className="bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-center text-xl font-bold tracking-wide text-transparent md:text-2xl">
                Invite Friends & Earn Rewards
              </h2>
              <h2 className="hidden bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-2xl font-bold tracking-wide text-transparent md:block">
                Share your code!
              </h2>
              <div className="mb-8 mt-8 w-full rounded-sm border-2 border-white/10 bg-background bg-opacity-30 p-2 text-lg font-bold placeholder:text-white md:mb-20 md:mt-12 md:w-52">
                <div className="relative flex items-center justify-center">
                  <Copy
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        referral?.referralCode ?? "",
                      );
                      toast.success("Copied to clipboard!");
                    }}
                    className="absolute right-2 h-4 w-4 cursor-pointer hover:opacity-75"
                  />
                  <p className="flex-1 text-center">{referral?.referralCode}</p>
                </div>
              </div>
              <div className="flex w-full justify-center gap-8 md:justify-between md:px-8">
                <Link
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    "https://imvestor.com",
                  )}&text=${encodeURIComponent(
                    `Join Imvestor using my referral code: ${referral?.referralCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-8 w-8 cursor-pointer hover:opacity-75" />
                </Link>
                <Link
                  href={`https://www.instagram.com/share?url=${encodeURIComponent(
                    "https://imvestor.com",
                  )}&caption=${encodeURIComponent(
                    `Join Imvestor using my referral code: ${referral?.referralCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="h-8 w-8 cursor-pointer hover:opacity-75" />
                </Link>
                <Link
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    "https://imvestor.com",
                  )}&quote=${encodeURIComponent(
                    `Join Imvestor using my referral code: ${referral?.referralCode}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-8 w-8 cursor-pointer hover:opacity-75" />
                </Link>
              </div>
            </div>
          </div>
        </main>

        <div className="hidden flex-col items-center justify-center pb-24 md:flex">
          <div className="mt-12 text-center text-5xl font-bold text-[#E5CD82]">
            My Referral
          </div>
          <div className="mt-6 bg-gradient-to-r from-[#BFBFC2] via-[#FDFDFD] to-[#BFBFC2] bg-clip-text text-center text-xl font-bold">
            Total: {referral?.referralsAsReferrer.length}
          </div>
          {referral?.referralsAsReferrer.map((ref) => (
            <div
              key={ref.name}
              className="mt-10 flex items-center justify-center gap-8 rounded-md bg-[#1b1c24] px-24 py-3"
            >
              <div className="text-center text-lg font-bold text-white">
                {ref.name}
              </div>
              <div className="text-center text-lg text-white">
                Joined on{" "}
                {ref.joinedAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
