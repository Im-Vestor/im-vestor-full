import Link from 'next/link';
import { useRouter } from 'next/router';

type Tab = 'users' | 'companies' | 'partners';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  const getTabClass = (pathSuffix: Tab) => {
    const currentPath = `/admin/dashboard/${pathSuffix}`;
    // Check if the current route starts with the tab's path
    const isActive = router.pathname.startsWith(currentPath);

    return `py-2 px-4 cursor-pointer ${isActive
      ? 'border-b-2 border-blue-500 text-blue-500'
      : 'text-gray-500 hover:text-gray-700'
      }`;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Admin Management</h1>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link href="/admin/dashboard/users" className={getTabClass('users')}>
            Users
          </Link>
          <Link href="/admin/dashboard/companies" className={getTabClass('companies')}>
            Companies
          </Link>
          <Link href="/admin/dashboard/partners" className={getTabClass('partners')}>
            Partners
          </Link>
        </nav>
      </div>
      <main>{children}</main>
    </div>
  );
}