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
    <main className="mx-auto min-h-screen w-full max-w-6xl p-4 sm:p-6 md:p-8">
      <Header />
      <div className="mt-8 md:mt-12">
        <div className="rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] px-4 py-6 sm:px-8 md:px-12 lg:px-16 md:py-8 lg:py-12">
          {isLoading && (
            <div className="mt-6 md:mt-12 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin" />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4">
            {data?.referralsWithBusinesses.map((referralWithBusiness) => (
              <div
                className="mb-4 rounded-xl border-2 border-white/10 bg-[#1E202A] p-4 sm:p-6"
                key={referralWithBusiness.referral.id}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {referralWithBusiness.referral.referred.imageUrl ? (
                    <div className="h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={referralWithBusiness.referral.referred.imageUrl}
                        alt={`${referralWithBusiness.referral.referred.email} Logo`}
                        width={72}
                        height={72}
                        className="h-full w-full rounded-md object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[60px] w-[60px] sm:h-[72px] sm:w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
                      <UserRoundIcon className="size-6 sm:size-8 text-neutral-500" />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold">
                      {referralWithBusiness.referral.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50">
                      Joined on{" "}
                      {referralWithBusiness.referral?.joinedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <h2 className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold">
                  Businesses ({referralWithBusiness.businesses.length})
                </h2>

                <div className="mt-3 sm:mt-4 grid gap-2 sm:grid-cols-1 md:grid-cols-2">
                  {referralWithBusiness.businesses.map((business) => (
                    <div key={business.id} className="flex items-center gap-3">
                      {business.logo ? (
                        <div className="size-10 sm:size-12 flex-shrink-0 overflow-hidden rounded-md">
                          <Image
                            src={business.logo}
                            alt={business.name}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-md object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-10 sm:size-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/10">
                          <Building2 className="size-5 sm:size-6 text-neutral-500" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 sm:gap-1.5">
                        <p className="text-xs sm:text-sm font-semibold">{business.name}</p>
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
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center sm:justify-end gap-2">
            <p className="text-xs sm:text-sm text-white/50 mb-2 sm:mb-0">
              {`Showing ${data?.referralsWithBusinesses?.length ?? 0} of ${data?.referralsWithBusinesses?.length ?? 0} referrals`}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10"
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
      </div>
    </main>
  );
}
