import { Building2, Loader2, UserRoundIcon } from "lucide-react";
import { useState } from "react";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { ProjectStatus } from "@prisma/client";
import Image from "next/image";
import { cn } from "~/lib/utils";

export default function List() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = api.user.getMyReferrals.useQuery({
    page,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] px-16 py-12">
          {isLoading && (
            <div className="mt-12 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin" />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4">
            {data?.referralsWithBusinesses.map((referralWithBusiness) => (
              <div
                className="mb-4 rounded-xl border-2 border-white/10 bg-[#1E202A] p-6"
                key={referralWithBusiness.referral.id}
              >
                <div className="flex items-center gap-6">
                  {referralWithBusiness.referral.referred.imageUrl ? (
                    <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={referralWithBusiness.referral.referred.imageUrl}
                        alt={`${referralWithBusiness.referral.referred.email} Logo`}
                        width={72}
                        height={72}
                        className="h-full w-full rounded-md object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                      <UserRoundIcon className="size-8 text-neutral-500" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold">
                      {referralWithBusiness.referral.name}
                    </h3>
                    <p className="text-sm text-white/50">
                      Joined on{" "}
                      {referralWithBusiness.referral?.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <h2 className="mt-6 text-lg font-semibold">
                  Businesses ({referralWithBusiness.businesses.length})
                </h2>

                <div className="mt-4 flex flex-col gap-2">
                  {referralWithBusiness.businesses.map((business) => (
                    <div key={business.id} className="flex items-center gap-3">
                      {business.logo ? (
                        <div className="size-12 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={business.logo}
                            alt={business.name}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10">
                          <Building2 className="size-6 text-neutral-500" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-semibold">{business.name}</p>
                        <div
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            {
                              "bg-green-500/20 text-green-500":
                                business.status === ProjectStatus.ACTIVE,
                              "bg-red-500/20 text-red-500":
                                business.status === ProjectStatus.COMPLETED,
                              "bg-neutral-500/20 text-neutral-500":
                                business.status === ProjectStatus.INACTIVE,
                            },
                          )}
                        >
                          {business.status.charAt(0).toUpperCase() +
                            business.status.slice(1).toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {data?.referralsWithBusinesses.length === 0 && (
              <p className="text-center text-sm text-white/50">
                No referrals found.
              </p>
            )}
          </div>
          <div className="mt-8 flex items-center justify-end gap-2">
            <p className="text-sm text-white/50">
              {`Showing ${data?.referralsWithBusinesses?.length ?? 0} of ${data?.referralsWithBusinesses?.length ?? 0} referrals`}
            </p>
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
              disabled={
                (data?.referralsWithBusinesses?.length ?? 0) -
                  (page + 1) * 20 <=
                0
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
