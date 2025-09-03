import {
  type Country,
  type Entrepreneur,
  type Negotiation,
  type Project,
  type State,
  type Investor,
  NegotiationStage,
  type VcGroup,
} from '@prisma/client';
import { Building2, Plus, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Header } from '~/components/header';
import { SkeletonProfile } from '~/components/profile/skeleton-profile';
import { Button } from '~/components/ui/button';
import { Stepper } from '~/components/ui/stepper';
import { api } from '~/utils/api';

const NEGOTIATION_STEPS = [
  { label: 'Pitch' },
  { label: 'Negotiation' },
  { label: 'Details' },
  { label: 'Closed' },
];

const STAGE_TO_STEP_MAP = {
  PITCH: 0,
  NEGOTIATION: 1,
  DETAILS: 2,
  CLOSED: 3,
};

export default function EntrepreneurNegotiations() {
  const router = useRouter();

  const { data: negotiations, isPending: isLoading } =
    api.entrepreneur.getNegotiationsByUserId.useQuery();

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-12">
          <SkeletonProfile />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-lg border border-white/10 bg-card p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold">My Negotiations</h1>
          </div>

          {negotiations?.length && negotiations.length > 0 ? (
            <div className="grid gap-6">
              {negotiations.map(negotiation => (
                <NegotiationCard key={negotiation.project.id} negotiation={negotiation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first project to start connecting with investors.
              </p>
              <Button onClick={() => router.push('/companies/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function NegotiationCard({
  negotiation,
}: {
  negotiation: Negotiation & {
    project: Project & {
      state: State | null;
      country: Country | null;
      Entrepreneur: Entrepreneur | null;
    };
    investor: Investor | null;
    VcGroup: VcGroup | null;
  };
}) {
  return (
    <Link
      href={`/companies/${negotiation.project.id}`}
      className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-6 transition-all hover:border-white/20 relative grid grid-cols-3 gap-4 items-center justify-between"
    >
      <div className="col-span-1 flex gap-4">
        {negotiation.project.logo ? (
          <Image
            src={negotiation.project.logo}
            alt="Company Logo"
            width={72}
            height={72}
            className="size-16 rounded-md object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-md bg-white/10">
            <Building2 className="size-8 sm:size-6 text-neutral-200" />
          </div>
        )}

        <div className="flex flex-col flex-1">
          <h3 className="text-lg sm:text-xl font-semibold">{negotiation.project.name}</h3>
          <p className="text-sm sm:text-base text-gray-300 line-clamp-2">
            {negotiation.project.quickSolution}
          </p>
        </div>
      </div>

      <div className="col-span-1">
        {negotiation.stage === NegotiationStage.CANCELLED ? (
          <p className="text-red-500 bg-red-500/10 rounded-md p-2 flex items-center gap-2">
            <X className="size-4" />
            Negotiation cancelled
          </p>
        ) : (
          <Stepper
            steps={NEGOTIATION_STEPS}
            currentStep={STAGE_TO_STEP_MAP[negotiation?.stage ?? 'PITCH']}
          />
        )}
      </div>

      <div className="col-span-1">
        {negotiation.investor && (
          <div className="flex gap-4 items-center">
            {negotiation.investor.photo ? (
              <Image
                src={negotiation.investor.photo}
                alt="Investor Photo"
                width={72}
                height={72}
                className="size-16 rounded-md object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md bg-white/10">
                <UserRound className="size-8 sm:size-6 text-neutral-200" />
              </div>
            )}
            <div className="flex flex-col flex-1">
              <h3 className="text-lg sm:text-xl font-semibold">
                {negotiation.investor?.firstName} {negotiation.investor?.lastName}
              </h3>
              <p className="text-sm sm:text-base text-gray-300 line-clamp-2">
                {negotiation.investor?.about}
              </p>
            </div>
          </div>
        )}

        {negotiation.VcGroup && (
          <div className="flex gap-4 items-center">
            {negotiation.VcGroup.logo ? (
              <Image
                src={negotiation.VcGroup.logo}
                alt="VcGroup Logo"
                width={96}
                height={96}
                className="size-16 rounded-md object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-md bg-white/10">
                <Building2 className="size-8 sm:size-6 text-neutral-200" />
              </div>
            )}
            <div className="flex flex-col flex-1">
              <h3 className="text-lg sm:text-xl font-semibold">{negotiation.VcGroup?.name}</h3>
              <p className="text-sm sm:text-base text-gray-300 line-clamp-2">
                {negotiation.VcGroup?.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
