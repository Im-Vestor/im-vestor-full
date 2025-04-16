import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "~/components/admin/sidebar";
import { Header } from "~/components/admin/header";
import { useUser } from "@clerk/nextjs";

export default function Admin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      const isAdmin = user?.publicMetadata?.userType === 'ADMIN';
      if (!user || !isAdmin) {
        router.push('/');
      }
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-dark text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

