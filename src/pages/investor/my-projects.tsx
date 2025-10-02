import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Header } from '~/components/header';
import { api } from '~/utils/api';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import {
  Building2,
  Heart,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ExternalLink
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
  const [activeTab, setActiveTab] = useState('negotiations');

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
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-card rounded border-2 border-white/10 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-card rounded-xl border-2 border-white/10"></div>
              ))}
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

  const ProjectCard = ({ project, showStage = false, stage = null }: {
    project: any;
    showStage?: boolean;
    stage?: string | null;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {project.logo ? (
              <Image
                src={project.logo}
                alt={project.name}
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{project.name}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>
                  {project.Entrepreneur?.firstName} {project.Entrepreneur?.lastName}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm text-muted-foreground">{project.likesCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.quickSolution || project.about}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {project.sector?.name}
            </Badge>
            {project.country && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                {project.country.name}
              </Badge>
            )}
            {project.stage && (
              <Badge variant="outline" className="text-xs">
                {project.stage.replace('_', ' ')}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  {formatCurrency(project.investmentGoal, project.currency)}
                </span>
              </div>
              {project.annualRevenue && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>
                    {formatCurrency(project.annualRevenue, project.currency)}/year
                  </span>
                </div>
              )}
            </div>
            {showStage && stage && (
              <Badge
                className={`text-xs ${NEGOTIATION_STAGE_COLORS[stage as keyof typeof NEGOTIATION_STAGE_COLORS]}`}
              >
                {NEGOTIATION_STAGE_LABELS[stage as keyof typeof NEGOTIATION_STAGE_LABELS]}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
            <Link href={`/companies/${project.id}`}>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3 h-3 mr-1" />
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Projects</h1>
          <p className="text-muted-foreground">
            Manage your project investments, negotiations, and favorites
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="negotiations">
              Negotiations ({myProjects?.negotiations.length || 0})
            </TabsTrigger>
            <TabsTrigger value="favorites">
              Favorites ({myProjects?.favoriteProjects.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invested">
              Invested ({myProjects?.investedProjects.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="negotiations" className="mt-6">
            <div className="space-y-4">
              {myProjects?.negotiations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Negotiations</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You don't have any active negotiations with projects yet.
                    </p>
                    <Link href="/projects">
                      <Button>Browse Projects</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myProjects?.negotiations.map((negotiation) => (
                  <ProjectCard
                    key={negotiation.id}
                    project={negotiation.project}
                    showStage={true}
                    stage={negotiation.stage}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <div className="space-y-4">
              {myProjects?.favoriteProjects.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Heart className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Favorite Projects</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You haven't favorited any projects yet.
                    </p>
                    <Link href="/projects">
                      <Button>Browse Projects</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myProjects?.favoriteProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="invested" className="mt-6">
            <div className="space-y-4">
              {myProjects?.investedProjects.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Invested Projects</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      You haven't invested in any projects yet.
                    </p>
                    <Link href="/projects">
                      <Button>Browse Projects</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                myProjects?.investedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

