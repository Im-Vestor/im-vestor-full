import { useUser } from '@clerk/nextjs';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CircleUserRound,
  Globe,
  Loader2,
  MapPin,
  User,
  UserPlus,
  Video,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { formatCurrency, formatStage } from '~/utils/format';

export default function EntrepreneurDetails() {
  const { user } = useUser();
  const router = useRouter();
  const utils = api.useUtils();
  const { entrepreneurId } = router.query;
  const isInvestor = user?.publicMetadata.userType === 'INVESTOR';

  const { data: entrepreneur, isLoading } = api.entrepreneur.getById.useQuery(
    { id: entrepreneurId as string },
    { enabled: !!entrepreneurId }
  );

  const { data: myConnections } = api.connection.getMyConnections.useQuery(
    { page: 0 },
    { enabled: !!isInvestor }
  );

  // Check if the current entrepreneur is in the investor's connections
  const isConnected = useMemo(() => {
    if (!myConnections?.connections || !entrepreneur?.user.id) return false;
    return myConnections.connections.some(
      connection => connection.connection.followingId === entrepreneur.user.id
    );
  }, [myConnections?.connections, entrepreneur?.user.id]);

  const connectMutation = api.connection.connect.useMutation({
    onSuccess: data => {
      void utils.connection.getMyConnections.invalidate();
      toast.success(
        `${data.connected ? 'Connected with' : 'Disconnected from'} ${entrepreneur?.firstName} ${entrepreneur?.lastName}!`
      );
    },
    onError: () => {
      toast.error('Failed to update connection status.');
    },
  });

  const handleConnectClick = () => {
    if (entrepreneur?.user.id) {
      connectMutation.mutate({ userId: entrepreneur.user.id });
    }
  };

  if (isLoading || !entrepreneur) {
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
            {entrepreneur.photo ? (
              <Image
                src={entrepreneur.photo}
                alt={`${entrepreneur.firstName} ${entrepreneur.lastName}`}
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
                    {entrepreneur.firstName} {entrepreneur.lastName}
                  </h1>
                </div>
                {entrepreneur.companyName && (
                  <p className="text-lg text-white/70">
                    {entrepreneur.companyRole ?? 'Entrepreneur'}
                    {entrepreneur.companyName ? `, ${entrepreneur.companyName}` : ''}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {entrepreneur.state?.name && entrepreneur.country?.name ? (
                    <span>
                      {entrepreneur.state.name}, {entrepreneur.country.name}
                    </span>
                  ) : (
                    <span>Location not specified</span>
                  )}
                </div>
              </div>

              {isInvestor && (
                <Button
                  onClick={handleConnectClick}
                  variant="secondary"
                  disabled={isConnected || connectMutation.isPending}
                  className="mt-4 sm:mt-0"
                >
                  {isConnected ? (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Connected
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Connect
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <hr className="my-6 border-white/10 sm:my-8" />

        {/* About section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">About</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/80 sm:mt-4 sm:text-base">
                {entrepreneur.about ?? 'No detailed description available.'}
              </p>
            </div>

            {entrepreneur.personalPitchUrl && (
              <VideoRequestButton
                userId={entrepreneur.user.id}
                videoUrl={entrepreneur.personalPitchUrl}
              />
            )}
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold sm:text-xl">Projects</h2>
            </div>
            <div className="mt-3 space-y-4 sm:mt-4">
              {entrepreneur.projects && entrepreneur.projects.length > 0 ? (
                entrepreneur.projects.map(project => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block rounded-lg border border-white/10 p-4 transition-all hover:border-white/20 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md">
                        {project.logo ? (
                          <Image
                            src={project.logo}
                            alt={project.name}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10">
                            <Building2 className="h-5 w-5 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <span className="text-sm text-white/60">
                          {project.sector?.name ?? 'Uncategorized'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70 sm:text-sm">
                      {project.stage && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatStage(project.stage)}</span>
                        </div>
                      )}

                      {project.country && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{project.country.name}</span>
                        </div>
                      )}

                      {project.investmentGoal && (
                        <div className="flex items-center gap-1">
                          <span>
                            Investment Goal:{' '}
                            {formatCurrency(project.investmentGoal, project.currency)}
                          </span>
                        </div>
                      )}

                      {project.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span className="truncate">{project.website}</span>
                        </div>
                      )}
                    </div>

                    {/* investor slots */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/70 sm:text-sm">
                      {project.investorSlots && (
                        <div className="flex items-center gap-2">
                          <span>Investor Slots: </span>
                          <div className="flex space-x-1">
                            {Array.from({
                              length: Math.min(project.investorSlots ?? 0, 5),
                            }).map((_, i) => (
                              <CircleUserRound
                                key={i}
                                color="#EFD687"
                                className="h-3 w-3 sm:h-4 sm:w-4"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-white/60">No projects available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function VideoRequestButton({ userId, videoUrl }: { userId: string; videoUrl: string }) {
  const [hasRequested, setHasRequested] = useState(false);

  const requestVideoMutation = api.user.requestPersonalPitchVideo.useMutation({
    onSuccess: () => {
      setHasRequested(true);
      toast.success('Video access granted! You are now connected.');
    },
    onError: error => {
      toast.error('Failed to request video access: ' + error.message);
    },
  });

  const handleRequestVideo = () => {
    requestVideoMutation.mutate({ userId });
  };

  if (hasRequested && videoUrl) {
    return (
      <video src={videoUrl} controls className="w-full max-w-md rounded-lg">
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-card p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Video className="h-6 w-6 text-[#EFD687]" />
        <h3 className="text-lg font-medium">Personal Pitch Video Available</h3>
      </div>
      <p className="text-sm text-white/70 mb-4">
        This user has uploaded a video presentation. Request access to view it and connect with the
        user.
      </p>
      <Button
        onClick={handleRequestVideo}
        disabled={requestVideoMutation.isPending}
        className="w-full sm:w-auto"
      >
        {requestVideoMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Requesting Access...
          </>
        ) : (
          <>
            <Video className="mr-2 h-4 w-4" />
            Request Video Access
          </>
        )}
      </Button>
    </div>
  );
}
