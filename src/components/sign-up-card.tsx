import { CheckIcon } from "lucide-react";
import Image from "next/image";

export const SignUpCard = ({
  name,
  type,
  features,
}: {
  name: string;
  type: "entrepreneur" | "investor";
  features: string[];
}) => {
  return (
    <div className="flex md:w-96 w-72 flex-col items-center justify-center">
      <Image
        src={"/images/card-hole.png"}
        alt="Card Hole"
        width={120}
        height={120}
        className="hidden md:block"
      />
      <div className="mt-4 w-full rounded-xl bg-[#242631]">
        <h1 className="mb-2 mt-6 text-center text-4xl font-semibold text-[#E5CD82]">
          {type === "entrepreneur" ? "Entrepreneur" : "Investor"}
        </h1>
        <h2 className="mt-2 text-center text-lg text-[#DCDDE0]">{name}</h2>
        <hr className="my-4 w-full border-neutral-700" />

        {/* Price Section */}
        <div className="mb-4 pt-8 text-center">
          <span className="text-3xl font-bold text-[#DCDDE0]">€ </span>
          <span className="text-5xl font-bold text-white">0</span>
          <span className="text-xl font-bold text-[#DCDDE0]">/ first year</span>
          <div className="mt-2">
            <span className="rounded-full bg-[#DCDDE0] px-4 py-1 text-sm text-[#3A3B44]">
              + IVA
            </span>
          </div>
        </div>

        {/* Features List */}
        <div className="mx-auto my-8 w-64 max-w-lg space-y-4">
          {features.map((feature, index) => (
            <div className="flex items-center gap-3" key={index}>
              <div className="rounded-full bg-[#E5CD82] p-1">
                <CheckIcon className="h-3 w-3 text-[#242631]" strokeWidth={4} />
              </div>
              <span className="font-light text-[#DCDDE0]">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
