import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

// Admin Page Header Component
interface AdminPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconLabel: string;
}

export function AdminPageHeader({ title, description, icon: Icon, iconLabel }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-primary">
          {title}
        </h1>
        <p className="text-ui-text/70 text-lg max-w-2xl">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 text-ui-text/60">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{iconLabel}</span>
      </div>
    </div>
  );
}

// Admin Stats Card Component
interface AdminStatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  gradient: string;
  iconColor: string;
}

export function AdminStatsCard({ title, value, subtitle, icon: Icon, gradient, iconColor }: AdminStatsCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-300 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-ui-text/80 group-hover:text-ui-text transition-colors">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <p className="text-xs text-ui-text/60 mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

// Admin Content Card Component
interface AdminContentCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function AdminContentCard({ title, description, icon: Icon, children, className = "" }: AdminContentCardProps) {
  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden ${className}`}>
      {(title || description) && (
        <CardHeader>
          <CardTitle className={Icon ? "flex items-center gap-2 text-primary" : "text-primary"}>
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-ui-text/70">
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={!title && !description ? "p-0" : ""}>
        {children}
      </CardContent>
    </Card>
  );
}

// Admin Section Wrapper Component
interface AdminSectionProps {
  children: ReactNode;
  className?: string;
}

export function AdminSection({ children, className = "" }: AdminSectionProps) {
  return (
    <div className={`space-y-8 ${className}`}>
      {children}
    </div>
  );
}

// Admin Stats Grid Component
interface AdminStatsGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
}

export function AdminStatsGrid({ children, columns = 4 }: AdminStatsGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 md:gap-6`}>
      {children}
    </div>
  );
}

// Common gradient and color presets
export const adminGradients = {
  blue: "from-blue-500/20 to-cyan-500/20",
  green: "from-emerald-500/20 to-teal-500/20",
  purple: "from-purple-500/20 to-pink-500/20",
  orange: "from-orange-500/20 to-red-500/20",
  amber: "from-amber-500/20 to-orange-500/20",
  indigo: "from-indigo-500/20 to-purple-500/20",
  pink: "from-pink-500/20 to-rose-500/20",
  cyan: "from-cyan-500/20 to-blue-500/20",
} as const;

export const adminIconColors = {
  blue: "text-blue-400",
  green: "text-emerald-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
  indigo: "text-indigo-400",
  pink: "text-pink-400",
  cyan: "text-cyan-400",
} as const;
