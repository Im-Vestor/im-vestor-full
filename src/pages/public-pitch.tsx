import { useUser } from '@clerk/nextjs';
import { addMinutes, format, isAfter, isBefore, subMinutes } from 'date-fns';
import { CalendarIcon, Loader2, Video, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/utils/api';

const DailyCall = dynamic(() => import('~/components/daily-call').then(mod => mod.DailyCall), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-full items-center justify-center rounded-xl bg-black/10">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  ),
});

export default function PublicPitch() {
  const { user } = useUser();
  const [activeCallUrl, setActiveCallUrl] = useState<string | null>(null);

  const { data: pitches, isLoading } = api.pitch.getScheduledPitches.useQuery();
  const { data: userData } = api.user.getUser.useQuery(undefined, {
    enabled: !!user,
  });

  const handleJoinSession = (url: string) => {
    setActiveCallUrl(url);
  };

  const handleLeaveSession = () => {
    setActiveCallUrl(null);
  };

  const isSessionActive = (date: Date) => {
    const now = new Date();
    // Active if within 15 mins before start and 60 mins after start (assuming 1h duration)
    const startWindow = subMinutes(date, 15);
    const endWindow = addMinutes(date, 60);
    return isAfter(now, startWindow) && isBefore(now, endWindow);
  };

  if (activeCallUrl) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
        <Header />
        <div className="mt-8">
          <Button variant="ghost" onClick={handleLeaveSession} className="mb-4">
            ← Back to Pitches
          </Button>
          <DailyCall url={activeCallUrl} onLeave={handleLeaveSession} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />

      <div className="mt-12">
        <div className="rounded-lg border border-white/10 bg-card p-6 md:p-12">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold">Public Pitch</h1>
              <p className="text-white/60">
                Discover the latest pitches from innovative entrepreneurs.
              </p>
            </div>

            {(userData?.availablePublicPitchTickets ?? 0) > 0 && (
              <Link href="/pitch-of-the-week/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Pitch
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : !pitches || pitches.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-white/10 p-12 text-center">
              <p className="text-white/60">No scheduled pitches found.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pitches.map(pitch => (
                <Card
                  key={pitch.id}
                  className="group flex flex-col overflow-hidden border-2 border-white/5 transition-all duration-500 hover:scale-[1.03] hover:border-white/20 hover:shadow-2xl hover:shadow-primary-solid/10"
                >
                  <div className="relative aspect-video w-full bg-muted">
                    {pitch.video ? (
                      <video
                        src={pitch.video}
                        className="h-full w-full object-cover"
                        controls
                        poster={pitch.image}
                      />
                    ) : (
                      <Image
                        src={pitch.image}
                        alt="Pitch teaser"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>

                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      {pitch.user?.imageUrl && (
                        <Image
                          src={pitch.user.imageUrl}
                          alt="User"
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-white/60">
                        {pitch.user?.entrepreneur?.firstName} {pitch.user?.entrepreneur?.lastName}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-1 text-white transition-colors duration-300 group-hover:text-primary">
                      {pitch.project?.name || 'Pitch of the Week'}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-white/60">
                      {pitch.hyperTrainItem?.name || 'Join us for a live pitch session.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-white/60">
                          <CalendarIcon className="h-4 w-4" />
                          Session 1
                        </span>
                        <span className={isSessionActive(pitch.date1) ? 'font-bold text-green-500' : 'text-white/80'}>
                          {format(pitch.date1, 'PP p')}
                        </span>
                      </div>
                      {isSessionActive(pitch.date1) && pitch.dailyRoomUrl1 && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleJoinSession(pitch.dailyRoomUrl1!)}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Join Live Session 1
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-white/60">
                          <CalendarIcon className="h-4 w-4" />
                          Session 2
                        </span>
                        <span className={isSessionActive(pitch.date2) ? 'font-bold text-green-500' : 'text-white/80'}>
                          {format(pitch.date2, 'PP p')}
                        </span>
                      </div>
                      {isSessionActive(pitch.date2) && pitch.dailyRoomUrl2 && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleJoinSession(pitch.dailyRoomUrl2!)}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Join Live Session 2
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
