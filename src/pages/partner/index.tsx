import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import PartnerDashboard from '../../components/dashboard/partner';

export default function Dashboard() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  return <>{user?.publicMetadata.userType === 'PARTNER' && <PartnerDashboard />}</>;
}
