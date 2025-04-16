import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-4 border-b border-white/10">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="flex items-center gap-4">
        <button className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
