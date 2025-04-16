import { type GetServerSideProps } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { Sidebar } from '~/components/admin/sidebar';
import { Header } from '~/components/admin/header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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

  return {
    props: {},
  };
};