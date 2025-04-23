export function Header({ title }: { title: string }) {
  return (
    <header className="h-16 flex items-center justify-between pr-14 pl-6 border-b border-white/10">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-4" />
    </header>
  );
}
