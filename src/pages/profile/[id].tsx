import { type GetServerSideProps } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { useRouter } from 'next/router';
import { Header } from '~/components/header';
import { EntrepreneurProfile } from '~/components/profile/entrepreneur/entrepreneur-profile';
import { IncubatorProfile } from '~/components/profile/incubator/incubator-profile';
import { InvestorProfile } from '~/components/profile/investor/investor-profile';
import { PartnerProfile } from '~/components/profile/partner/partner-profile';
import { VcGroupProfile } from '~/components/profile/vc-group/vc-group-profile';
import type { UserType } from '@prisma/client';
import { api } from '~/utils/api';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface ProfilePageProps {
  targetUserId: string;
  isAdmin: boolean;
}

export default function ProfilePage({ targetUserId, isAdmin }: ProfilePageProps) {
  const router = useRouter();

  // Get the target user's data
  const { data: targetUserData, isLoading } = api.user.getUserById.useQuery(
    { userId: targetUserId },
    { enabled: !!targetUserId }
  );

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  if (!targetUserData) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-16 text-center">
          <h1 className="text-2xl font-bold text-red-400">User not found</h1>
          <p className="mt-2 text-gray-400">
            The profile you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.back()} className="mt-4" variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      {isAdmin && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 pr-6">
          <div className="text-sm text-blue-400">👨‍💼 Admin View</div>
        </div>
      )}
      <div className="mt-12">
        {targetUserData.userType === 'ENTREPRENEUR' ? (
          <EntrepreneurProfile userId={targetUserId} />
        ) : targetUserData.userType === 'INVESTOR' ? (
          <InvestorProfile userId={targetUserId} />
        ) : targetUserData.userType === 'PARTNER' ? (
          <PartnerProfile userId={targetUserId} />
        ) : targetUserData.userType === 'INCUBATOR' ? (
          <IncubatorProfile userId={targetUserId} />
        ) : targetUserData.userType === 'VC_GROUP' ? (
          <VcGroupProfile userId={targetUserId} />
        ) : (
          <div className="text-center text-red-400">
            <h2 className="text-xl font-bold">Unknown user type</h2>
            <p>Cannot display profile for user type: {targetUserData.userType}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const { userId } = getAuth(ctx.req);
  const { id: targetUserId } = ctx.query;

  if (!userId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  if (!targetUserId || typeof targetUserId !== 'string') {
    return {
      notFound: true,
    };
  }

  try {
    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    const userMetadata = currentUser.publicMetadata as {
      userType: UserType;
      userIsAdmin?: boolean;
    };

    // Check if current user is admin or viewing their own profile
    const isAdmin = userMetadata?.userIsAdmin === true;
    const isOwnProfile = userId === targetUserId;

    if (!isAdmin && !isOwnProfile) {
      return {
        redirect: {
          destination: '/404',
          permanent: false,
        },
      };
    }

    return {
      props: {
        targetUserId,
        isAdmin,
      },
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return {
      redirect: {
        destination: '/500',
        permanent: false,
      },
    };
  }
};
