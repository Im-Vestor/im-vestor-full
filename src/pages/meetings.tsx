import { useUser } from '@clerk/nextjs';
import { UTCDate } from '@date-fns/utc';
import {
  addHours,
  format,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  subMinutes,
} from 'date-fns';
import { Building2, CalendarIcon, ClockIcon, ListIcon, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { toast } from 'sonner';
import { ConfirmationDialog } from '~/components/confirmation-dialog';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Skeleton } from '~/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { api } from '~/utils/api';

const DAY_PICKER_CLASS_NAMES = {
  root: 'w-full',
  months: 'w-full',
  month: 'w-full',
  caption: 'flex flex-row justify-center pt-1 relative items-center space-x-2 mb-4',
  caption_between: 'flex flex-row justify-center gap-1',
  nav: 'space-x-1 flex items-center text-white',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse space-y-1',
  head_row: 'flex w-full justify-between',
  head_cell: 'text-white/50 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center',
  row: 'flex w-full mt-2 justify-between',
  cell: 'flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary [&:has([aria-selected])]:text-primary-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-md',
  day: 'h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md',
  day_selected:
    'bg-[#EFD687] text-black hover:bg-[#EFD687] hover:text-black focus:bg-[#EFD687] focus:text-black',
  day_today: 'bg-white/5 text-white',
  day_outside: 'text-white/30 opacity-50',
  day_disabled: 'text-white/30',
  day_hidden: 'invisible',
};

function formatTime(date: Date | string) {
  return new Date(date).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function getDayLabel(date: Date): { label: string; isToday: boolean; isTomorrow: boolean } {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addHours(new Date(), 24), 'yyyy-MM-dd');
  const day = format(date, 'yyyy-MM-dd');
  if (day === today) return { label: 'Today', isToday: true, isTomorrow: false };
  if (day === tomorrow) return { label: 'Tomorrow', isToday: false, isTomorrow: true };
  return { label: format(date, 'EEE, MMM d'), isToday: false, isTomorrow: false };
}

function ParticipantAvatar({ imageUrl, name }: { imageUrl?: string | null; name: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
              <User className="h-3.5 w-3.5 text-white/40" />
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ProjectLogo({
  logo,
  name,
  onClick,
}: {
  logo?: string | null;
  name?: string | null;
  onClick: () => void;
}) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={name ?? 'Project'}
        width={44}
        height={44}
        className="h-11 w-11 cursor-pointer rounded-lg object-cover"
        onClick={onClick}
      />
    );
  }
  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
      onClick={onClick}
    >
      <Building2 className="h-5 w-5 text-white/40" />
    </button>
  );
}

function MeetingCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/8">
      <div className="flex items-start gap-3 p-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <div className="flex gap-1">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function UpcomingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.03] p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export default function Meetings() {
  const { user } = useUser();
  const utils = api.useUtils();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new UTCDate());
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [meetingToCancelId, setMeetingToCancelId] = useState<string | null>(null);

  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';
  const isInvestor = user?.publicMetadata.userType === 'INVESTOR';
  const isVC = user?.publicMetadata.userType === 'VC_GROUP';
  const isIncubator = user?.publicMetadata.userType === 'INCUBATOR';

  const { data: meetings, isLoading } = api.meeting.getMeetingsByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate }
  );

  const { data: upcomingMeetings, isLoading: isLoadingUpcoming } =
    api.meeting.getUpcomingMeetings.useQuery();

  const { mutateAsync: cancelMeeting, isPending: isCancellingMeeting } =
    api.meeting.cancelMeeting.useMutation({
      onSuccess: async () => {
        toast.success('Meeting cancelled successfully');
        void utils.meeting.getMeetingsByDate.invalidate();
        void utils.meeting.getUpcomingMeetings.invalidate();
        setIsCancelConfirmOpen(false);
        setMeetingToCancelId(null);
      },
      onError: error => {
        toast.error(error.message);
        setIsCancelConfirmOpen(false);
        setMeetingToCancelId(null);
      },
    });

  const handleCancelClick = (meetingId: string) => {
    setMeetingToCancelId(meetingId);
    setIsCancelConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    if (meetingToCancelId) {
      void cancelMeeting({ meetingId: meetingToCancelId });
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />

      {/* Calendar + Day meetings */}
      <div className="mt-12 flex max-h-[450px] items-stretch gap-6">
        {/* Calendar panel */}
        <div className="flex w-2/5 flex-col rounded-xl border-2 border-white/10 bg-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#EFD687] p-3">
              <CalendarIcon className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-base font-semibold">{format(selectedDate, 'MMMM d, yyyy')}</p>
              <p className="text-xs text-white/50">{format(selectedDate, 'EEEE')}</p>
            </div>
          </div>
          <div className="flex-1">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={date => setSelectedDate(date ?? new UTCDate())}
              captionLayout="buttons"
              showOutsideDays
              classNames={DAY_PICKER_CLASS_NAMES}
              className="p-3"
            />
          </div>
        </div>

        {/* Day meetings panel */}
        <div className="flex w-3/5 flex-col rounded-xl border-2 border-white/10 bg-card p-6">
          {isEntrepreneur ? (
            <div className="mb-4 flex h-[44px] shrink-0 items-center justify-between rounded-lg border border-white/8 bg-white/[0.03] px-4">
              <p className="text-sm text-white/70">Manage your preferred hours</p>
              <Link href="/preferred-hours">
                <Button variant="outline" className="h-7 px-3 text-xs">
                  Manage
                </Button>
              </Link>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
            {isLoading ? (
              <>
                <MeetingCardSkeleton />
                <MeetingCardSkeleton />
                <MeetingCardSkeleton />
              </>
            ) : meetings && meetings.length > 0 ? (
              meetings.map(meeting => {
                const now = new Date();
                const meetingStartDate = new Date(meeting.startDate);
                const meetingEndDate = addHours(meetingStartDate, 1);
                const canEnterMeeting =
                  meeting.url &&
                  !isAfter(now, meetingEndDate) &&
                  !isBefore(now, subMinutes(meetingStartDate, 5));
                const isLive =
                  meeting.url && !isBefore(now, meetingStartDate) && !isAfter(now, meetingEndDate);
                const isExpired = isAfter(now, meetingEndDate);

                return (
                  <div
                    key={meeting.id}
                    className={`rounded-xl border transition-colors ${
                      isLive
                        ? 'border-[#EFD687]/40 bg-[#EFD687]/[0.04]'
                        : 'border-white/8 bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Card body */}
                    <div className="flex items-start gap-3 p-4">
                      <div className="shrink-0">
                        <ProjectLogo
                          logo={meeting.negotiation?.project?.logo}
                          name={meeting.negotiation?.project?.name}
                          onClick={() =>
                            router.push(`/projects/${meeting.negotiation?.project?.name}`)
                          }
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {meeting.negotiation?.project?.name ?? ''}
                          </p>
                          {isLive ? (
                            <span className="shrink-0 rounded-full bg-[#EFD687]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#EFD687]">
                              Live
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-white/40">
                          {[
                            meeting.negotiation?.project?.state?.name,
                            meeting.negotiation?.project?.country?.name,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <ClockIcon className="h-3 w-3 text-white/30" />
                          <span className="font-medium tabular-nums text-white/80">
                            {formatTime(meeting.startDate)} – {formatTime(meeting.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-white/30">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{format(meeting.startDate, 'EEE, MMM d')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {isEntrepreneur ? (
                          meeting.investors.map(inv => (
                            <ParticipantAvatar
                              key={inv.id}
                              imageUrl={inv.user.imageUrl}
                              name={`${inv.firstName} ${inv.lastName}`}
                            />
                          ))
                        ) : meeting.entrepreneur ? (
                          <ParticipantAvatar
                            imageUrl={meeting.entrepreneur.user.imageUrl}
                            name={`${meeting.entrepreneur.firstName} ${meeting.entrepreneur.lastName}`}
                          />
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isExpired ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs text-white/40 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => handleCancelClick(meeting.id)}
                            disabled={isCancellingMeeting}
                          >
                            Cancel
                          </Button>
                        ) : null}
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
                          {isLive ? '▶ Enter Now' : 'Enter Meeting'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <CalendarIcon className="h-5 w-5 text-white/20" />
                </div>
                <p className="text-center text-sm text-white/40">
                  No meetings scheduled for this date.
                </p>
                {isInvestor ? (
                  <Link href="/projects">
                    <Button variant="secondary" size="sm">
                      Find Projects
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming meetings */}
      <div className="mt-6 rounded-xl border-2 border-white/10 bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2.5">
            <ListIcon className="h-5 w-5 text-[#EFD687]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Upcoming Meetings</h2>
            <p className="text-xs text-white/40">Your next scheduled sessions</p>
          </div>
        </div>

        {isLoadingUpcoming ? (
          <div className="flex flex-col gap-3">
            <UpcomingRowSkeleton />
            <UpcomingRowSkeleton />
            <UpcomingRowSkeleton />
          </div>
        ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {upcomingMeetings.map((meeting, index) => {
              const startDate = new Date(meeting.startDate);
              const { label: dayLabel, isToday, isTomorrow } = getDayLabel(startDate);

              const counterparts: string[] = isEntrepreneur
                ? [
                    ...meeting.investors.map(inv => `${inv.firstName} ${inv.lastName}`),
                    ...meeting.vcGroups.map(vc => vc.name),
                    ...meeting.incubators.map(inc => inc.name),
                  ]
                : (isInvestor || isVC || isIncubator) && meeting.entrepreneur
                  ? [`${meeting.entrepreneur.firstName} ${meeting.entrepreneur.lastName}`]
                  : [];

              return (
                <div
                  key={meeting.id}
                  className="group flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="shrink-0">
                    {meeting.negotiation?.project?.logo ? (
                      <Image
                        src={meeting.negotiation.project.logo}
                        alt="Project"
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5">
                        <Building2 className="h-5 w-5 text-white/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium text-white">
                      {meeting.negotiation?.project?.name ?? 'Unnamed project'}
                    </p>
                    {counterparts.length > 0 ? (
                      <p className="truncate text-xs text-white/40">
                        with {counterparts.join(', ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span
                      className={`text-xs font-semibold ${
                        isToday ? 'text-[#EFD687]' : isTomorrow ? 'text-white/70' : 'text-white/50'
                      }`}
                    >
                      {dayLabel}
                    </span>
                    <span className="text-xs text-white/40">
                      {formatTime(startDate)}
                      {' · '}
                      {formatDistanceToNowStrict(startDate, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <p className="text-sm text-white/30">No upcoming meetings scheduled.</p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isCancelConfirmOpen}
        setIsOpen={setIsCancelConfirmOpen}
        title="Cancel Meeting"
        onConfirm={handleConfirmCancel}
        confirmText="Yes, cancel meeting"
        isConfirming={isCancellingMeeting}
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel this meeting? This action cannot be undone.
        </p>
      </ConfirmationDialog>
    </main>
  );
}
