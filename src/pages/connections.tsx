import { ArrowLeft, Loader2, UserPlus, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { type ConnectionResponse } from '~/server/api/routers/connection';
import { api } from '~/utils/api';

export default function Connections() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isLoading } = api.connection.getMyConnections.useQuery({
    page,
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
        <button
          type="button"
          className="mb-4 flex items-center gap-2 hover:opacity-75 sm:mb-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mt-4 flex flex-col gap-4">
          {data?.connections && data.connections.length > 0 ? (
            data.connections.map(connection => (
              <ConnectionCard
                key={connection.connection.id}
                connection={connection as ConnectionResponse}
              />
            ))
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          ) : (
            <p className="my-12 text-center text-sm text-white/50">
              You don&apos;t have any connections yet.
            </p>
          )}
        </div>
        <div className="mt-8 flex items-center justify-end gap-2">
          <p className="text-sm text-white/50">
            {isLoading
              ? 'Loading connections...'
              : `Showing ${data?.connections?.length ?? 0} of ${data?.total ?? 0} connections`}
          </p>
          <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 0}>
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={(data?.total ?? 0) - (page + 1) * 10 <= 0}
          >
            Next
          </Button>
        </div>
      </div>
    </main>
  );
}

function ConnectionCard({ connection }: { connection: ConnectionResponse }) {
  const utils = api.useUtils();

  const user = connection.user;
  const userType = user.userType;
  const firstName =
    user.entrepreneur?.firstName ?? user.investor?.firstName ?? user.partner?.firstName ?? '';
  const lastName =
    user.entrepreneur?.lastName ?? user.investor?.lastName ?? user.partner?.lastName ?? '';

  const connectMutation = api.connection.connect.useMutation({
    onSuccess: data => {
      void utils.connection.getMyConnections.invalidate();
      toast.success(
        `${data.connected ? 'Connected with' : 'Disconnected from'} ${firstName} ${lastName}!`
      );
    },
    onError: () => {
      toast.error('Failed to update connection status.');
    },
  });

  return (
    <Link href={`/${userType.toLowerCase()}/${user.id}`}>
      <div
        key={connection.connection.id}
        className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20"
      >
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {user.imageUrl ? (
            <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src={user.imageUrl}
                alt={`${user.email} Photo`}
                width={72}
                height={72}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
              <UserRound className="size-8 text-neutral-500" />
            </div>
          )}

          <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
            <div className="flex flex-col">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">
                    {firstName} {lastName}
                  </h3>
                  {connection.mutual && (
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs">Mutual</span>
                  )}
                </div>
                <p className="text-white/70">
                  {connection.type === 'following' ? 'You follow them' : 'Follow you'} since{' '}
                  {new Date(connection.connection.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <Button
                onClick={e => {
                  e.preventDefault();
                  connectMutation.mutate({ userId: user.id });
                }}
                className="gap-2 self-start md:self-auto"
                size="sm"
                variant="outline"
              >
                <UserPlus className="size-4" strokeWidth={2.5} />
                <span>{connection.type === 'following' ? 'Unfollow' : 'Follow'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
