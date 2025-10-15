import { type Area, type Country, type Project, type State, ProjectStage, type UserType } from '@prisma/client';
import { useUser } from '@clerk/nextjs';
import { Building2, Heart, SearchIcon, Calendar, MapPin, CircleUserRound, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Skeleton } from '~/components/ui/skeleton';
import { PROJECT_STAGES } from '~/data/project-stages';
import { api } from '~/utils/api';

type RevenueRange = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

type InvestmentRange = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

// Define revenue and investment ranges
const REVENUE_RANGES: RevenueRange[] = [
  { id: '1', label: 'Less than $100k', min: 0, max: 99999 },
  { id: '2', label: '$100k - $500k', min: 100000, max: 500000 },
  { id: '3', label: '$500k - $1M', min: 500000, max: 1000000 },
  { id: '4', label: '$1M - $5M', min: 1000000, max: 5000000 },
  { id: '5', label: '$5M+', min: 5000000 },
];

const INVESTMENT_RANGES: InvestmentRange[] = [
  { id: '1', label: 'Less than $100k', min: 0, max: 99999 },
  { id: '2', label: '$100k - $500k', min: 100000, max: 500000 },
  { id: '3', label: '$500k - $1M', min: 500000, max: 1000000 },
  { id: '4', label: '$1M - $5M', min: 1000000, max: 5000000 },
  { id: '5', label: '$5M+', min: 5000000 },
];

const INITIAL_VISIBLE_AREAS = 5; // Define a constant for the initial count

export default function Companies() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const userType = user?.publicMetadata.userType as UserType;

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: areas, isLoading: isLoadingAreas } = api.area.getAll.useQuery();
  const [visibleAreasCount, setVisibleAreasCount] = useState(INITIAL_VISIBLE_AREAS);

  // Filter states
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [oneToFiveSlots, setOneToFiveSlots] = useState(false);
  const [favorites, setFavorites] = useState(false);
  const [selectedStages, setSelectedStages] = useState<ProjectStage[]>([]);
  const [revenueFilters, setRevenueFilters] = useState<{
    min?: number;
    max?: number;
  }>({});
  const [selectedInvestmentRanges, setSelectedInvestmentRanges] = useState<string[]>([]);
  const [onlyIncubatorProjects, setOnlyIncubatorProjects] = useState(false);

  // Redirect entrepreneurs away from this page
  useEffect(() => {
    if (isLoaded && userType === 'ENTREPRENEUR') {
      router.push('/entrepreneur/projects');
    }
  }, [isLoaded, userType, router]);

  // Don't render anything for entrepreneurs
  if (isLoaded && userType === 'ENTREPRENEUR') {
    return null;
  }

  // Calculate combined investment range from selected ranges
  const getInvestmentRange = () => {
    if (selectedInvestmentRanges.length === 0) return { min: undefined, max: undefined };

    const selectedRanges = INVESTMENT_RANGES.filter(range =>
      selectedInvestmentRanges.includes(range.id)
    );

    const mins = selectedRanges
      .map(range => range.min)
      .filter((min): min is number => min !== undefined);
    const maxs = selectedRanges
      .map(range => range.max)
      .filter((max): max is number => max !== undefined);

    return {
      min: mins.length > 0 ? Math.min(...mins) : undefined,
      max: maxs.length > 0 ? Math.max(...maxs) : undefined,
    };
  };

  const investmentRange = getInvestmentRange();

  // Prepare filter parameters for the API call
  const filterParams = {
    sectorId: selectedSectors,
    stage: selectedStages,
    oneToFiveSlots: oneToFiveSlots,
    onlyIncubatorProjects: onlyIncubatorProjects,
    minRevenue: revenueFilters.min,
    maxRevenue: revenueFilters.max,
    minInitialInvestment: investmentRange.min,
    maxInitialInvestment: investmentRange.max,
    searchQuery: searchQuery,
    page: page,
    favorites: favorites,
  };

  const { data: projects, isLoading: isLoadingProjects } =
    api.project.getAllWithFilters.useQuery(filterParams);

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectors([...selectedSectors, sectorId]);
    } else {
      setSelectedSectors(selectedSectors.filter(id => id !== sectorId));
    }
  };

  const handleStageChange = (stage: ProjectStage, checked: boolean) => {
    if (checked) {
      setSelectedStages([...selectedStages, stage]);
    } else {
      setSelectedStages(selectedStages.filter(s => s !== stage));
    }
  };

  const handleRevenueFilterChange = (id: string, checked: boolean) => {
    if (!checked) {
      setRevenueFilters({});
      return;
    }

    const range = REVENUE_RANGES.find(r => r.id === id);
    if (range) {
      setRevenueFilters({ min: range.min, max: range.max });
    }
  };

  const handleInvestmentFilterChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedInvestmentRanges([...selectedInvestmentRanges, id]);
    } else {
      setSelectedInvestmentRanges(selectedInvestmentRanges.filter(rangeId => rangeId !== id));
    }
  };

  const handleShowMoreAreas = () => {
    setVisibleAreasCount(prevCount => Math.min(prevCount + 10, areas?.length ?? 0));
  };

  const handleShowLessAreas = () => {
    setVisibleAreasCount(INITIAL_VISIBLE_AREAS);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="flex flex-col rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:flex-row md:px-16 md:py-12">
          {isLoadingAreas ? (
            <FilterSidebarSkeleton />
          ) : (
            <div className="w-full md:w-1/5">
              <p className="font-medium">Sector</p>
              <div className="ml-2 mt-1.5 flex gap-1 max-w-[150px] flex-col">
                {Array.from({ length: visibleAreasCount }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      id={areas?.[i]?.id.toString() ?? ''}
                      checked={selectedSectors.includes(areas?.[i]?.id.toString() ?? '')}
                      onCheckedChange={checked =>
                        handleSectorChange(areas?.[i]?.id.toString() ?? '', checked === true)
                      }
                    />
                    <p key={areas?.[i]?.id} className="text-sm">
                      {areas?.[i]?.name}
                    </p>
                  </div>
                ))}
                {areas && areas.length > visibleAreasCount && (
                  <button
                    onClick={handleShowMoreAreas}
                    className="mt-1 text-start text-sm text-white/50 hover:text-white hover:underline"
                  >
                    See more ({Math.min(10, areas.length - visibleAreasCount)})
                  </button>
                )}
                {visibleAreasCount > INITIAL_VISIBLE_AREAS && (
                  <button
                    onClick={handleShowLessAreas}
                    className="mt-1 text-start text-sm text-white/50 hover:text-white hover:underline"
                  >
                    Show less
                  </button>
                )}
              </div>
              <p className="mt-2 font-medium">Investor Slots</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="1-5-slots"
                    checked={oneToFiveSlots}
                    onCheckedChange={checked => setOneToFiveSlots(checked === true)}
                  />
                  <p className="text-sm">1 - 5</p>
                </div>
              </div>
              <p className="mt-2 font-medium">Stage</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                {PROJECT_STAGES.map(stage => (
                  <div key={stage.value} className="flex items-center gap-2">
                    <Checkbox
                      id={stage.value}
                      checked={selectedStages.includes(stage.value)}
                      onCheckedChange={checked => handleStageChange(stage.value, checked === true)}
                    />
                    <p className="text-sm">{stage.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-medium">Social Impact</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="social-impact"
                    checked={selectedStages.includes(ProjectStage.SOCIAL_IMPACT)}
                    onCheckedChange={checked =>
                      handleStageChange(ProjectStage.SOCIAL_IMPACT, checked === true)
                    }
                  />
                  <p className="text-sm">Social Impact Projects</p>
                </div>
              </div>
              <p className="mt-2 font-medium">Incubator</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="incubator-projects"
                    checked={onlyIncubatorProjects}
                    onCheckedChange={checked => setOnlyIncubatorProjects(checked === true)}
                  />
                  <p className="text-sm">Only Incubator Projects</p>
                </div>
              </div>
              <p className="mt-2 font-medium">Revenue</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                {REVENUE_RANGES.map(range => (
                  <div key={range.id} className="flex items-center gap-2">
                    <Checkbox
                      id={range.id}
                      checked={revenueFilters.min === range.min && revenueFilters.max === range.max}
                      onCheckedChange={checked =>
                        handleRevenueFilterChange(range.id, checked === true)
                      }
                    />
                    <p className="text-sm">{range.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-medium">Initial Investment</p>
              <div className="ml-2 mt-1.5 gap-1 flex flex-col">
                {INVESTMENT_RANGES.map(range => (
                  <div key={range.id} className="flex items-center gap-2">
                    <Checkbox
                      id={range.id}
                      checked={selectedInvestmentRanges.includes(range.id)}
                      onCheckedChange={checked =>
                        handleInvestmentFilterChange(range.id, checked === true)
                      }
                    />
                    <p className="text-sm">{range.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-medium">Favorites</p>
              <div className="ml-2 mt-1.5 flex items-center gap-2">
                <Checkbox
                  id="favorites"
                  checked={favorites}
                  onCheckedChange={checked => setFavorites(checked === true)}
                />
                <p className="text-sm">Only Favorites</p>
              </div>
            </div>
          )}
          <div className="mt-6 w-full md:mt-0 md:w-4/5">
            <div className="flex items-center rounded-md bg-white/10 border-2 border-white/10">
              <SearchIcon className="ml-3 h-5 w-5 text-white" />
              <Input
                placeholder="Search projects by name"
                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {isLoadingProjects ? (
                <>
                  <CompanyCardSkeleton />
                  <CompanyCardSkeleton />
                  <CompanyCardSkeleton />
                </>
              ) : projects?.projects && projects?.projects.length > 0 ? (
                projects?.projects.map(project => (
                  <CompanyCard key={project.id} project={project} />
                ))
              ) : (
                <p className="text-center text-sm text-white/50">
                  No projects found matching your criteria.
                </p>
              )}
            </div>
            {!isLoadingProjects && (
              <div className="mt-8 flex items-center justify-end gap-2">
                <p className="text-sm text-white/50">
                  {`Showing ${projects?.projects?.length ?? 0} of ${projects?.total ?? 0} projects`}
                </p>
                <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page === 0}>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={(projects?.total ?? 0) - (page + 1) * 20 <= 0}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function CompanyCard({
  project,
}: {
  project: Project & { state: State | null; country: Country | null; sector: Area } & {
    isFavorite: boolean;
    likesCount: number;
  };
}) {
  const isBoosted = project.boostedUntil !== null && project.boostedUntil > new Date();

  return (
    <Link
      href={`/companies/${project.id}`}
      className={`cursor-pointer rounded-xl border-2 bg-card p-6 transition-all  ${isBoosted
        ? 'border-yellow-500/50 hover:border-yellow-600/50'
        : 'border-white/10 hover:border-white/20'
        }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        {project.logo ? (
          <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg ring-2 ring-white/10 transition-all group-hover:ring-white/20">
            <Image
              src={project.logo}
              alt={`${project.name} Logo`}
              width={72}
              height={72}
              className="h-full w-full rounded-md object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10 ring-2 ring-white/10 transition-all group-hover:ring-white/20">
            <Building2 className="size-8 text-neutral-500 transition-colors group-hover:text-neutral-400" />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-white/90">
                {project.name}
              </h3>
              <span className="ml-auto">{project.likesCount}</span>
              <Heart
                className={`size-4 ${project.likesCount > 0 ? 'fill-yellow-500 text-yellow-500' : 'fill-transparent'} transition-transform group-hover:scale-110`}
              />
            </div>
            {project.state?.name && project.country?.name && (
              <span className="text-sm text-white/70 transition-colors group-hover:text-white/80">
                {project.state.name}, {project.country.name}
              </span>
            )}

            <p className="mt-2 line-clamp-2 text-sm text-white/60 transition-colors group-hover:text-white/70">
              {project.quickSolution ?? 'No description available'}
            </p>
          </div>

          {/* Project Information */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70 sm:text-sm">
              {project.stage && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {PROJECT_STAGES.find(s => s.value === project.stage)?.label ?? project.stage}
                  </span>
                </div>
              )}

              {project.country && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{project.country.name}</span>
                </div>
              )}

              {project.investmentGoal && (
                <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 transition-colors group-hover:bg-white/10">
                  <span className="truncate text-xs text-white/70">
                    {project.currency === 'USD' ? '$' : project.currency === 'EUR' ? '€' : 'R$'}{' '}
                    {project.investmentGoal.toLocaleString()}
                  </span>
                </div>
              )}

              {project.sector && (
                <div className="flex items-center rounded-full bg-[#323645] px-3 py-1.5 transition-colors group-hover:bg-[#3a3f50]">
                  <span className="truncate text-xs font-medium text-white/70">
                    {project.sector.name}
                  </span>
                </div>
              )}

              {project.investorSlots && (
                <div className="flex gap-2 text-xs text-white/70 sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span>Investor Slots: </span>
                    <div className="flex space-x-1">
                      {Array.from({
                        length: Math.min(project.investorSlots ?? 0, 5),
                      }).map((_, i) => (
                        <CircleUserRound key={i} color="#EFD687" className="h-3 w-3" />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isBoosted && (
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-500" />
                  <span>Boosted</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CompanyCardSkeleton() {
  return (
    <div className="rounded-xl border-2 border-white/10 bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <Skeleton className="h-[72px] w-[72px] flex-shrink-0 rounded-lg" />
        <div className="flex flex-col gap-2 w-full">
          <Skeleton className="h-6 w-3/5 rounded" />
          <Skeleton className="h-4 w-2/5 rounded" />
          <Skeleton className="h-4 w-full rounded mt-1" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
      </div>
    </div>
  );
}

function FilterSidebarSkeleton() {
  return (
    <div className="w-full md:w-1/5 space-y-4">
      <div>
        <Skeleton className="h-5 w-1/3 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          {Array.from({ length: INITIAL_VISIBLE_AREAS }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-2/5 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-1/4 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          {PROJECT_STAGES.slice(0, 3).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-1/3 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          {REVENUE_RANGES.slice(0, 3).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-2/5 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          {INVESTMENT_RANGES.slice(0, 3).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Skeleton className="h-5 w-1/3 rounded mb-2" />
        <div className="ml-2 mt-1.5 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
