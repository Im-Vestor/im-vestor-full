import { useUser } from '@clerk/nextjs';
import { UTCDate } from '@date-fns/utc';
import { addHours, format, isAfter, isBefore, subMinutes } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';
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

export default function Meetings() {
  const { user } = useUser();
  const utils = api.useUtils();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new UTCDate());
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [meetingToCancelId, setMeetingToCancelId] = useState<string | null>(null);

  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';
  const isInvestor = user?.publicMetadata.userType === 'INVESTOR';

  const { data: meetings, isLoading } = api.meeting.getMeetingsByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate }
  );

  const { mutateAsync: cancelMeeting, isPending: isCancellingMeeting } =
    api.meeting.cancelMeeting.useMutation({
      onSuccess: async () => {
        toast.success('Meeting cancelled successfully');
        void utils.meeting.getMeetingsByDate.invalidate();
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
      void cancelMeeting({ id: meetingToCancelId });
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 flex gap-6">
        <div className="min-h-50 h-fit w-2/5 rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#EFD687] p-4">
              <CalendarIcon className="h-8 w-8 text-black" />
            </div>
            <div className="flex flex-col">
              <p className="mt-2 text-lg font-medium">{format(selectedDate, 'MMMM d, yyyy')}</p>
              <p className="text-sm text-white/50">{format(selectedDate, 'EEEE')}</p>
            </div>
          </div>
          <div className="mt-4">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={date => setSelectedDate(date ?? new UTCDate())}
              captionLayout="buttons"
              showOutsideDays
              classNames={{
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
                head_cell:
                  'text-white/50 rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center',
                row: 'flex w-full mt-2 justify-between',
                cell: 'flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-primary [&:has([aria-selected])]:text-primary-foreground first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 rounded-md',
                day: 'h-9 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md',
                day_selected:
                  'bg-[#EFD687] text-black hover:bg-[#EFD687] hover:text-black focus:bg-[#EFD687] focus:text-black',
                day_today: 'bg-white/5 text-white',
                day_outside: 'text-white/30 opacity-50',
                day_disabled: 'text-white/30',
                day_hidden: 'invisible',
              }}
              className="p-3"
            />
          </div>
        </div>
        <div className="w-3/5 min-h-50 rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="mb-4 flex flex-col gap-4">
            {isEntrepreneur && (
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <p className="text-sm">Manage your preferred hours</p>
                <Link href="/preferred-hours">
                  <Button variant="outline">Manage</Button>
                </Link>
              </div>
            )}
            {isLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <div className="rounded-xl border-2 border-white/10 bg-card p-6" key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-36" />
                      </div>
                    </div>
                  </div>
                  <Skeleton className="my-4 h-px w-full" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-8 w-28" />
                    </div>
                  </div>
                </div>
              ))
            ) : meetings && meetings.length > 0 ? (
              meetings?.map(meeting => {
                const now = new Date();
                const meetingStartDate = new Date(meeting.startDate);
                const meetingEndDate = addHours(meetingStartDate, 1);
                const entryStartTime = subMinutes(meetingStartDate, 5);

                const canEnterMeeting =
                  meeting.url && !isAfter(now, meetingEndDate) && !isBefore(now, entryStartTime);

                return (
                  <div className="rounded-xl border-2 border-white/10 bg-card p-6" key={meeting.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={meeting.project?.logo ?? ''}
                          alt="Company Logo"
                          width={72}
                          height={72}
                          className="h-12 w-12 cursor-pointer rounded-md object-cover"
                          onClick={() => router.push(`/projects/${meeting.project?.name}`)}
                        />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-white">
                            {meeting.project?.name ?? ''}
                          </p>
                          <p className="text-sm text-white/50">
                            {meeting.project?.state?.name ?? ''},{' '}
                            {meeting.project?.country?.name ?? ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-3">
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="h-4 w-4" />
                          <p className="text-sm text-white/50">
                            {format(meeting.startDate, 'EEE, MMMM d')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <ClockIcon className="h-4 w-4" />
                          <p className="text-sm text-white/50">
                            <span className="text-white">
                              {new Date(meeting.startDate).toLocaleString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-white/50"> - </span>
                            <span className="text-white">
                              {new Date(meeting.endDate).toLocaleString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <hr className="my-4 border-white/10" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        {meeting.investors.map(investor => (
                          <TooltipProvider key={investor.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Image
                                  src={investor.user.imageUrl ?? ''}
                                  alt="Investor Avatar"
                                  width={24}
                                  height={24}
                                  className="rounded-full object-cover"
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {investor.firstName} {investor.lastName}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="h-8"
                          onClick={() => handleCancelClick(meeting.id)}
                          disabled={isCancellingMeeting}
                        >
                          Cancel Meeting
                        </Button>
                        <Button
                          disabled={!canEnterMeeting}
                          className="h-8"
                          onClick={() => window.open(meeting.url ?? '', '_blank')}
                        >
                          Enter Meeting
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 pt-8">
                <p className="text-center text-sm text-white/50">
                  No meetings scheduled for this date.
                  <br />
                  Need to schedule one? Find a project first.
                </p>
                {isInvestor && (
                  <Link href="/projects">
                    <Button variant="secondary">Find Projects</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
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
