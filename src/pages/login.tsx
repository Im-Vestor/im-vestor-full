import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { SignIn, useUser } from "@clerk/nextjs";

export default function LoginPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      const userType = user.publicMetadata?.userType;
      const redirectPath = userType === 'ADMIN' ? '/admin' : '/'; // Redirect to admin or home
      void router.push(redirectPath);
    }
  }, [user, isLoaded, router]);

  // Render loading state or SignIn component
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900"> {/* Updated background */}
      {!isLoaded ? (
        <p className="text-white">Loading...</p> // Simple loading indicator
      ) : (
        <SignIn path="/login" routing="path" signUpUrl="/sign-up" /> // Added sign-up URL
      )}
    </div>
  );
}
