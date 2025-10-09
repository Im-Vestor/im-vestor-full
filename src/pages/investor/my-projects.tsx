import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Header } from '~/components/header';
import { api } from '~/utils/api';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Input } from '~/components/ui/input';
import {
  Building2,
  Heart,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ExternalLink,
  MessageSquare,
  Clock,
  Edit3,
  Save,
  X,
  Search
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const NEGOTIATION_STAGE_LABELS = {
  PITCH: 'Pitch',
  NEGOTIATION: 'Negotiation',
  DETAILS: 'Details',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

const NEGOTIATION_STAGE_COLORS = {
  PITCH: 'bg-blue-100 text-blue-800',
  NEGOTIATION: 'bg-yellow-100 text-yellow-800',
  DETAILS: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function MyProjects() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { data: myProjects, isLoading } = api.investor.getMyProjects.useQuery(
    undefined,
    { enabled: isLoaded && isSignedIn && user?.publicMetadata.userType === 'INVESTOR' }
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void router.push('/login');
      return;
    }

    // Check if user is an investor
    if (isLoaded && isSignedIn && user?.publicMetadata.userType !== 'INVESTOR') {
      void router.push('/404');
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Don't render anything if user is not an investor
  if (isLoaded && isSignedIn && user?.publicMetadata.userType !== 'INVESTOR') {
    return null;
  }

  if (!isLoaded || isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
        <Header />
        <div className="mt-12">
          <div className="flex flex-col rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
            <div className="animate-pulse">
              <div className="h-8 w-64 bg-white/10 rounded mb-2"></div>
              <div className="h-4 w-96 bg-white/10 rounded mb-8"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl border-2 border-white/10 bg-card p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                      <div className="h-[72px] w-[72px] bg-white/10 rounded-lg flex-shrink-0"></div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="h-6 w-3/5 bg-white/10 rounded"></div>
                        <div className="h-4 w-2/5 bg-white/10 rounded"></div>
                        <div className="h-4 w-full bg-white/10 rounded mt-1"></div>
                        <div className="h-4 w-4/5 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const ProjectCard = ({ project, projectType, negotiationStage = null, meetings = [] }: {
    project: any;
    projectType: 'negotiation' | 'favorite' | 'invested';
    negotiationStage?: string | null;
    meetings?: any[];
  }) => {
    const projectId = project.id;
    const isEditingNotes = editingNotes === projectId;
    const currentNotes = notes[projectId] || '';

    const handleSaveNotes = () => {
      setNotes(prev => ({ ...prev, [projectId]: currentNotes }));
      setEditingNotes(null);
    };

    const handleCancelNotes = () => {
      setEditingNotes(null);
    };

    const getProjectTypeInfo = () => {
      switch (projectType) {
        case 'negotiation':
          return {
            label: 'Negotiation',
            icon: <MessageSquare className="h-4 w-4" />,
            color: 'bg-blue-100 text-blue-800',
            stage: negotiationStage
          };
        case 'favorite':
          return {
            label: 'Favorite',
            icon: <Heart className="h-4 w-4" />,
            color: 'bg-pink-100 text-pink-800',
            stage: null
          };
        case 'invested':
          return {
            label: 'Invested',
            icon: <TrendingUp className="h-4 w-4" />,
            color: 'bg-green-100 text-green-800',
            stage: null
          };
        default:
          return {
            label: 'Project',
            icon: <Building2 className="h-4 w-4" />,
            color: 'bg-gray-100 text-gray-800',
            stage: null
          };
      }
    };

    const typeInfo = getProjectTypeInfo();

    return (
      <Card className="rounded-xl border-2 bg-card border-white/10 hover:border-white/20 transition-all">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            {project.logo ? (
              <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white/10">
                <Image
                  src={project.logo}
                  alt={`${project.name} Logo`}
                  width={72}
                  height={72}
                  className="h-full w-full rounded-md object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-2 ring-white/10">
                <Building2 className="size-8 text-neutral-500" />
              </div>
            )}

            <div className="flex flex-1 flex-col gap-4">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link href={`/companies/${project.id}`}>
                      <h3 className="text-xl font-semibold tracking-tight hover:text-white/90 transition-colors cursor-pointer">
                        {project.name}
                      </h3>
                    </Link>
                    <Badge className={`text-xs ${typeInfo.color}`}>
                      {typeInfo.icon}
                      <span className="ml-1">{typeInfo.label}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-white/70">{project.likesCount}</span>
                    <Heart className={`size-4 ${project.likesCount > 0 ? 'fill-yellow-500 text-yellow-500' : 'fill-transparent'}`} />
                  </div>
                </div>

                {project.Entrepreneur && (
                  <span className="text-sm text-white/70">
                    {project.Entrepreneur.firstName} {project.Entrepreneur.lastName}
                  </span>
                )}

                <p className="text-sm text-white/60 line-clamp-2">
                  {project.quickSolution || project.about || 'No description available'}
                </p>
              </div>

              {/* Project Information */}
              <div className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:text-sm">
                {project.stage && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{project.stage.replace('_', ' ')}</span>
                  </div>
                )}

                {project.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{project.country.name}</span>
                  </div>
                )}

                {project.investmentGoal && (
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                    <DollarSign className="h-3 w-3" />
                    <span className="truncate text-xs text-white/70">
                      {project.currency === 'USD' ? '$' : project.currency === 'EUR' ? '€' : 'R$'}{' '}
                      {project.investmentGoal.toLocaleString()}
                    </span>
                  </div>
                )}

                {project.sector && (
                  <div className="flex items-center rounded-full bg-[#323645] px-3 py-1.5">
                    <span className="truncate text-xs font-medium text-white/70">
                      {project.sector.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Negotiation Stage */}
              {negotiationStage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/70">Negotiation Stage:</span>
                  <Badge className={`text-xs ${NEGOTIATION_STAGE_COLORS[negotiationStage as keyof typeof NEGOTIATION_STAGE_COLORS]}`}>
                    {NEGOTIATION_STAGE_LABELS[negotiationStage as keyof typeof NEGOTIATION_STAGE_LABELS]}
                  </Badge>
                </div>
              )}

              {/* Meetings History */}
              {meetings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-sm text-white/70">Recent Meetings:</span>
                  </div>
                  <div className="space-y-1">
                    {meetings.slice(0, 3).map((meeting) => (
                      <div key={meeting.id} className="flex items-center gap-2 text-xs text-white/60">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(meeting.startDate)}</span>
                      </div>
                    ))}
                    {meetings.length > 3 && (
                      <div className="text-xs text-white/50">
                        +{meetings.length - 3} more meetings
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Personal Notes:</span>
                  {!isEditingNotes && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(projectId)}
                      className="h-6 w-6 p-0 text-white/70 hover:text-white"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {isEditingNotes ? (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      value={currentNotes}
                      onChange={(e) => setNotes(prev => ({ ...prev, [projectId]: e.target.value }))}
                      placeholder="Add your personal notes about this project..."
                      className="min-h-[60px] text-sm bg-white/5 border-white/10 text-white placeholder:text-white/50"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelNotes}
                        className="h-7 px-3 text-xs text-white/70 hover:text-white"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[60px] p-3 rounded-lg bg-white/5 border border-white/10">
                    {currentNotes ? (
                      <p className="text-sm text-white/80 whitespace-pre-wrap">{currentNotes}</p>
                    ) : (
                      <p className="text-sm text-white/50 italic">No notes yet. Click edit to add your thoughts about this project.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Combine all projects into a single array with type information
  const allProjects = [
    ...(myProjects?.negotiations.map(negotiation => ({
      ...negotiation.project,
      projectType: 'negotiation' as const,
      negotiationStage: negotiation.stage,
      meetings: negotiation.meetings || []
    })) || []),
    ...(myProjects?.favoriteProjects.map(project => ({
      ...project,
      projectType: 'favorite' as const,
      negotiationStage: null,
      meetings: []
    })) || []),
    ...(myProjects?.investedProjects.map(project => ({
      ...project,
      projectType: 'invested' as const,
      negotiationStage: null,
      meetings: []
    })) || [])
  ];

  // Filter projects based on search query
  const filteredProjects = allProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.Entrepreneur &&
      `${project.Entrepreneur.firstName} ${project.Entrepreneur.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const totalProjects = allProjects.length;
  const filteredCount = filteredProjects.length;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="flex flex-col rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Projects</h1>
            <p className="text-muted-foreground">
              Manage your project investments, negotiations, and favorites
            </p>
            <div className="mt-4 flex gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>Negotiations: {myProjects?.negotiations.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>Favorites: {myProjects?.favoriteProjects.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Invested: {myProjects?.investedProjects.length || 0}</span>
              </div>
            </div>

            {/* Search Filter */}
            <div className="mt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                <Input
                  type="text"
                  placeholder="Search projects by name or entrepreneur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/20"
                />
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-white/60">
                  Showing {filteredCount} of {totalProjects} projects
                </p>
              )}
            </div>
          </div>

          {totalProjects === 0 ? (
            <div className="rounded-xl border-2 border-white/10 bg-card p-12">
              <div className="flex flex-col items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You don't have any projects in negotiations, favorites, or investments yet.
                </p>
                <Link href="/projects">
                  <Button className="bg-white/10 hover:bg-white/20 border-2 border-white/10">
                    Browse Projects
                  </Button>
                </Link>
              </div>
            </div>
          ) : filteredCount === 0 && searchQuery ? (
            <div className="rounded-xl border-2 border-white/10 bg-card p-12">
              <div className="flex flex-col items-center justify-center">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  No projects match your search for "{searchQuery}". Try a different search term.
                </p>
                <Button
                  onClick={() => setSearchQuery('')}
                  className="bg-white/10 hover:bg-white/20 border-2 border-white/10"
                >
                  Clear Search
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={`${project.projectType}-${project.id}`}
                  project={project}
                  projectType={project.projectType}
                  negotiationStage={project.negotiationStage}
                  meetings={project.meetings}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

