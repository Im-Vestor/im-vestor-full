import { type Country, type Investor, type State } from "@prisma/client";
import { Loader2, MessageCircle, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";

export default function Companies() {
  const [page, setPage] = useState(0);

  const { data: investors, isLoading } =
    api.investor.getInvestorsRelatedToEntrepreneur.useQuery({ page });

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-12">
          <div className="flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] px-16 py-12">
          <div className="mt-4 flex flex-col gap-4">
            {investors && investors.length > 0 ? (
              investors.map((investor) => (
                <InvestorCard key={investor.id} investor={investor} />
              ))
            ) : (
              <p className="my-12 text-center text-sm text-white/50">
                No investors found!
              </p>
            )}
          </div>
          <p className="mt-4 text-end text-sm text-white/50">
            {`Showing ${investors?.length ?? 0} of ${investors?.length ?? 0} investors`}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={(investors?.length ?? 0) - (page + 1) * 20 <= 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function InvestorCard({
  investor,
}: {
  investor: Investor & { state: State | null; country: Country | null };
}) {
  return (
    <Link
      // href={`/investors/${investor.id}`}
      href="#"
      key={investor.id}
      className="cursor-pointer rounded-xl border-2 border-white/10 bg-[#1E202A] p-6 transition-all hover:border-white/20"
    >
      <div className="mb-4 flex gap-6">
        {investor.photo ? (
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={investor.photo}
              alt={`${investor.firstName} ${investor.lastName} Photo`}
              width={72}
              height={72}
              className="h-full w-full rounded-md object-cover"
            />
          </div>
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
            <UserRound className="size-8 text-neutral-500" />
          </div>
        )}

        <div className="flex w-full justify-between">
          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {investor.firstName} {investor.lastName}
                </h3>
              </div>
              {investor.state?.name && investor.country?.name && (
                <span className="text-white/70">
                  {investor.state.name}, {investor.country.name}
                </span>
              )}
              <p>{investor.about}</p>
            </div>
          </div>

          <div className="flex flex-col">
            <Button
              onClick={() => {
                toast.success("Poke not implemented yet!");
              }}
              className="gap-2"
              size="sm"
            >
              <MessageCircle className="size-4" strokeWidth={2.5} />
              <span>Poke</span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
