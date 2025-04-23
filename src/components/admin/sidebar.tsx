import { Calendar, HelpCircle, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Image
          src="/images/logo.png"
          alt="Im-Vestor Logo"
          width={100}
          height={100}
          className="h-8 w-10"
        />
        <h1 className="text-xl font-semibold text-foreground">Im-Vestor</h1>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          <li>
            <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md">
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </li>
          {/*           <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <DollarSign className="h-5 w-5" />
              <span>Transações</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <LineChart className="h-5 w-5" />
              <span>Análises</span>
            </a>
          </li> */}
          <li>
            <Link
              href="/admin/support"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Suporte</span>
            </Link>
          </li>
          <li>
            <Link
              href="/admin/meetings"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
              <span>Meetings</span>
            </Link>
          </li>
          {/*
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Building2 className="h-5 w-5" />
              <span>Projetos</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              <span>Avisos</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              <span>Sistema</span>
            </a>
          </li> */}
        </ul>
      </nav>
    </aside>
  );
}
