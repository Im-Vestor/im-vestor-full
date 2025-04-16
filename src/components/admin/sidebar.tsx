import Image from 'next/image';
import {
  LayoutDashboard,
  DollarSign,
  LineChart,
  HelpCircle,
  Users,
  Building2,
  Bell,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/10">
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Image
          src="/images/logo.png"
          alt="Im-Vestor Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <h1 className="text-xl font-semibold text-foreground">Im-Vestor</h1>
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span>Dashboard</span>
            </a>
          </li>
          <li>
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
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Suporte</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <Users className="h-5 w-5" />
              <span>Utilizadores</span>
            </a>
          </li>
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
          </li>
        </ul>
      </nav>
    </aside>
  );
}
