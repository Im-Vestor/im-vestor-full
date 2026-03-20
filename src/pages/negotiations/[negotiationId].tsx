import { useUser } from '@clerk/nextjs';
import { NegotiationStage } from '@prisma/client';
import {
  addHours,
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  subMinutes,
  startOfTomorrow,
} from 'date-fns';
import {
  ArrowLeft,
  Building2,
  CalendarIcon,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  FileType2,
  Loader2,
  Plus,
  Trash2,
  Upload,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { toast } from 'sonner';
import { NextStepDialog } from '~/components/next-step/dialog';
import { ClosingWorkflow } from '~/components/negotiation/closing-workflow';
import { Header } from '~/components/header';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Stepper } from '~/components/ui/stepper';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';

const NEGOTIATION_STEPS = [
  { label: 'Pitch' },
  { label: 'Negotiation' },
  { label: 'Closing' },
  { label: 'Closed' },
];

const STAGE_TO_STEP_MAP: Record<string, number> = {
  PITCH: 0,
  NEGOTIATION: 1,
  DETAILS: 2,
  CLOSED: 3,
};

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
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

function getFileIcon(type: string) {
  if (type.includes('pdf')) return { icon: FileText, color: 'text-red-400' };
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv'))
    return { icon: FileSpreadsheet, color: 'text-green-400' };
  if (type.includes('word') || type.includes('document'))
    return { icon: FileType2, color: 'text-blue-400' };
  return { icon: File, color: 'text-white/50' };
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NegotiationDetailPage() {
  const router = useRouter();
  const { user } = useUser();
  const { negotiationId } = router.query;

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfTomorrow());
  const [time, setTime] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const utils = api.useUtils();

  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const debouncedInvalidate = useCallback(() => {
    clearTimeout(invalidateTimerRef.current);
    invalidateTimerRef.current = setTimeout(() => {
      void utils.negotiation.getById.invalidate({ negotiationId: negotiationId as string });
    }, 300);
  }, [utils, negotiationId]);

  const { data, isPending } = api.negotiation.getById.useQuery(
    { negotiationId: negotiationId as string },
    { enabled: typeof negotiationId === 'string', refetchOnWindowFocus: false }
  );

  const scheduleMutation = api.negotiation.scheduleMeeting.useMutation({
    onSuccess: () => {
      toast.success('Meeting scheduled successfully');
      setScheduleOpen(false);
      setTime(null);
      setSelectedDate(startOfTomorrow());
      void utils.negotiation.getById.invalidate({ negotiationId: negotiationId as string });
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const addDocumentMutation = api.negotiation.addDocument.useMutation({
    onSuccess: (_, vars) => {
      debouncedInvalidate();
      toast.success(`${vars.name} uploaded`);
    },
    onError: (_, vars) => {
      debouncedInvalidate();
      toast.error(`Failed to save ${vars.name}`);
    },
  });

  const removeDocumentMutation = api.negotiation.removeDocument.useMutation({
    onSuccess: async () => {
      await utils.negotiation.getById.invalidate({ negotiationId: negotiationId as string });
      setDeletingDocId(null);
      toast.success('Document removed');
    },
    onError: error => {
      setDeletingDocId(null);
      toast.error(error.message);
    },
  });

  const userType = user?.publicMetadata.userType as string | undefined;
  const isEntrepreneurSide = userType === 'ENTREPRENEUR' || userType === 'INCUBATOR';
  const isInvestorSide = userType === 'INVESTOR' || userType === 'VC_GROUP';

  const backHref = isEntrepreneurSide ? '/entrepreneur/negotiations' : '/investor/involved-in';

  function handleMutationSuccess() {
    void utils.negotiation.getById.invalidate({ negotiationId: negotiationId as string });
  }

  function handleScheduleMeeting() {
    const neg = data?.negotiation;
    if (!neg || !selectedDate || !time) return;
    const meetingDateTime = new Date(selectedDate);
    meetingDateTime.setHours(parseInt(time.split(':')[0] ?? '0'));
    meetingDateTime.setMinutes(0);
    scheduleMutation.mutate({
      projectId: neg.projectId,
      date: meetingDateTime,
      investorId: neg.investorId ?? undefined,
      vcGroupId: neg.vcGroupId ?? undefined,
      entrepreneurId: neg.project.Entrepreneur?.id ?? undefined,
      incubatorId: neg.project.Incubator?.id ?? undefined,
    });
  }

  function handleMeetingNow() {
    const neg = data?.negotiation;
    if (!neg) return;
    scheduleMutation.mutate({
      projectId: neg.projectId,
      date: new Date(),
      investorId: neg.investorId ?? undefined,
      vcGroupId: neg.vcGroupId ?? undefined,
      entrepreneurId: neg.project.Entrepreneur?.id ?? undefined,
      incubatorId: neg.project.Incubator?.id ?? undefined,
      instantMeeting: true,
    });
  }

  async function uploadFile(file: globalThis.File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`File type not supported: ${file.name}`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File too large (max 50MB): ${file.name}`);
      return;
    }

    setUploadingFiles(prev => [...prev, file.name]);
    let uploadedUrl: string | null = null;
    try {
      const res = await fetch('/api/upload-document', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-File-Name': encodeURIComponent(file.name),
        },
        body: file,
      });

      if (!res.ok) throw new Error('storage');
      uploadedUrl = ((await res.json()) as { url: string }).url;

      await addDocumentMutation.mutateAsync({
        negotiationId: negotiationId as string,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadedUrl,
      });
      // success toast + invalidation handled by addDocumentMutation.onSuccess
    } catch {
      // only show a toast here for storage failures — mutation failures are
      // handled by addDocumentMutation.onError to avoid duplicate toasts
      if (uploadedUrl === null) {
        toast.error(`Failed to upload ${file.name}`);
        debouncedInvalidate();
      }
    } finally {
      setUploadingFiles(prev => prev.filter(n => n !== file.name));
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    await Promise.allSettled(Array.from(files).map(file => uploadFile(file)));
    if (files.length > 0) setUploadOpen(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    await handleFilesSelected(e.dataTransfer.files);
  }

  if (isPending || !negotiationId) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-12 animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="h-10 w-96 rounded bg-white/10" />
          <div className="h-24 rounded-xl bg-white/10" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="h-48 rounded-xl bg-white/10" />
            <div className="h-48 rounded-xl bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-12 text-center">
          <p className="text-white/60">Negotiation not found.</p>
        </div>
      </main>
    );
  }

  const { negotiation } = data;
  const isCancelled = negotiation.stage === NegotiationStage.CANCELLED;
  const isClosed = negotiation.stage === NegotiationStage.CLOSED;
  const isActive = !isCancelled && !isClosed;
  const canScheduleMeeting = isActive && negotiation.stage !== NegotiationStage.PITCH;

  const counterpartName = isInvestorSide
    ? negotiation.project.Entrepreneur
      ? `${negotiation.project.Entrepreneur.firstName} ${negotiation.project.Entrepreneur.lastName}`
      : (negotiation.project.Incubator?.name ?? null)
    : negotiation.investor
      ? `${negotiation.investor.firstName} ${negotiation.investor.lastName}`
      : (negotiation.VcGroup?.name ?? null);

  const showNextStepForEntrepreneur =
    isEntrepreneurSide &&
    isActive &&
    (negotiation.entrepreneurActionNeeded || negotiation.entrepreneurAgreedToGoToNextStage);

  const showNextStepForInvestor =
    isInvestorSide &&
    isActive &&
    (negotiation.investorActionNeeded || negotiation.investorAgreedToGoToNextStage);

  const isUploading = uploadingFiles.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-3">
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#EFD687]">{negotiation.project.name}</h1>
            {counterpartName && (
              <p className="mt-1 text-sm text-white/50">
                In {isCancelled ? 'cancelled' : isClosed ? 'closed' : 'active'} deal with{' '}
                <span className="text-white/70">{counterpartName}</span>
              </p>
            )}
          </div>
        </div>

        {isCancelled ? (
          <div className="flex items-center gap-3 rounded-xl border-2 border-red-500/30 bg-red-500/10 px-6 py-4">
            <X className="size-5 shrink-0 text-red-400" />
            <div>
              <p className="font-semibold text-red-400">Negotiation Cancelled</p>
              <p className="text-sm text-white/60">
                This negotiation has been cancelled by one of the parties.
              </p>
            </div>
          </div>
        ) : isClosed ? (
          <div className="flex items-center gap-3 rounded-xl border-2 border-green-500/30 bg-green-500/10 px-6 py-4">
            <div>
              <p className="font-semibold text-green-400">Deal Closed</p>
              <p className="text-sm text-white/60">
                This negotiation has been successfully closed.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-card px-6 py-8">
            <Stepper
              steps={NEGOTIATION_STEPS}
              currentStep={STAGE_TO_STEP_MAP[negotiation.stage] ?? 0}
            />
          </div>
        )}

        {showNextStepForEntrepreneur && (
          <NextStepDialog
            negotiationId={negotiation.id}
            hasCurrentUserAgreed={negotiation.entrepreneurAgreedToGoToNextStage}
            hasOtherPartyAgreed={negotiation.investorAgreedToGoToNextStage}
            onSuccess={handleMutationSuccess}
          />
        )}

        {showNextStepForInvestor && (
          <NextStepDialog
            negotiationId={negotiation.id}
            hasCurrentUserAgreed={negotiation.investorAgreedToGoToNextStage}
            hasOtherPartyAgreed={negotiation.entrepreneurAgreedToGoToNextStage}
            onSuccess={handleMutationSuccess}
          />
        )}

        {/* Closing Workflow - Only visible in DETAILS stage */}
        {negotiation.stage === NegotiationStage.DETAILS && (
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#EFD687]">Deal Closing Workflow</h2>
              <p className="mt-1 text-sm text-white/50">
                Complete these steps to finalize your investment deal
              </p>
            </div>
            <ClosingWorkflow
              negotiationId={negotiation.id}
              userType={userType ?? 'ENTREPRENEUR'}
              onUpdate={handleMutationSuccess}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            {/* Project card */}
            <div className="rounded-xl border border-white/10 bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#EFD687]">Project</h2>
              <div className="flex items-start gap-4">
                {negotiation.project.logo ? (
                  <Image
                    src={negotiation.project.logo}
                    alt={negotiation.project.name}
                    width={64}
                    height={64}
                    className="size-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                    <Building2 className="size-8 text-white/40" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold">{negotiation.project.name}</h3>
                  {negotiation.project.quickSolution && (
                    <p className="mt-1 line-clamp-2 text-sm text-white/60">
                      {negotiation.project.quickSolution}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {negotiation.project.country && (
                      <Badge variant="secondary" className="bg-white/10 text-xs text-white/70">
                        {negotiation.project.country.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <Link href={`/projects/${negotiation.project.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-white/10 text-white/70 hover:text-white"
                  >
                    <ExternalLink className="size-3.5" />
                    View Project
                  </Button>
                </Link>
              </div>
            </div>

            {/* Counterpart card */}
            <div className="rounded-xl border border-white/10 bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#EFD687]">
                {isInvestorSide ? 'Founder' : 'Investor'}
              </h2>

              {isInvestorSide &&
                (negotiation.project.Entrepreneur ? (
                  <div className="flex items-start gap-4">
                    {negotiation.project.Entrepreneur.photo ? (
                      <Image
                        src={negotiation.project.Entrepreneur.photo}
                        alt="Entrepreneur"
                        width={64}
                        height={64}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                        <UserRound className="size-8 text-white/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {negotiation.project.Entrepreneur.firstName}{' '}
                        {negotiation.project.Entrepreneur.lastName}
                      </h3>
                      <p className="text-sm text-white/60">
                        {negotiation.project.Entrepreneur.user.email}
                      </p>
                    </div>
                  </div>
                ) : negotiation.project.Incubator ? (
                  <div className="flex items-start gap-4">
                    {negotiation.project.Incubator.logo ? (
                      <Image
                        src={negotiation.project.Incubator.logo}
                        alt="Incubator"
                        width={64}
                        height={64}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                        <Building2 className="size-8 text-white/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {negotiation.project.Incubator.name}
                      </h3>
                      <p className="text-sm text-white/60">{negotiation.project.Incubator.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40">No founder information available.</p>
                ))}

              {isEntrepreneurSide &&
                (negotiation.investor ? (
                  <div className="flex items-start gap-4">
                    {negotiation.investor.photo ? (
                      <Image
                        src={negotiation.investor.photo}
                        alt="Investor"
                        width={64}
                        height={64}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                        <UserRound className="size-8 text-white/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {negotiation.investor.firstName} {negotiation.investor.lastName}
                      </h3>
                      {negotiation.investor.about && (
                        <p className="mt-1 line-clamp-2 text-sm text-white/60">
                          {negotiation.investor.about}
                        </p>
                      )}
                    </div>
                  </div>
                ) : negotiation.VcGroup ? (
                  <div className="flex items-start gap-4">
                    {negotiation.VcGroup.logo ? (
                      <Image
                        src={negotiation.VcGroup.logo}
                        alt="VC Group"
                        width={64}
                        height={64}
                        className="size-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-lg bg-white/10">
                        <Building2 className="size-8 text-white/40" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{negotiation.VcGroup.name}</h3>
                      {negotiation.VcGroup.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-white/60">
                          {negotiation.VcGroup.description}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/40">No investor information available.</p>
                ))}
            </div>
          </div>

          {/* Meetings column */}
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#EFD687]">Meetings</h2>
              {canScheduleMeeting && (
                <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-white/10 text-white/70 hover:text-white"
                    >
                      <Plus className="size-3.5" />
                      Schedule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="mx-6 w-full sm:max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Schedule Meeting</DialogTitle>
                      <DialogDescription>
                        Pick a date and time, or start an instant meeting now.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 md:flex-row">
                      <div className="w-full rounded-xl border border-white/10 bg-card p-4 md:w-1/2">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-lg bg-[#EFD687] p-2.5">
                            <CalendarIcon className="size-5 text-background" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {format(selectedDate, 'MMMM d, yyyy')}
                            </p>
                            <p className="text-xs text-white/50">{format(selectedDate, 'EEEE')}</p>
                          </div>
                        </div>
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={date => setSelectedDate(date ?? startOfTomorrow())}
                          captionLayout="buttons"
                          showOutsideDays
                          disabled={{ before: startOfTomorrow() }}
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
                            cell: 'flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 rounded-md',
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
                      <div className="flex w-full flex-col rounded-xl border border-white/10 bg-card p-4 md:w-1/2">
                        <p className="mb-2 text-sm font-medium">Select Time</p>
                        <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto">
                          {availableHours.map(hour => (
                            <Button
                              key={hour}
                              variant="outline"
                              size="sm"
                              className={cn(
                                'border-white/10',
                                time === hour &&
                                  'border-[#EFD687] bg-[#EFD687] text-background hover:bg-[#EFD687]/90'
                              )}
                              onClick={() => setTime(hour)}
                            >
                              {hour}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={handleMeetingNow}
                        disabled={scheduleMutation.isPending}
                        className="gap-2"
                      >
                        {scheduleMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Video className="size-4" />
                        )}
                        Meet Now
                      </Button>
                      <Button
                        onClick={handleScheduleMeeting}
                        disabled={!time || scheduleMutation.isPending}
                        className="gap-2"
                      >
                        {scheduleMutation.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CalendarIcon className="size-4" />
                        )}
                        Schedule
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {negotiation.meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarIcon className="mb-3 size-10 text-white/20" />
                <p className="text-sm text-white/40">No meetings scheduled yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {negotiation.meetings.map(meeting => {
                  const now = new Date();
                  const startDate = new Date(meeting.startDate);
                  const endDate = addHours(startDate, 1);
                  const canEnterMeeting =
                    meeting.url &&
                    !isAfter(now, endDate) &&
                    !isBefore(now, subMinutes(startDate, 5));
                  const isLive = meeting.url && !isBefore(now, startDate) && !isAfter(now, endDate);
                  const isExpired = isAfter(now, endDate);

                  return (
                    <div
                      key={meeting.id}
                      className={`rounded-xl border transition-colors ${
                        isLive
                          ? 'border-[#EFD687]/40 bg-[#EFD687]/[0.04]'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="size-4 shrink-0 text-white/40" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">
                                {format(startDate, 'EEE, MMM d')}
                              </p>
                              {isLive && (
                                <span className="rounded-full bg-[#EFD687]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#EFD687]">
                                  Live
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/50">
                              {format(startDate, 'h:mm a')} – {format(endDate, 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              isExpired
                                ? 'border-white/10 bg-white/10 text-white/50'
                                : isLive
                                  ? 'border-[#EFD687]/30 bg-[#EFD687]/20 text-[#EFD687]'
                                  : 'border-green-500/30 bg-green-500/20 text-green-400'
                            }
                          >
                            {isExpired ? 'Past' : isLive ? 'Live' : 'Upcoming'}
                          </Badge>
                          {!isExpired && (
                            <Button
                              size="sm"
                              disabled={!canEnterMeeting}
                              className={`h-7 px-3 text-xs ${
                                canEnterMeeting
                                  ? 'bg-[#EFD687] text-black hover:bg-[#EFD687]/90'
                                  : 'opacity-40'
                              }`}
                              onClick={() => window.open(meeting.url ?? '', '_blank')}
                            >
                              {isLive ? 'Enter Now' : 'Enter Meeting'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Documents section */}
        <div className="rounded-xl border border-white/10 bg-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#EFD687]">Documents</h2>
              <p className="mt-0.5 text-xs text-white/40">
                PDFs, spreadsheets, presentations and other files shared in this negotiation
              </p>
            </div>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-white/10 text-white/70 hover:text-white"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Upload className="size-3.5" />
                  )}
                  {isUploading ? `Uploading (${uploadingFiles.length})…` : 'Upload'}
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-6 w-full sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Upload Documents</DialogTitle>
                  <DialogDescription>
                    Share PDFs, spreadsheets, presentations and other files with the other party.
                  </DialogDescription>
                </DialogHeader>

                <label
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={e => {
                    void handleDrop(e);
                  }}
                  className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all',
                    isDragging
                      ? 'border-[#EFD687]/60 bg-[#EFD687]/5'
                      : 'border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-14 items-center justify-center rounded-full transition-colors',
                      isDragging ? 'bg-[#EFD687]/15' : 'bg-white/5'
                    )}
                  >
                    <Upload
                      className={cn(
                        'size-6 transition-colors',
                        isDragging ? 'text-[#EFD687]' : 'text-white/30'
                      )}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/80">
                      {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      or click to browse · PDF, Excel, Word, PPT · max 50 MB
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept={ACCEPTED_TYPES.join(',')}
                    className="hidden"
                    onChange={e => {
                      void handleFilesSelected(e.target.files);
                    }}
                  />
                </label>

                {isUploading && (
                  <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.02] p-3">
                    {uploadingFiles.map(name => (
                      <div key={name} className="flex items-center gap-2">
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-[#EFD687]" />
                        <span className="truncate text-xs text-white/60">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {negotiation.files.length === 0 && !isUploading ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white/5">
                <File className="size-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40">No documents uploaded yet.</p>
              <p className="mt-1 text-xs text-white/25">
                Upload contracts, pitch decks, financial models and more.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {negotiation.files.map(doc => {
                const isDeleting = doc.id === deletingDocId;
                const { icon: DocIcon, color } = getFileIcon(doc.type);
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 transition-colors',
                      isDeleting
                        ? 'pointer-events-none opacity-50'
                        : 'hover:border-white/15 hover:bg-white/[0.04]'
                    )}
                  >
                    {isDeleting && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/30">
                        <Loader2 className="size-5 animate-spin text-white/70" />
                      </div>
                    )}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white/5">
                      <DocIcon className={cn('size-4', color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">{doc.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-xs text-white/35">{formatBytes(doc.size)}</span>
                        {doc.createdAt && (
                          <>
                            <span className="text-white/20">·</span>
                            <span className="text-xs text-white/35">
                              {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.name}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-7 p-0 text-white/50 hover:text-white"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="size-7 p-0 text-white/50 hover:text-red-400"
                        disabled={!!deletingDocId}
                        onClick={() => {
                          setDeletingDocId(doc.id);
                          removeDocumentMutation.mutate({
                            fileId: doc.id,
                            negotiationId: negotiation.id,
                          });
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
