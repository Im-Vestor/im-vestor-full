import { ArrowRight, Rocket, Sparkles, Zap } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { Skeleton } from '~/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';

export function RecommendationsPanel() {
  const { data: recommendations, isLoading: isLoadingRecommendations } = api.recommendations.getRecommendations.useQuery();

  // Show Hyper Train section only if there are hyper train projects
  const showHyperTrain = recommendations?.hyperTrainProjects && recommendations.hyperTrainProjects.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recommendations</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* Hyper Train Section - Always at the top if available */}
        {showHyperTrain && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-amber-500/10 p-2">
                <Rocket className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-amber-500">Hyper Train Projects</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingRecommendations ? (
                <>
                  <Skeleton className="h-[120px] w-full rounded-xl" />
                  <Skeleton className="h-[120px] w-full rounded-xl" />
                  <Skeleton className="h-[120px] w-full rounded-xl" />
                </>
              ) : (
                recommendations?.hyperTrainProjects?.map((project) => (
                  <Link key={project.id} href={`/companies/${project.id}`}>
                    <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative flex items-center gap-4">
                        <div className="relative">
                          <Image
                            src={project.logo ?? '/images/male-avatar.svg'}
                            alt={project.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                          <div className="absolute -right-1 -top-1 rounded-full bg-amber-500 p-1">
                            <Zap className="h-3 w-3 text-background" />
                          </div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{project.name}</h3>
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500">
                              {project.traction}% traction
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {project.Entrepreneur?.firstName} {project.Entrepreneur?.lastName}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {/* Regular Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-white">Recommended For You</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingRecommendations ? (
              <>
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
                <Skeleton className="h-[120px] w-full rounded-xl" />
              </>
            ) : (
              <>
                {recommendations?.recommendedProjects?.map((project) => (
                  <Link key={project.id} href={`/companies/${project.id}`}>
                    <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative flex items-center gap-4">
                        <Image
                          src={project.logo ?? '/images/male-avatar.svg'}
                          alt={project.name}
                          width={48}
                          height={48}
                          className="rounded-lg"
                        />
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium text-white">{project.name}</h3>
                          {/*                           <p className="text-sm text-muted-foreground">
                            {project.entrepreneur?.firstName} {project.entrepreneur?.lastName}
                          </p> */}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}

                {recommendations?.recommendedInvestors?.map((investor) => (
                  <Link key={investor.id} href={`/investor/${investor.id}`}>
                    <div className="group relative overflow-hidden rounded-xl bg-card/30 p-6 transition-all hover:bg-card/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="relative flex items-center gap-4">
                        <Image
                          src={investor.photo ?? '/images/male-avatar.svg'}
                          alt={`${investor.firstName} ${investor.lastName}`}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                        <div className="flex-1 space-y-1">
                          <h3 className="font-medium text-white">{investor.firstName} {investor.lastName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {investor.country?.name}, {investor.state?.name}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}