import { type GetServerSideProps } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { Sidebar } from '~/components/admin/sidebar';
import { SidebarProvider } from '~/contexts/SidebarContext';
import { UserType } from '@prisma/client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-dark text-text-primary">
      <SidebarProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto mx-64 my-20">{children}</main>
        </div>
      </SidebarProvider>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { userId } = getAuth(ctx.req);

  if (!userId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const userMetadata = user.publicMetadata as {
      userType: UserType;
      userIsAdmin?: boolean;
    };

    if (!userMetadata?.userIsAdmin) {
      return {
        redirect: {
          destination: '/404',
          permanent: false,
        },
      };
    }

    return { props: {} };
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