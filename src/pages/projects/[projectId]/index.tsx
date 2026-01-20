import { useUser } from '@clerk/nextjs';
import { format, formatDistanceToNow, startOfTomorrow } from 'date-fns';
import { DayPicker } from 'react-day-picker';

import { NegotiationStage } from '@prisma/client';
import {
  ArrowLeft,
  Building2,
  Calendar1Icon,
  CalendarIcon,
  CircleUserRound,
  Clock,
  Globe,
  Heart,
  Loader2,
  MapPin,
  Presentation,
  Share,
  User,
  Video,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BoostDialog } from '~/components/boosts/boost-dialog';
import { useTranslation } from '~/hooks/use-translation';
import { ConfirmationDialog } from '~/components/confirmation-dialog';
import { Header } from '~/components/header';
import { ProjectDialog } from '~/components/hypertrain/project-dialog';
import { NextStepDialog } from '~/components/next-step/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Stepper } from '~/components/ui/stepper';
import { capitalize, cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { formatCurrency, formatStage } from '~/utils/format';

const availableHours = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '00:00',
];

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

export default function CompanyDetails() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const t = useTranslation();
  const utils = api.useUtils();
  const { projectId } = router.query;

  const isInvestor = user?.publicMetadata.userType === 'INVESTOR';
  const isVc = user?.publicMetadata.userType === 'VC_GROUP';
  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';
  const isIncubator = user?.publicMetadata.userType === 'INCUBATOR';

  const tomorrow = startOfTomorrow();

  const [openScheduleMeeting, setOpenScheduleMeeting] = useState(false);
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [time, setTime] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: projectId as string },
    { enabled: !!projectId }
  );

  const { data: preferredHours } = api.preferredHours.getPreferredHoursByEntrepreneurId.useQuery(
    { entrepreneurId: project?.Entrepreneur?.id ?? '' },
    { enabled: !!project?.Entrepreneur?.id }
  );

  const { data: hypertrainItem } = api.hypertrain.getHyperTrainItemByExternalId.useQuery(
    project?.id ?? '',
    { enabled: !!project?.id }
  );

  const isProjectOwner =
    user?.id === project?.Entrepreneur?.userId || user?.id === project?.Incubator?.userId;

  const { data: investor } = api.investor.getByUserId.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && !!isInvestor && !!user,
  });

  const { data: vcGroup } = api.vcGroup.getByUserId.useQuery(undefined, {
    enabled: isLoaded && isSignedIn && !!isVc && !!user,
  });

  const { data: negotiation } =
    api.negotiation.getNegotiationByProjectIdAndInvestorIdOrVcGroupId.useQuery(
      { projectId: projectId as string },
      { enabled: !!projectId }
    );

  const shareProjectMutation = api.vcGroup.shareProject.useMutation({
    onSuccess: () => {
      toast.success('Project shared successfully');
      setIsShareDialogOpen(false);
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const addInvestorViewMutation = api.project.addView.useMutation();
  const requestPitchVideoMutation = api.project.requestPitchVideo.useMutation({
    onSuccess: () => {
      toast.success('Pitch video request sent to entrepreneur!');
    },
    onError: error => {
      toast.error(error.message);
    },
  });
  const schedulePitchMeetingMutation = api.negotiation.createAndSchedulePitchMeeting.useMutation({
    onSuccess: () => {
      toast.success('Meeting scheduled successfully');
      setIsConfirmModalOpen(false);
      setOpenScheduleMeeting(false);
      setTime(null);
      setSelectedDate(tomorrow);
      router.push('/meetings');
    },
    onError: error => {
      toast.error(error.message);
      setIsConfirmModalOpen(false);
    },
  });

  const scheduleOtherStageMeetingMutation =
    api.negotiation.createAndScheduleOtherStageMeeting.useMutation({
      onSuccess: () => {
        toast.success('Meeting scheduled successfully');
        setIsConfirmModalOpen(false);
        setOpenScheduleMeeting(false);
        setTime(null);
        setSelectedDate(tomorrow);
        router.push('/meetings');
      },
      onError: error => {
        toast.error(error.message);
        setIsConfirmModalOpen(false);
      },
    });

  const isFavorite = useMemo(() => {
    if (!projectId) return false;
    return (
      investor?.favoriteProjects.some(favoriteProject => favoriteProject.id === projectId) ??
      vcGroup?.favoriteProjects.some(favoriteProject => favoriteProject.id === projectId) ??
      false
    );
  }, [investor?.favoriteProjects, vcGroup?.favoriteProjects, projectId]);

  const favoriteOrUnfavoriteMutation = api.project.favoriteOrUnfavorite.useMutation({
    onSuccess: async () => {
      await utils.project.getById.invalidate();
      if (isInvestor) {
        await utils.investor.getByUserId.invalidate();
      }
      if (isVc) {
        await utils.vcGroup.getByUserId.invalidate();
      }
      toast.success(`${isFavorite ? 'Removed from' : 'Added to'} favorites!`);
    },
    onError: () => {
      toast.error(`Failed to ${isFavorite ? 'remove' : 'add'} favorite.`);
    },
  });

  const handleFavoriteClick = () => {
    if (projectId) {
      favoriteOrUnfavoriteMutation.mutate({ projectId: projectId as string });
    }
  };

  const handleScheduleMeeting = async () => {
    if (projectId && selectedDate && time) {
      const meetingDateTime = new Date(selectedDate);
      meetingDateTime.setHours(parseInt(time.split(':')[0] ?? '0'));

      if (!negotiation || negotiation?.stage === NegotiationStage.PITCH) {
        schedulePitchMeetingMutation.mutate({
          entrepreneurId: project?.Entrepreneur?.id ?? '',
          incubatorId: project?.Incubator?.id ?? '',
          date: meetingDateTime,
          investorId: investor?.id ?? '',
          vcGroupId: vcGroup?.id ?? '',
          projectId: projectId as string,
        });
      } else {
        scheduleOtherStageMeetingMutation.mutate({
          entrepreneurId: project?.Entrepreneur?.id ?? '',
          incubatorId: project?.Incubator?.id ?? '',
          date: meetingDateTime,
          investorId: investor?.id ?? '',
          vcGroupId: vcGroup?.id ?? '',
          projectId: projectId as string,
        });
      }
    }
  };

  const handleScheduleMeetingNow = async () => {
    if (projectId && project?.Entrepreneur?.id && (investor?.id || vcGroup?.id)) {
      const now = new Date();
      if (!negotiation || negotiation?.stage === NegotiationStage.PITCH) {
        schedulePitchMeetingMutation.mutate({
          entrepreneurId: project?.Entrepreneur?.id ?? '',
          incubatorId: project?.Incubator?.id ?? '',
          date: now,
          investorId: investor?.id ?? '',
          vcGroupId: vcGroup?.id ?? '',
          projectId: projectId as string,
        });
      } else {
        scheduleOtherStageMeetingMutation.mutate({
          entrepreneurId: project?.Entrepreneur?.id ?? '',
          incubatorId: project?.Incubator?.id ?? '',
          date: now,
          investorId: investor?.id ?? '',
          vcGroupId: vcGroup?.id ?? '',
          projectId: projectId as string,
        });
      }
    } else {
      toast.error('Could not schedule meeting. Missing required information.');
    }
  };

  const handleOpenConfirmDialog = () => {
    if (selectedDate && time) {
      setIsConfirmModalOpen(true);
    }
  };

  useEffect(() => {
    if (projectId) {
      addInvestorViewMutation.mutateAsync({ projectId: projectId as string });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold sm:text-3xl">{project.name}</h1>
                  {(isInvestor || isVc) && (
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
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
                    <Dialog open={showWebsiteModal} onOpenChange={setShowWebsiteModal}>
                      <DialogTrigger asChild>
                        <Link
                          href={project.website ?? ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/70 hover:underline"
                          onClick={e => {
                            e.preventDefault();
                            setShowWebsiteModal(true);
                          }}
                        >
                          Click to show website
                        </Link>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('websiteWarningTitle')}</DialogTitle>
                          <DialogDescription>{t('websiteWarningDescription')}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setShowWebsiteModal(false)}
                          >
                            {t('cancel')}
                          </Button>
                          <Button
                            onClick={() => {
                              if (project.website) {
                                window.open(project.website, '_blank', 'noopener,noreferrer');
                              }
                              setShowWebsiteModal(false);
                            }}
                          >
                            {t('continue')}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <span className="mx-2">•</span>
                  <span className="w-fit rounded-full bg-white/10 border border-white/10 px-2 py-0.5 text-sm text-primary sm:px-6">
                    {project.sector?.name ?? 'Uncategorized'}
                  </span>
                  {isVc && (
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-white/70">•</span>
                      <Button variant="ghost" size="sm" onClick={() => setIsShareDialogOpen(true)}>
                        <Share className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-row md:flex-col md:items-end gap-4 items-center mt-2 sm:mt-0">
                {isProjectOwner && (
                  <BoostDialog
                    project={project}
                    availableBoosts={project.Entrepreneur?.user.availableBoosts ?? 0}
                  />
                )}
                {isProjectOwner && (
                  <ProjectDialog project={project} hypertrainItem={hypertrainItem} />
                )}
                {(isInvestor || isVc) &&
                  negotiation?.stage !== NegotiationStage.CLOSED &&
                  negotiation?.stage !== NegotiationStage.CANCELLED && (
                    <>
                      <Dialog open={openScheduleMeeting} onOpenChange={setOpenScheduleMeeting}>
                        <DialogTrigger asChild>
                          <Button
                            disabled={
                              negotiation?.entrepreneurActionNeeded &&
                              negotiation?.investorActionNeeded
                            }
                          >
                            <Calendar1Icon className="mr-2 h-4 w-4" /> Schedule{' '}
                            {capitalize(negotiation?.stage ?? 'Pitch')} Meeting
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl w-full mx-6">
                          <DialogHeader>
                            <DialogTitle>Schedule Meeting</DialogTitle>
                            <DialogDescription>
                              Select a date and time for your meeting.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-1/2 h-full rounded-xl border border-white/10 bg-card p-4">
                              <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-[#EFD687] p-3">
                                  <CalendarIcon className="h-6 w-6 text-background" />
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-base font-medium">
                                    {format(selectedDate, 'MMMM d, yyyy')}
                                  </p>
                                  <p className="text-xs text-white/50">
                                    {format(selectedDate, 'EEEE')}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4">
                                <DayPicker
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={date => setSelectedDate(date ?? tomorrow)}
                                  captionLayout="buttons"
                                  showOutsideDays
                                  disabled={{ before: tomorrow }}
                                  defaultMonth={selectedDate}
                                  classNames={{
                                    root: 'w-full',
                                    months: 'w-full',
                                    month: 'w-full',
                                    caption:
                                      'flex flex-row justify-center pt-1 relative items-center space-x-2 mb-4',
                                    caption_between: 'flex flex-row justify-center gap-1',
                                    nav: 'space-x-1 flex items-center text-white',
                                    nav_button_previous: 'absolute left-1',
                                    nav_button_next: 'absolute right-1',
                                    table: 'w-full border-collapse space-y-1',
                                    head_row: 'flex w-full justify-between',
                                    head_cell:
                                      'text-white/50 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center',
                                    row: 'flex w-full mt-2 justify-between',
                                    cell: 'flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary [&:has([aria-selected])]:text-primary-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-md',
                                    day: 'h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md',
                                    day_selected:
                                      'bg-[#EFD687] text-background hover:bg-[#EFD687] hover:text-background focus:bg-[#EFD687] focus:text-background',
                                    day_today: 'bg-white/5 text-white',
                                    day_outside: 'text-white/30 opacity-50',
                                    day_disabled: 'text-white/30',
                                    day_hidden: 'invisible',
                                  }}
                                  className="p-0"
                                />
                              </div>
                            </div>
                            <div className="w-full md:w-1/2 rounded-xl border border-white/10 bg-card p-4 flex flex-col">
                              <p className="font-medium mb-2">Select Time</p>
                              <div className="flex-grow overflow-y-auto grid grid-cols-3 gap-2 pr-2">
                                {availableHours.map((hour, i) => (
                                  <Button
                                    key={i}
                                    variant="outline"
                                    className={cn(
                                      'h-9',
                                      time === hour &&
                                      'bg-primary text-primary-foreground opacity-100'
                                    )}
                                    onClick={() => setTime(hour)}
                                  >
                                    {hour}
                                  </Button>
                                ))}
                              </div>
                              <div className="mt-4">
                                <p className="font-medium mb-2">Entrepreneur Preferred Time</p>
                                {preferredHours?.length === 0 ? (
                                  <p className="text-white/50">No preferred time set</p>
                                ) : (
                                  <div className="flex flex-row gap-2">
                                    {preferredHours?.map((hour, i) => (
                                      <p key={i} className="text-white/50">
                                        {hour.time}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="secondary"
                              onClick={handleScheduleMeetingNow}
                              disabled={
                                schedulePitchMeetingMutation.isPending ||
                                scheduleOtherStageMeetingMutation.isPending
                              }
                            >
                              {schedulePitchMeetingMutation.isPending ||
                                scheduleOtherStageMeetingMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Video className="mr-2 h-4 w-4" />
                              )}
                              Meeting Now
                            </Button>
                            <Button
                              onClick={handleOpenConfirmDialog}
                              disabled={
                                !selectedDate ||
                                !time ||
                                schedulePitchMeetingMutation.isPending ||
                                scheduleOtherStageMeetingMutation.isPending
                              }
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Review Schedule
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {!project.videoPitchUrl && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            requestPitchVideoMutation.mutate({ projectId: projectId as string })
                          }
                          disabled={requestPitchVideoMutation.isPending}
                        >
                          {requestPitchVideoMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Presentation className="mr-2 h-4 w-4" />
                          )}
                          Request Pitch
                        </Button>
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>

        <hr className="my-6 border-white/10 sm:my-8" />

        {/* Hypertrain Information Section */}
        {hypertrainItem && (
          <>
            <div className="mb-8 sm:mb-12">
              <Card className="overflow-hidden border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/20 via-primary/10 to-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Image/Video Section - Left Half */}
                  <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden bg-gradient-to-br from-purple-600/20 to-primary/20">
                    {hypertrainItem.image ? (
                      /\.(mp4|webm|ogg|mov)$/i.exec(hypertrainItem.image) ? (
                        <video
                          src={hypertrainItem.image}
                          controls
                          className="h-full w-full object-cover"
                        >
                          <track kind="captions" src="" srcLang="en" label="English" default />
                        </video>
                      ) : (
                        <Image
                          src={hypertrainItem.image}
                          alt={hypertrainItem.name}
                          fill
                          className="object-cover"
                          priority
                        />
                      )
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-center text-white/50">
                          <Presentation className="mx-auto h-12 w-12 mb-2" />
                          <p>No media available</p>
                        </div>
                      </div>
                    )}
                    {/* Overlay gradient for better text readability - only for images, not videos */}
                    {hypertrainItem.image &&
                      !/\.(mp4|webm|ogg|mov)$/i.exec(hypertrainItem.image) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/40" />
                      )}

                    {/* Badge overlay on image */}
                    <div className="absolute top-4 left-4 md:top-6 md:left-6">
                      <span className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        HYPERTRAIN FEATURED
                      </span>
                    </div>
                  </div>

                  {/* Content Section - Right Half */}
                  <div className="flex flex-col justify-center p-6 md:p-8 lg:p-12">
                    <div className="space-y-4 md:space-y-6">
                      {/* Header */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-purple-400">
                          <Clock className="h-4 w-4" />
                          <span>
                            Live until {format(new Date(hypertrainItem.liveUntil), 'MMMM d, yyyy')}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {hypertrainItem.description && (
                        <p className="text-base md:text-lg text-white/80 leading-relaxed">
                          {hypertrainItem.description}
                        </p>
                      )}

                      {/* Info Box */}
                      <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4 md:p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-purple-500/20 p-2 mt-0.5">
                            <Presentation className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white mb-1">Premium Visibility</h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                              This project is featured in Hypertrain, giving it increased visibility
                              and priority placement to attract more investors and opportunities.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex flex-wrap gap-3 text-sm text-white/60">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                            <span>Featured Project</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                            <span>Priority Listing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                            <span>Enhanced Reach</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <hr className="my-6 border-white/10 sm:my-8" />
          </>
        )}

        {(isInvestor || isVc) && negotiation?.investorActionNeeded && (
          <NextStepDialog negotiationId={negotiation.id} />
        )}

        {(isEntrepreneur || isIncubator) && negotiation?.entrepreneurActionNeeded && (
          <NextStepDialog negotiationId={negotiation.id} />
        )}
        {/* Pitch Video Section */}
        {project.videoPitchUrl &&
          (isProjectOwner ||
            user?.publicMetadata.userType === 'INVESTOR' ||
            user?.publicMetadata.userType === 'VC_GROUP') && (
            <>
              <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Pitch Video</h2>
              <div className="mt-3 sm:mt-4">
                {project.videoPitchUrl ? (
                  <video src={project.videoPitchUrl} controls className="w-full rounded-lg">
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <VideoPitchRequestButton projectId={projectId as string} />
                )}
              </div>
              <hr className="my-6 border-white/10 sm:my-8" />
            </>
          )}

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/80 sm:mt-4 sm:text-base">
              {project.about ?? 'No detailed description available.'}
            </p>

            {/* Company Photos Section */}
            {(project.photo1 ?? project.photo2 ?? project.photo3 ?? project.photo4) && (
              <>
                <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Company Photos</h2>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
                  {[
                    { photo: project.photo1, caption: project.photo1Caption },
                    { photo: project.photo2, caption: project.photo2Caption },
                    { photo: project.photo3, caption: project.photo3Caption },
                    { photo: project.photo4, caption: project.photo4Caption },
                  ]
                    .filter(item => Boolean(item.photo))
                    .map((item, index) => (
                      <div key={index} className="space-y-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="aspect-video overflow-hidden rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
                              <Image
                                src={item.photo!}
                                alt={item.caption ?? `${project.name} photo ${index + 1}`}
                                width={300}
                                height={200}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-7xl">
                            <div className="space-y-4">
                              <Image
                                src={item.photo!}
                                alt={item.caption ?? `${project.name} photo ${index + 1}`}
                                width={1920}
                                height={1080}
                                className="h-full w-full object-cover rounded-lg"
                              />
                              {item.caption && (
                                <p className="text-center text-sm text-white/70 px-4">
                                  {item.caption}
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        {item.caption && (
                          <p className="text-xs text-white/60 text-center px-1">{item.caption}</p>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}

            {/* Company Video Section */}
            {project.videoUrl &&
              (isProjectOwner ||
                user?.publicMetadata.userType === 'INVESTOR' ||
                user?.publicMetadata.userType === 'VC_GROUP') && (
                <>
                  <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Company Video</h2>
                  <div className="mt-3 sm:mt-4">
                    {isProjectOwner ? (
                      <video
                        src={project.videoUrl ?? undefined}
                        controls
                        className="w-full max-w-md rounded-lg"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <VideoRequestButton projectId={projectId as string} />
                    )}
                  </div>
                </>
              )}

            {negotiation && (
              <>
                <h2 className="text-lg font-semibold sm:text-xl mt-6">Negotiation Stage</h2>
                <div className="mt-6">
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
              </>
            )}

            <h2 className="mt-6 text-lg font-semibold sm:mt-8 sm:text-xl">Founder</h2>
            {project.Entrepreneur ? (
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
            ) : (
              <div className="mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4">
                {project.Incubator?.logo ? (
                  <Image
                    src={project.Incubator.logo}
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
                    {project.Incubator?.name} <span className="text-white/70">(Incubator)</span>
                  </p>
                  <p className="text-xs text-white/70 sm:text-sm">
                    {project.Incubator?.state?.name}, {project.Incubator?.country?.name}
                  </p>
                </div>
              </div>
            )}
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
                    {new Date(project.foundationDate).toISOString().split('T')[0]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {project.faqs &&
          project.faqs.length > 0 &&
          project.faqs.some(faq => faq.question && faq.answer) && (
            <div className="mt-8 sm:mt-12">
              <h2 className="text-lg font-semibold sm:text-xl">FAQ</h2>
              <div className="mt-3 space-y-4 sm:mt-4 sm:space-y-6">
                {project.faqs.map(faq => (
                  <div
                    key={faq.id}
                    className="rounded-lg border border-white/10 bg-card p-4 sm:p-6"
                  >
                    <h3 className="text-base font-medium sm:text-lg">{faq.question}</h3>
                    <p className="mt-2 text-sm text-white/80 sm:text-base">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      <ConfirmationDialog
        isOpen={isConfirmModalOpen}
        setIsOpen={setIsConfirmModalOpen}
        title="Confirm Meeting Schedule"
        onConfirm={handleScheduleMeeting}
        confirmText="Confirm Schedule"
        isConfirming={
          schedulePitchMeetingMutation.isPending || scheduleOtherStageMeetingMutation.isPending
        }
      >
        <div className="py-6 space-y-4">
          <div className="flex items-center gap-6 rounded-lg border border-white/10 p-4 bg-card">
            <div className="flex items-center gap-3">
              {project.logo ? (
                <Image
                  src={project.logo}
                  alt={`${project.name} Logo`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Building2 className="size-5 text-neutral-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-base">{project.name}</p>
                <p className="text-sm text-white/60">Meeting Confirmation</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-4 w-4 text-white/70 flex-shrink-0" />
                <span className="text-sm font-medium text-white">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-white/70 flex-shrink-0" />
                <span className="text-sm font-medium text-white">{time}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/50 px-1">
            Ensure the date and time are correct before confirming the schedule.
          </p>
        </div>
      </ConfirmationDialog>

      {isProjectOwner && <ProjectViews projectId={projectId as string} />}

      {/* Share Project Confirmation Dialog */}
      <AlertDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Share Project with VC Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to share this project with your VC team members?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Project Preview Card */}
          <Card className="bg-card/50 border-white/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {project?.logo ? (
                  <Image
                    src={project.logo}
                    alt={`${project.name} Logo`}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Building2 className="size-6 text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{project?.name}</h3>
                  <p className="text-sm text-gray-400 truncate">
                    {project?.Entrepreneur?.firstName} {project?.Entrepreneur?.lastName}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 border border-white/10 px-2 py-1">
                  {project?.sector?.name ?? 'Uncategorized'}
                </span>
                <span className="rounded-full bg-white/10 border border-white/10 px-2 py-1">
                  {formatStage(project?.stage)}
                </span>
                {project?.country && (
                  <span className="rounded-full bg-white/10 border border-white/10 px-2 py-1">
                    {project.country.name}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                shareProjectMutation.mutate({
                  projectId: projectId as string,
                  currentUserEmail: user?.primaryEmailAddress?.emailAddress ?? '',
                })
              }
              disabled={shareProjectMutation.isPending}
              className={cn(
                'bg-primary text-primary-foreground hover:bg-primary/90',
                shareProjectMutation.isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              {shareProjectMutation.isPending ? 'Sharing...' : 'Share Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

export function ProjectViews({ projectId }: { projectId: string }) {
  const { data: views } = api.project.getLast10ViewsInProject.useQuery({ id: projectId });

  if (!views || views.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 sm:mt-12">
      <h2 className="text-lg font-semibold sm:text-xl">Recent Views</h2>
      <div className="mt-3 space-y-2 sm:mt-4">
        {views.map(view => (
          <div key={view.id} className="flex items-center gap-3 text-sm text-white/70">
            <Clock className="h-4 w-4" />
            <span>Viewed {formatDistanceToNow(new Date(view.createdAt))} ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoRequestButton({ projectId }: { projectId: string }) {
  const [hasRequested, setHasRequested] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const requestVideoMutation = api.project.requestVideoAccess.useMutation({
    onSuccess: data => {
      setHasRequested(true);
      setVideoUrl(data.videoUrl ?? null);
      toast.success('Video access granted! You are now connected with the entrepreneur.');
    },
    onError: error => {
      toast.error('Failed to request video access: ' + error.message);
    },
  });

  const handleRequestVideo = () => {
    requestVideoMutation.mutate({ projectId });
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
        <h3 className="text-lg font-medium">Company Video Available</h3>
      </div>
      <p className="text-sm text-white/70 mb-4">
        This company has uploaded a video presentation. Request access to view it and connect with
        the entrepreneur.
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

function VideoPitchRequestButton({ projectId }: { projectId: string }) {
  const [hasRequested, setHasRequested] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const requestVideoMutation = api.project.requestVideoAccess.useMutation({
    onSuccess: data => {
      setHasRequested(true);
      setVideoUrl(data.videoUrl ?? null);
      toast.success('Video access granted! You are now connected with the entrepreneur.');
    },
    onError: error => {
      toast.error('Failed to request video access: ' + error.message);
    },
  });

  const handleRequestVideo = () => {
    requestVideoMutation.mutate({ projectId });
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
        <h3 className="text-lg font-medium">Pitch Video Available</h3>
      </div>
      <p className="text-sm text-white/70 mb-4">
        This company has uploaded a pitch video. Request access to view it and connect with the
        entrepreneur.
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
            <Presentation className="mr-2 h-4 w-4" />
            Request Pitch
          </>
        )}
      </Button>
    </div>
  );
}
