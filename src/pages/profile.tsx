import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Header } from '~/components/header';
import { EntrepreneurProfile } from '~/components/profile/entrepreneur-profile';
import { InvestorProfile } from '~/components/profile/investor-profile';
import { PartnerProfile } from '~/components/profile/partner-profile';

export default function Profile() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        {user?.publicMetadata.userType === 'ENTREPRENEUR' ? (
          <EntrepreneurProfile />
        ) : user?.publicMetadata.userType === 'INVESTOR' ? (
          <InvestorProfile />
        ) : user?.publicMetadata.userType === 'PARTNER' ? (
          <PartnerProfile />
        ) : user?.publicMetadata.userType === 'INCUBATOR' ? null : user?.publicMetadata.userType ===
          'VC_GROUP' ? null : null}
      </div>
    </main>
  );
}
