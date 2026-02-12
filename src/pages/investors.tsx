import {
  type Area,
  type Country,
  type Investor,
  type State,
  type User,
  type UserType,
  type VcGroup,
} from '@prisma/client';
import { useUser } from '@clerk/nextjs';
import { Building2, Loader2, SearchIcon, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Header } from '~/components/header';
import { Badge } from '~/components/ui/badge';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { useDebounce } from '~/hooks/use-debounce';
import { api } from '~/utils/api';

type InvestmentRange = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

// Define investment ranges
const INVESTMENT_RANGES: InvestmentRange[] = [
  { id: '1', label: 'Less than $100k', max: 100000 },
  { id: '2', label: '$100k - $500k', min: 100000, max: 500000 },
  { id: '3', label: '$500k - $1M', min: 500000, max: 1000000 },
  { id: '4', label: '$1M - $5M', min: 1000000, max: 5000000 },
  { id: '5', label: '$5M+', min: 5000000 },
];

type UserWithRelations = User & {
  investor: (Investor & { state: State | null; country: Country | null; areas: Area[] }) | null;
  vcGroup:
  | (VcGroup & { state: State | null; country: Country | null; interestedAreas: Area[] })
  | null;
};

export default function Investors() {
  const { user } = useUser();
  // const userType = user?.publicMetadata.userType as UserType;

  const { data: areas } = api.area.getAll.useQuery();
  const [visibleAreasCount, setVisibleAreasCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Filter states
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedInvestmentRanges, setSelectedInvestmentRanges] = useState<string[]>([]);

  // Calculate combined investment range from selected ranges
  // Uses union logic: if any range has undefined min/max, the combined range inherits that
  const getInvestmentRange = () => {
    if (selectedInvestmentRanges.length === 0) return { min: undefined, max: undefined };

    const selectedRanges = INVESTMENT_RANGES.filter(range =>
      selectedInvestmentRanges.includes(range.id)
    );

    // If any selected range has no minimum (e.g., "Less than $100k"), global min is undefined
    const hasOpenMin = selectedRanges.some(range => range.min === undefined);
    // If any selected range has no maximum (e.g., "$5M+"), global max is undefined
    const hasOpenMax = selectedRanges.some(range => range.max === undefined);

    const mins = selectedRanges
      .map(range => range.min)
      .filter((min): min is number => min !== undefined);
    const maxs = selectedRanges
      .map(range => range.max)
      .filter((max): max is number => max !== undefined);

    return {
      min: hasOpenMin ? undefined : (mins.length > 0 ? Math.min(...mins) : undefined),
      max: hasOpenMax ? undefined : (maxs.length > 0 ? Math.max(...maxs) : undefined),
    };
  };

  const investmentRange = getInvestmentRange();

  // Prepare filter parameters for the API call
  const filterParams = {
    areaIds: selectedAreas,
    minInvestment: investmentRange.min,
    maxInvestment: investmentRange.max,
    searchQuery: debouncedSearchQuery,
  };

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.investor.getInvestorsAndVcGroupsRelatedToEntrepreneur.useInfiniteQuery(
      {
        ...filterParams,
        limit: 10,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const allUsers = (data?.pages.flatMap((page) => page.users) ?? []) as UserWithRelations[];
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const visibleAreas = areas?.slice(0, visibleAreasCount);

  const handleAreaChange = (areaId: string, checked: boolean) => {
    if (checked) {
      setSelectedAreas([...selectedAreas, areaId]);
    } else {
      setSelectedAreas(selectedAreas.filter(id => id !== areaId));
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
    if (areas) {
      if (visibleAreasCount + 10 >= areas.length) {
        setVisibleAreasCount(areas.length);
      } else {
        setVisibleAreasCount(visibleAreasCount + 10);
      }
    }
  };

  const handleShowLessAreas = () => {
    setVisibleAreasCount(5);
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-xl border-2 border-white/10 bg-card px-4 py-6 md:px-16 md:py-12">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/5">
              <p className="font-medium">Areas of Interest</p>
              <div className="ml-2 mt-1.5 flex gap-1 max-w-[150px] flex-col">
                {visibleAreas?.map(area => (
                  <div key={area.id} className="flex items-center gap-2">
                    <Checkbox
                      id={area.id.toString()}
                      checked={selectedAreas.includes(area.id.toString())}
                      onCheckedChange={checked =>
                        handleAreaChange(area.id.toString(), checked === true)
                      }
                    />
                    <p className="text-sm">{area.name}</p>
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
                {visibleAreasCount > 5 && (
                  <button
                    onClick={handleShowLessAreas}
                    className="mt-1 text-start text-sm text-white/50 hover:text-white hover:underline"
                  >
                    Show less
                  </button>
                )}
              </div>
              <p className="mt-2 font-medium">Investment Range</p>
              <div className="ml-2 mt-1.5 flex flex-col gap-2">
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
            </div>
            <div className="mt-6 w-full md:mt-0 md:w-4/5">
              <div className="flex items-center rounded-md bg-white/10 border-2 border-white/10">
                <SearchIcon className="ml-3 h-5 w-5 text-white" />
                <Input
                  placeholder="Search investors by name"
                  className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {allUsers.length > 0 ? (
                  allUsers.map((investorOrVcGroup) =>
                    investorOrVcGroup.investor ? (
                      <InvestorCard
                        key={investorOrVcGroup.id}
                        investor={investorOrVcGroup.investor}
                      />
                    ) : investorOrVcGroup.vcGroup ? (
                      <VcGroupCard key={investorOrVcGroup.id} vcGroup={investorOrVcGroup.vcGroup} />
                    ) : null
                  )
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-white" />
                  </div>
                ) : (
                  <p className="my-12 text-center text-sm text-white/50">
                    No investors found matching your criteria.
                  </p>
                )}

                {/* Sentinel and Loading Spinner */}
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center">
                  {isFetchingNextPage && <Loader2 className="size-6 animate-spin text-white" />}
                </div>

              </div>
              <div className="mt-8 flex items-center justify-end gap-2">
                <p className="text-sm text-white/50">
                  {isLoading
                    ? 'Loading investors...'
                    : `Showing ${allUsers.length} investors`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InvestorCard({
  investor,
}: {
  investor: Investor & { state: State | null; country: Country | null; areas: Area[] };
}) {
  return (
    <Link
      href={`/investor/${investor.id}`}
      key={investor.id}
      className="cursor-pointer rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20"
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:gap-6">
        {investor.photo ? (
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={investor.photo}
              alt={`${investor.firstName} ${investor.lastName} Photo`}
              width={72}
              height={72}
              className="h-full w-full rounded-md object-cover"
            />
          </div>
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
            <UserRound className="size-8 text-neutral-500" />
          </div>
        )}

        <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
          <div className="flex flex-col flex-1">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">
                  {investor.firstName} {investor.lastName}
                </h3>
              </div>
              {investor.state?.name && investor.country?.name && (
                <span className="text-white/70">
                  {investor.state.name}, {investor.country.name}
                </span>
              )}

              <p className="mt-2 line-clamp-2">{investor.about}</p>
            </div>

            {/* Investment Information */}
            <div className="mt-4 space-y-2">
              <div>
                <span className="text-sm text-white/70">Investimento: </span>
                <span className="text-sm font-medium">
                  {investor.currency === 'USD' ? '$' : investor.currency === 'EUR' ? '€' : 'R$'}
                  {investor.investmentMinValue.toString()} -{' '}
                  {investor.currency === 'USD' ? '$' : investor.currency === 'EUR' ? '€' : 'R$'}
                  {investor.investmentMaxValue.toString()}
                </span>
              </div>

              {investor.areas && investor.areas.length > 0 && (
                <div>
                  <span className="text-sm text-white/70">Setores: </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {investor.areas.slice(0, 3).map(area => (
                      <span
                        key={area.id}
                        className="rounded-full bg-[#323645] px-2 py-1 text-xs font-light"
                      >
                        {area.name}
                      </span>
                    ))}
                    {investor.areas.length > 3 && (
                      <span className="rounded-full bg-[#323645] px-2 py-1 text-xs font-light">
                        +{investor.areas.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Badge>INVESTOR</Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VcGroupCard({
  vcGroup,
}: {
  vcGroup: VcGroup & { state: State | null; country: Country | null; interestedAreas: Area[] };
}) {
  return (
    <Link
      href={`/vc-group/${vcGroup.id}`}
      key={vcGroup.id}
      className="cursor-pointer rounded-xl border-2 border-white/10 bg-card p-6 transition-all hover:border-white/20"
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:gap-6">
        {vcGroup.logo ? (
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={vcGroup.logo}
              alt={`${vcGroup.name} Logo`}
              width={72}
              height={72}
              className="h-full w-full rounded-md object-cover"
            />
          </div>
        ) : (
          <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/10">
            <Building2 className="size-8 text-neutral-500" />
          </div>
        )}

        <div className="flex w-full flex-col justify-between gap-4 md:flex-row">
          <div className="flex flex-col flex-1">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{vcGroup.name}</h3>
              </div>
              {vcGroup.state?.name && vcGroup.country?.name && (
                <span className="text-white/70">
                  {vcGroup.state.name}, {vcGroup.country.name}
                </span>
              )}

              <p className="mt-2 line-clamp-2">{vcGroup.description}</p>
            </div>

            {/* Investment Information */}
            <div className="mt-4 space-y-2">
              {vcGroup.averageInvestmentSize && (
                <div>
                  <span className="text-sm text-white/70">Investimento: </span>
                  <span className="text-sm font-medium">
                    €{vcGroup.averageInvestmentSize.toString()}
                  </span>
                </div>
              )}

              {vcGroup.interestedAreas && vcGroup.interestedAreas.length > 0 && (
                <div>
                  <span className="text-sm text-white/70">Setores: </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {vcGroup.interestedAreas.slice(0, 3).map(area => (
                      <span
                        key={area.id}
                        className="rounded-full bg-[#323645] px-2 py-1 text-xs font-light"
                      >
                        {area.name}
                      </span>
                    ))}
                    {vcGroup.interestedAreas.length > 3 && (
                      <span className="rounded-full bg-[#323645] px-2 py-1 text-xs font-light">
                        +{vcGroup.interestedAreas.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Badge>VC GROUP</Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
