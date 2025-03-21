import {
  type Area,
  type Country,
  type Investor,
  type State,
} from "@prisma/client";
import { Loader2, MessageCircle, SearchIcon, UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { api } from "~/utils/api";

type InvestmentRange = {
  id: string;
  label: string;
  min?: number;
  max?: number;
};

// Define investment ranges
const INVESTMENT_RANGES: InvestmentRange[] = [
  { id: "1", label: "Less than $100k", max: 100000 },
  { id: "2", label: "$100k - $500k", min: 100000, max: 500000 },
  { id: "3", label: "$500k - $1M", min: 500000, max: 1000000 },
  { id: "4", label: "$1M - $5M", min: 1000000, max: 5000000 },
  { id: "5", label: "$5M+", min: 5000000 },
];

type InvestorWithRelations = Investor & {
  state: State | null;
  country: Country | null;
  areas: Area[];
};

export default function Investors() {
  const { data: areas } = api.area.getAll.useQuery();
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [visibleAreasCount, setVisibleAreasCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  // Filter states
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [investmentFilters, setInvestmentFilters] = useState<{
    min?: number;
    max?: number;
  }>({});

  // Prepare filter parameters for the API call
  const filterParams = {
    areaIds: selectedAreas,
    minInvestment: investmentFilters.min,
    maxInvestment: investmentFilters.max,
    searchQuery: searchQuery,
    page: page,
  };

  const { data, isLoading } =
    api.investor.getInvestorsRelatedToEntrepreneur.useQuery(filterParams);

  const visibleAreas = areas?.slice(0, visibleAreasCount);

  const handleAreaChange = (areaId: string, checked: boolean) => {
    if (checked) {
      setSelectedAreas([...selectedAreas, areaId]);
    } else {
      setSelectedAreas(selectedAreas.filter((id) => id !== areaId));
    }
  };

  const handleInvestmentFilterChange = (id: string, checked: boolean) => {
    if (!checked) {
      setInvestmentFilters({});
      return;
    }

    const range = INVESTMENT_RANGES.find((r) => r.id === id);
    if (range) {
      setInvestmentFilters({ min: range.min, max: range.max });
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
              <div className="ml-2 mt-1.5 flex gap-2 max-w-[150px] flex-col">
                {visibleAreas?.map((area) => (
                  <div key={area.id} className="flex items-center gap-2">
                    <Checkbox
                      id={area.id.toString()}
                      checked={selectedAreas.includes(area.id.toString())}
                      onCheckedChange={(checked) =>
                        handleAreaChange(area.id.toString(), checked === true)
                      }
                    />
                    <p className="text-sm">
                      {area.name}
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
                {INVESTMENT_RANGES.map((range) => (
                  <div key={range.id} className="flex items-center gap-2">
                    <Checkbox
                      id={range.id}
                      checked={
                        investmentFilters.min === range.min &&
                        investmentFilters.max === range.max
                      }
                      onCheckedChange={(checked) =>
                        handleInvestmentFilterChange(range.id, checked === true)
                      }
                    />
                    <p className="text-sm">{range.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 w-full md:mt-0 md:w-4/5">
              <div className="flex items-center rounded-md bg-[#282A37]">
                <SearchIcon className="ml-3 h-5 w-5 text-white" />
                <Input
                  placeholder="Search investors by name"
                  className="bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {data?.investors && data.investors.length > 0 ? (
                  data.investors.map((investor: InvestorWithRelations) => (
                    <InvestorCard key={investor.id} investor={investor} />
                  ))
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-8 animate-spin text-white" />
                  </div>
                ) : (
                  <p className="my-12 text-center text-sm text-white/50">
                    No investors found matching your criteria.
                  </p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <p className="text-sm text-white/50">
                  {isLoading
                    ? "Loading investors..."
                    : `Showing ${data?.investors?.length ?? 0} of ${data?.total ?? 0} investors`}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={(data?.total ?? 0) - (page + 1) * 10 <= 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function InvestorCard({ investor }: { investor: InvestorWithRelations }) {
  return (
    <Link
      // href={`/investors/${investor.id}`}
      href="#"
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
          <div className="flex flex-col">
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
              <p className="mt-1 line-clamp-2">{investor.about}</p>
            </div>
            {investor.areas && investor.areas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {investor.areas.slice(0, 2).map((area) => (
                  <span
                    key={area.id}
                    className="rounded-full bg-[#323645] px-6 py-1 text-sm font-light"
                  >
                    {area.name}
                  </span>
                ))}
                {investor.areas.length > 2 && (
                  <span className="rounded-full bg-[#323645] px-3 py-1 text-sm font-light">
                    +{investor.areas.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <Button
              onClick={(e) => {
                e.preventDefault();
                toast.success("Poke not implemented yet!");
              }}
              className="gap-2 self-start md:self-auto"
              size="sm"
            >
              <MessageCircle className="size-4" strokeWidth={2.5} />
              <span>Poke</span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
