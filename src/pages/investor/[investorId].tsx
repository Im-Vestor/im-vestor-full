import { ArrowLeft, Loader2, MapPin, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Header } from '~/components/header';
import { api } from '~/utils/api';

export default function InvestorDetails() {
  const router = useRouter();
  const { investorId } = router.query;

  const { data: investor, isLoading } = api.investor.getById.useQuery(
    { id: investorId as string },
    { enabled: !!investorId }
  );

  if (isLoading || !investor) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
        <Header />
        <div className="mt-16 flex items-center justify-center sm:mt-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-8">
        {/* Entrepreneur Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="mb-4 flex items-center gap-2 hover:opacity-75 sm:mb-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full sm:h-32 sm:w-32">
            {investor.photo ? (
              <Image
                src={investor.photo}
                alt={`${investor.firstName} ${investor.lastName}`}
                width={128}
                height={128}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                <User className="size-10 text-neutral-200 sm:size-12" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold sm:text-3xl">
                    {investor.firstName} {investor.lastName}
                  </h1>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {investor.state?.name && investor.country?.name ? (
                    <span>
                      {investor.state.name}, {investor.country.name}
                    </span>
                  ) : (
                    <span>Location not specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6 border-white/10 sm:my-8" />

        {/* About section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/80 sm:mt-4 sm:text-base">
              {investor.about ?? 'No detailed description available.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
