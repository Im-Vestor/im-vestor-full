import { useUser } from '@clerk/nextjs';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CircleUserRound,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Presentation,
  User
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { formatCurrency, formatStage } from '~/utils/format';

export default function CompanyDetails() {
  const { user } = useUser();
  const router = useRouter();
  const utils = api.useUtils();
  const { companyId } = router.query;
  const isInvestor = user?.publicMetadata.userType === 'INVESTOR';

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: companyId as string },
    { enabled: !!companyId }
  );

  const isProjectOwner = user?.id === project?.Entrepreneur?.userId;

  const { data: investor } = api.investor.getByUserId.useQuery(undefined, {
    enabled: !!isInvestor,
  });

  const addInvestorViewMutation = api.project.addView.useMutation();

  // Check if the current project is in the investor's favorites
  const isFavorite = useMemo(() => {
    if (!investor?.favoriteProjects || !companyId) return false;
    return investor.favoriteProjects.some(favoriteProject => favoriteProject.id === companyId);
  }, [investor?.favoriteProjects, companyId]);

  const favoriteOrUnfavoriteMutation = api.investor.favoriteOrUnfavorite.useMutation({
    onSuccess: () => {
      void utils.investor.getByUserId.invalidate();
      toast.success(`${isFavorite ? 'Removed from' : 'Added to'} favorites!`);
    },
    onError: () => {
      toast.error(`Failed to ${isFavorite ? 'remove' : 'add'} favorite.`);
    },
  });

  const handleFavoriteClick = () => {
    if (companyId) {
      favoriteOrUnfavoriteMutation.mutate({ projectId: companyId as string });
    }
  };

  const handleScheduleMeeting = async () => {
    toast.error('Meeting scheduling is not available yet.');
  };

  useEffect(() => {
    if (companyId) {
      void addInvestorViewMutation.mutateAsync({ projectId: companyId as string });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  if (isLoading || !project) {
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
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8 pb-48">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-8">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="mb-4 flex items-center gap-2 hover:opacity-75 sm:mb-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="mt-4 flex flex-col items-start gap-4 sm:mt-8 sm:flex-row sm:items-center sm:gap-8">
          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
            {project.logo ? (
              <Image
                src={project.logo}
                alt={`${project.name} Logo`}
                width={96}
                height={96}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10">
                <Building2 className="size-8 text-neutral-200 sm:size-10" />
              </div>
            )}
          </div>

          <div className="mt-0 flex-1 sm:mt-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold sm:text-3xl">{project.name}</h1>
                  {isInvestor && (
                    <button
                      onClick={handleFavoriteClick}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors duration-200"
                      aria-label={
                        isFavorite
                          ? `Remove ${project.name} from favorites`
                          : `Add ${project.name} to favorites`
                      }
                      disabled={favoriteOrUnfavoriteMutation.isPending}
                    >
                      <Heart
                        className={`h-5 w-5 transition-all ${favoriteOrUnfavoriteMutation.isPending ? 'opacity-50' : ''} duration-300 ${isFavorite ? 'fill-[#EFD687] text-[#EFD687]' : 'fill-transparent'}`}
                      />
                    </button>
                  )}
                </div>
                <p className="text-sm text-white/60 sm:text-base">
                  {project.quickSolution ?? 'No description available'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 sm:text-sm">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  {project.state?.name && project.country?.name ? (
                    <span>
                      {project.state.name}, {project.country.name}
                    </span>
                  ) : (
                    <span>Location not specified</span>
                  )}

                
                  <span className="mx-2">•</span>
                  <span className="w-fit rounded-full bg-[#EFD687] px-2 py-0.5 text-sm text-black sm:px-6">
                    {project.sector?.name ?? 'Uncategorized'}
                  </span>
                </div>
              </div>
              <div className="flex flex-row md:flex-col md:items-end gap-4 items-center mt-2 sm:mt-0">
                {isInvestor && (
                  <>
                    <Button onClick={handleScheduleMeeting} variant="secondary">
                      <Calendar className="mr-2 h-4 w-4" /> Schedule Meeting
                    </Button>
                    <Button variant="secondary" disabled>
                      <Presentation className="mr-2 h-4 w-4" /> Request Pitch{' '}
                      <span className="text-xs text-white/50">Coming soon</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6 border-white/10 sm:my-8" />

        {/* Company Details */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/80 sm:mt-4 sm:text-base">
              {project.about ?? 'No detailed description available.'}
            </p>

            <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Founder</h2>
            <Link href={`/entrepreneur/${project.Entrepreneur?.id}`} className="hover:opacity-75">
              <div className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4">
                {project.Entrepreneur?.photo ? (
                  <Image
                    src={project.Entrepreneur.photo}
                    alt="Founder"
                    width={64}
                    height={64}
                    className="h-12 w-12 rounded-full object-cover sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 sm:h-16 sm:w-16">
                    <User className="size-5 text-neutral-200 sm:size-6" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#EFD687] sm:text-base">
                    {project.Entrepreneur?.firstName} {project.Entrepreneur?.lastName}
                  </p>
                  <p className="text-xs text-white/70 sm:text-sm">
                    {project.Entrepreneur?.state?.name}, {project.Entrepreneur?.country?.name}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-lg font-semibold sm:text-xl">Investment Details</h2>
            <div className="mt-3 space-y-3 rounded-lg border border-white/10 bg-card p-4 sm:mt-4 sm:space-y-4 sm:p-6">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-white/70">Stage</span>
                <span className="font-medium">{formatStage(project.stage)}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-white/70">Annual Revenue</span>
                <span className="font-medium">
                  {project.annualRevenue
                    ? formatCurrency(project.annualRevenue, project.currency)
                    : 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-white/70">Initial Investment</span>
                <span className="font-medium">
                  {project.startInvestment
                    ? formatCurrency(project.startInvestment, project.currency)
                    : 'Not specified'}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-white/70">Investment Goal</span>
                <span className="font-medium">
                  {formatCurrency(project.investmentGoal, project.currency)}
                </span>
              </div>

              {project.equity !== null && project.equity !== undefined && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/70">Equity Offered</span>
                  <span className="font-medium">{project.equity}%</span>
                </div>
              )}

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-white/70">Investor Slots</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{project.investorSlots ?? 0}</span>
                  <div className="flex space-x-1">
                    {Array.from({
                      length: Math.min(project.investorSlots ?? 0, 5),
                    }).map((_, i) => (
                      <CircleUserRound key={i} color="#EFD687" className="h-3 w-3 sm:h-4 sm:w-4" />
                    ))}
                  </div>
                </div>
              </div>

              {project.foundationDate && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-white/70">Founded</span>
                  <span className="font-medium">
                    {new Date(project.foundationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQs */}
        {project.faqs && project.faqs.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-lg font-semibold sm:text-xl">FAQ</h2>
            <div className="mt-3 space-y-4 sm:mt-4 sm:space-y-6">
              {project.faqs.map(faq => (
                <div key={faq.id} className="rounded-lg border border-white/10 bg-card p-4 sm:p-6">
                  <h3 className="text-base font-medium sm:text-lg">{faq.question}</h3>
                  <p className="mt-2 text-sm text-white/80 sm:text-base">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files/Documents */}
        {project.files && project.files.length > 0 && (
          <div className="mt-8 sm:mt-12">
            <h2 className="text-lg font-semibold sm:text-xl">Documents</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
              {project.files.map(file => (
                <div key={file.id} className="rounded-lg border border-white/10 bg-card p-3 sm:p-4">
                  <p className="truncate text-sm font-medium sm:text-base">{file.name}</p>
                  <p className="text-xs text-white/50 sm:text-sm">
                    {file.type} • {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isProjectOwner && <ProjectViews projectId={companyId as string} />}
    </main>
  );
}

export function ProjectViews({ projectId }: { projectId: string }) {
  const { data: views } = api.project.getLast10ViewsInProject.useQuery({ id: projectId });

  return (
    <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-8 mt-8">
      <h2 className="text-lg font-semibold sm:text-xl">Project Views</h2>
      <div className="space-y-4 sm:mt-6 sm:space-y-6">
        {views &&
          views.length > 0 &&
          views?.map(view => (
            <div key={view.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <User className="size-3 text-neutral-200 sm:size-4" />
                </div>

                <p className="font-medium">Investor</p>

                <p className=" text-white/50">({view.investor?.userId}) viewed your project</p>

                <p className="font-medium">
                  {formatDistanceToNow(view.createdAt, { addSuffix: true })}
                </p>
              </div>

              <Button variant="secondary" size="sm">
                <MessageCircle className="size-4" />
                Send a Poke
              </Button>
            </div>
          ))}

        {views && views.length === 0 && <p className="text-sm text-white/50">No views yet</p>}
      </div>
    </div>
  );
}
