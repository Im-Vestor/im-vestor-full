import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export const FinishCard = ({ name }: { name: string }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-80 md:w-72">
      <h1 className="mt-4 text-center text-6xl font-semibold">
        Welcome, <span className="text-[#E5CD82]">{name}</span>!
      </h1>
      <p className="mt-4 text-center ">
        Congratulations! You are now part of our community of investors.
      </p>
      <p className="text-center ">Your path to successful investments starts now!</p>

      <div className="mt-16 rounded-3xl w-full border-2 border-[#E5CD82]/40 bg-background bg-opacity-30 p-6 backdrop-blur-md">
        <div className="flex flex-col items-center">
          <Image
            src={"/images/male-avatar.svg"}
            alt="Avatar"
            width={96}
            height={96}
          />
          <p className="mt-8 text-center text-2xl font-semibold">
            Complete your profile
          </p>
          <Button
            type="button"
            className="mt-8 w-full flex items-center justify-center gap-2"
            onClick={() => router.push("/login")}
          >
            Get started <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
};
