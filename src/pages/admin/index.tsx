'use server';

import { redirect } from 'next/navigation';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Sidebar } from '~/components/admin/sidebar';
import { Header } from '~/components/admin/header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  const clerkUser = await currentUser();
  const isAdmin = clerkUser?.publicMetadata?.userIsAdmin;

  if (!isAdmin) {
    redirect('/404');
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