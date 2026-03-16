import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { Header } from '~/components/header';
import { UserAvatar } from '~/components/UserAvatar';
import { Button } from '~/components/ui/button';
import { useOnlineStatuses } from '~/hooks/use-presence';
import type { ConnectionResponse } from '~/server/api/routers/connection';
import { api } from '~/utils/api';

export default function Connections() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const { data, isLoading } = api.connection.getMyConnections.useQuery({
    page,
  });

  const connectionUserIds = useMemo(
    () => (data?.connections ?? []).map(c => c.user.id).filter(Boolean),
    [data?.connections],
  );
  const onlineStatuses = useOnlineStatuses(connectionUserIds);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-lg border border-white/10 bg-card p-6 md:p-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              type="button"
              className="mb-4 flex items-center gap-2 hover:opacity-75"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <h1 className="text-3xl font-semibold">Connections</h1>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {data?.connections && data.connections.length > 0 ? (
            data.connections.map(connection => (
              <ConnectionCard
                key={connection.connection.id}
                connection={connection as ConnectionResponse}
                isOnline={!!onlineStatuses[connection.user.id]}
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
      </div>
    </main>
  );
}

function ConnectionCard({ connection, isOnline }: { connection: ConnectionResponse; isOnline: boolean }) {
  const user = connection.user;
  const userType = user.userType;
  const firstName =
    user.entrepreneur?.firstName ?? user.investor?.firstName ?? user.partner?.firstName ?? '';
  const lastName =
    user.entrepreneur?.lastName ?? user.investor?.lastName ?? user.partner?.lastName ?? '';

  const userId = user.entrepreneur?.id || user.investor?.id;
  return (
    <Link href={`/${userType.toLowerCase()}/${userId}`}>
      <div
        key={connection.connection.id}
        className="rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20"
      >
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          <UserAvatar
            imageUrl={user.imageUrl}
            alt={`${user.email} Photo`}
            size={72}
            isOnline={isOnline}
          />

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
                  Connected since &nbsp;
                  {new Date(connection.connection.createdAt).toISOString().split('T')[0]}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
