import AdminLayout from '../index';
import { api } from '~/utils/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { useState } from 'react';
import { Skeleton } from "~/components/ui/skeleton";
import { Input } from "~/components/ui/input";
import { Search, Eye, Bell, Activity, TrendingUp, Users, FileText, Calendar, MessageSquare, BarChart3, Filter } from "lucide-react";
import { useDebounce } from "~/hooks/use-debounce";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import type { ProjectViewWithRelations, NotificationLog, PlatformActivitySummary } from '~/types/admin';

function ActivitySummary({ days = 30 }: { days?: number }) {
  const { data: summary, isLoading } = api.admin.getPlatformActivitySummary.useQuery({ days });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/10">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const statCards = [
    {
      title: "Visualizações",
      value: summary.projectViewsCount,
      icon: Eye,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Novos Projetos",
      value: summary.newProjectsCount,
      icon: FileText,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Reuniões",
      value: summary.meetingsCount,
      icon: Calendar,
      gradient: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Tickets Suporte",
      value: summary.supportTicketsCount,
      icon: MessageSquare,
      gradient: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-white/20 transition-all duration-300 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-ui-text/80 group-hover:text-ui-text transition-colors">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <IconComponent className={`h-4 w-4 ${stat.iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary group-hover:scale-105 transition-transform">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-ui-text/60 mt-1">
                  Últimos {days} dias
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProjectViewsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = api.admin.getProjectViews.useQuery<{
    items: ProjectViewWithRelations[];
    total: number;
    pages: number;
  }>({
    page,
    perPage: 10,
    search: debouncedSearch,
  });

  if (isLoading) {
    return <TableSkeleton columns={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Visualizações de Projetos</h2>
          <p className="text-sm text-ui-text/60 mt-1">
            Acompanhe quais investidores visualizaram quais projetos
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ui-text/40" />
          <Input
            placeholder="Buscar projetos ou investidores..."
            className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-ui-text/80 font-medium">Data</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Projeto</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Empreendedor</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Investidor</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Email do Investidor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((view) => (
                <TableRow key={view.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-ui-text/90">
                    {format(new Date(view.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {view.project.name}
                  </TableCell>
                  <TableCell className="text-ui-text/90">
                    {view.project.Entrepreneur
                      ? `${view.project.Entrepreneur.firstName} ${view.project.Entrepreneur.lastName}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-ui-text/90">
                    {view.investor
                      ? `${view.investor.firstName} ${view.investor.lastName}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-ui-text/70 text-sm">
                    {view.investor?.user.email ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-ui-text/60">
          Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, data?.total ?? 0)} de {data?.total ?? 0} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
          >
            Anterior
          </Button>
          <div className="text-sm text-ui-text/80 px-3 py-1 bg-white/5 rounded-md">
            Página {page} de {data?.pages ?? 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p < (data?.pages ?? 0) ? p + 1 : p))}
            disabled={page >= (data?.pages ?? 0)}
            className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationLogsList() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data, isLoading } = api.admin.getNotificationLogs.useQuery<{
    items: NotificationLog[];
    total: number;
    pages: number;
  }>({
    page,
    perPage: 20,
    type: type === 'all' ? undefined : type,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PROJECT_VIEW: 'Visualização de Projeto',
      MEETING_CREATED: 'Reunião Criada',
      MEETING_CANCELLED: 'Reunião Cancelada',
      NEGOTIATION_CREATED: 'Negociação Criada',
      NEGOTIATION_CANCELLED: 'Negociação Cancelada',
      NEGOTIATION_GO_TO_NEXT_STAGE: 'Próximo Estágio',
      POKE: 'Poke',
      SUPPORT_TICKET_REPLY: 'Resposta de Suporte',
      SUPPORT_TICKET_STATUS_UPDATED: 'Status Atualizado',
      SUPPORT_TICKET_CREATED: 'Ticket Criado',
      SUPPORT_TICKET_RECEIVED: 'Ticket Recebido',
      TOTAL_NOTIFICATIONS: 'Total de Notificações',
    };
    return labels[type] || type;
  };

  const getNotificationTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PROJECT_VIEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      MEETING_CREATED: 'bg-green-500/20 text-green-400 border-green-500/30',
      MEETING_CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      NEGOTIATION_CREATED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      NEGOTIATION_CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      NEGOTIATION_GO_TO_NEXT_STAGE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      POKE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      SUPPORT_TICKET_REPLY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      SUPPORT_TICKET_STATUS_UPDATED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      SUPPORT_TICKET_CREATED: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      SUPPORT_TICKET_RECEIVED: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  if (isLoading) {
    return <TableSkeleton columns={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Logs de Notificações</h2>
          <p className="text-sm text-ui-text/60 mt-1">
            Histórico completo de notificações da plataforma
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 focus:border-primary/50">
              <Filter className="h-4 w-4 mr-2 text-ui-text/40" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="bg-card/90 backdrop-blur-sm border-white/10">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="PROJECT_VIEW">Visualização de Projeto</SelectItem>
              <SelectItem value="MEETING_CREATED">Reunião Criada</SelectItem>
              <SelectItem value="MEETING_CANCELLED">Reunião Cancelada</SelectItem>
              <SelectItem value="NEGOTIATION_CREATED">Negociação Criada</SelectItem>
              <SelectItem value="NEGOTIATION_CANCELLED">Negociação Cancelada</SelectItem>
              <SelectItem value="NEGOTIATION_GO_TO_NEXT_STAGE">Próximo Estágio</SelectItem>
              <SelectItem value="POKE">Poke</SelectItem>
              <SelectItem value="SUPPORT_TICKET_REPLY">Resposta de Suporte</SelectItem>
              <SelectItem value="SUPPORT_TICKET_STATUS_UPDATED">Status Atualizado</SelectItem>
              <SelectItem value="SUPPORT_TICKET_CREATED">Ticket Criado</SelectItem>
              <SelectItem value="SUPPORT_TICKET_RECEIVED">Ticket Recebido</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Data inicial"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-40 bg-white/5 border-white/10 focus:border-primary/50"
          />
          <Input
            type="date"
            placeholder="Data final"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full sm:w-40 bg-white/5 border-white/10 focus:border-primary/50"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-ui-text/80 font-medium">Data</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Tipo</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Usuário</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Email</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Tipo de Usuário</TableHead>
                <TableHead className="text-ui-text/80 font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((notification) => (
                <TableRow key={notification.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="text-ui-text/90 text-sm">
                    {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getNotificationTypeColor(notification.type)}`}>
                      {getNotificationTypeLabel(notification.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-primary">
                    {notification.user.email}
                  </TableCell>
                  <TableCell className="text-ui-text/70 text-sm">
                    {notification.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/10 text-ui-text/80 border-white/20">
                      {notification.user.userType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={notification.read ? "default" : "destructive"}
                      className={notification.read
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {notification.read ? "Lida" : "Não lida"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-ui-text/60">
          Mostrando {((page - 1) * 20) + 1} a {Math.min(page * 20, data?.total ?? 0)} de {data?.total ?? 0} resultados
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
          >
            Anterior
          </Button>
          <div className="text-sm text-ui-text/80 px-3 py-1 bg-white/5 rounded-md">
            Página {page} de {data?.pages ?? 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => (p < (data?.pages ?? 0) ? p + 1 : p))}
            disabled={page >= (data?.pages ?? 0)}
            className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/10">
      <div className="p-6 space-y-4">
        <div className="flex items-center space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-[100px] bg-white/10" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-[100px] bg-white/10" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ProjectViewsPage() {
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              Dashboard de Atividade
            </h1>
            <p className="text-ui-text/70 text-lg max-w-2xl">
              Monitoramento completo da movimentação da plataforma com insights detalhados sobre visualizações, notificações e atividades dos usuários.
            </p>
          </div>
          <div className="flex items-center gap-2 text-ui-text/60">
            <Activity className="h-5 w-5" />
            <span className="text-sm">Painel Administrativo</span>
          </div>
        </div>

        {/* Summary Cards - Always Visible */}
        <ActivitySummary />

        {/* Tables Section with Simple Tab Switch */}
        <Card className="bg-card/30 backdrop-blur-sm border-white/10">
          <Tabs defaultValue="project-views" className="w-full">
            <div className="border-b border-white/10">
              <TabsList className="grid w-full grid-cols-2 bg-transparent border-0 p-0 h-auto">
                <TabsTrigger
                  value="project-views"
                  className="flex items-center justify-center gap-2 py-4 px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                >
                  <Eye className="h-4 w-4" />
                  <span>Visualizações de Projetos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="flex items-center justify-center gap-2 py-4 px-6 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all duration-200"
                >
                  <Bell className="h-4 w-4" />
                  <span>Logs de Notificações</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="project-views" className="space-y-6 mt-0">
                <ProjectViewsList />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 mt-0">
                <NotificationLogsList />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}