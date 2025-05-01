import { type GetServerSideProps } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { Sidebar } from '~/components/admin/sidebar';
import { SidebarProvider } from '~/contexts/SidebarContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-dark text-text-primary">
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
  const { userId, sessionClaims } = getAuth(ctx.req);

  if (!userId) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const isAdmin = (sessionClaims?.publicMetadata as { userIsAdmin?: boolean })?.userIsAdmin;

  if (!isAdmin) {
    return {
      redirect: {
        destination: '/404',
        permanent: false,
      },
    };
  }

  if (isAdmin) {
    return {
      redirect: {
        destination: '/admin/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };

};