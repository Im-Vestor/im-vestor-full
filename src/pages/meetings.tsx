import { UTCDate } from '@date-fns/utc';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { api } from '~/utils/api';
export default function Meetings() {
  const utils = api.useUtils();
  const [selectedDate, setSelectedDate] = useState<Date>(new UTCDate());
  const { data: meetings, isLoading } = api.meeting.getMeetingsByDate.useQuery(
    { date: selectedDate },
    { enabled: !!selectedDate }
  );

  const { mutateAsync: cancelMeeting, isPending: isCancellingMeeting } =
    api.meeting.cancelMeeting.useMutation({
      onSuccess: async () => {
        toast.success('Meeting cancelled successfully');
        await utils.meeting.getMeetingsByDate.invalidate();
      },
      onError: error => {
        toast.error(error.message);
      },
    });

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 flex gap-6">
        <div className="w-2/5 h-fit rounded-xl border-2 border-white/10 bg-card p-12">
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
              onSelect={date => setSelectedDate(date ?? new Date())}
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
                cell: 'flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
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
        <div className="w-3/5 rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="mt-4 flex flex-col gap-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : meetings && meetings.length > 0 ? (
              meetings?.map(meeting => (
                <div className="rounded-xl border-2 border-white/10 bg-card p-6" key={meeting.id}>
                  <p className="text-sm text-white/50">
                    Starts at:{' '}
                    <span className="text-white">
                      {new Date(meeting.startDate).toLocaleString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <Image
                      src={meeting.project?.logo ?? ''}
                      alt="Company Logo"
                      width={72}
                      height={72}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-white">
                        {meeting.project?.name ?? ''}
                      </p>
                      <p className="text-sm text-white/50">
                        {meeting.project?.state?.name ?? ''}, {meeting.project?.country?.name ?? ''}
                      </p>
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
                        onClick={() => cancelMeeting({ id: meeting.id })}
                        disabled={isCancellingMeeting}
                      >
                        Cancel Meeting
                      </Button>
                      <Link href={meeting.url ?? ''} target="_blank">
                        <Button disabled={!meeting.url || isCancellingMeeting} className="h-8">
                          Enter Meeting
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-white/50">No meetings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
