import { type Country, type Project, type State, type ProjectStage } from "@prisma/client";
import {
  Building2,
  Loader2,
  SearchIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { PROJECT_STAGES } from "~/data/project-stages";
import { api } from "~/utils/api";

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
  { id: "1", label: "Less than $100k", max: 100000 },
  { id: "2", label: "$100k - $500k", min: 100000, max: 500000 },
  { id: "3", label: "$500k - $1M", min: 500000, max: 1000000 },
  { id: "4", label: "$1M - $5M", min: 1000000, max: 5000000 },
  { id: "5", label: "$5M+", min: 5000000 },
];

const INVESTMENT_RANGES: InvestmentRange[] = [
  { id: "1", label: "Less than $100k", max: 100000 },
  { id: "2", label: "$100k - $500k", min: 100000, max: 500000 },
  { id: "3", label: "$500k - $1M", min: 500000, max: 1000000 },
  { id: "4", label: "$1M - $5M", min: 1000000, max: 5000000 },
  { id: "5", label: "$5M+", min: 5000000 },
];

export default function Companies() {
  const { data: areas } = api.area.getAll.useQuery();
  const [showAllAreas, setShowAllAreas] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  // Filter states
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [oneToFiveSlots, setOneToFiveSlots] = useState(false);
  const [selectedStages, setSelectedStages] = useState<ProjectStage[]>([]);
  const [revenueFilters, setRevenueFilters] = useState<{
    min?: number;
    max?: number;
  }>({});
  const [investmentFilters, setInvestmentFilters] = useState<{
    min?: number;
    max?: number;
  }>({});

  // Prepare filter parameters for the API call
  const filterParams = {
    sectorId: selectedSectors,
    stage: selectedStages,
    oneToFiveSlots: oneToFiveSlots,
    minRevenue: revenueFilters.min,
    maxRevenue: revenueFilters.max,
    minInitialInvestment: investmentFilters.min,
    maxInitialInvestment: investmentFilters.max,
    searchQuery: searchQuery,
    page: page,
  };

  const { data: projects, isLoading } =
    api.project.getAllWithFilters.useQuery(filterParams);

  const visibleAreas = showAllAreas ? areas : areas?.slice(0, 3);

  const handleSectorChange = (sectorId: string, checked: boolean) => {
    if (checked) {
      setSelectedSectors([...selectedSectors, sectorId]);
    } else {
      setSelectedSectors(selectedSectors.filter((id) => id !== sectorId));
    }
  };

  const handleStageChange = (stage: ProjectStage, checked: boolean) => {
    if (checked) {
      setSelectedStages([...selectedStages, stage]);
    } else {
      setSelectedStages(selectedStages.filter((s) => s !== stage));
    }
  };

  const handleRevenueFilterChange = (id: string, checked: boolean) => {
    if (!checked) {
      setRevenueFilters({});
      return;
    }

    const range = REVENUE_RANGES.find((r) => r.id === id);
    if (range) {
      setRevenueFilters({ min: range.min, max: range.max });
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

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 md:p-8">
      <Header />
      <div className="mt-12">
        <div className="flex flex-col rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] px-4 py-6 md:flex-row md:px-16 md:py-12">
          <div className="w-full md:w-1/5">
            <p className="font-medium">Sector</p>
            <div className="ml-2 mt-1.5 flex max-w-[150px] flex-col">
              {visibleAreas?.map((area) => (
                <div key={area.id} className="flex items-center gap-2">
                  <Checkbox
                    id={area.id.toString()}
                    checked={selectedSectors.includes(area.id.toString())}
                    onCheckedChange={(checked) =>
                      handleSectorChange(area.id.toString(), checked === true)
                    }
                  />
                  <p key={area.id} className="text-sm">
                    {area.name}
                  </p>
                </div>
              ))}
              {areas && areas.length > 3 && (
                <button
                  onClick={() => setShowAllAreas(!showAllAreas)}
                  className="mt-1 text-start text-sm text-white/50 hover:text-white hover:underline"
                >
                  {showAllAreas
                    ? "Show less"
                    : `See more (${areas.length - 3})`}
                </button>
              )}
            </div>
            <p className="mt-2 font-medium">Investor Slots</p>
            <div className="ml-2 mt-1.5 flex flex-col">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="1-5-slots"
                  checked={oneToFiveSlots}
                  onCheckedChange={(checked) =>
                    setOneToFiveSlots(checked === true)
                  }
                />
                <p className="text-sm">1 - 5</p>
              </div>
            </div>
            <p className="mt-2 font-medium">Stage</p>
            <div className="ml-2 mt-1.5 flex flex-col">
              {PROJECT_STAGES.map((stage) => (
                <div key={stage.value} className="flex items-center gap-2">
                  <Checkbox
                    id={stage.value}
                    checked={selectedStages.includes(stage.value)}
                    onCheckedChange={(checked) =>
                      handleStageChange(stage.value, checked === true)
                    }
                  />
                  <p className="text-sm">{stage.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-medium">Revenue</p>
            <div className="ml-2 mt-1.5 flex flex-col">
              {REVENUE_RANGES.map((range) => (
                <div key={range.id} className="flex items-center gap-2">
                  <Checkbox
                    id={range.id}
                    checked={
                      revenueFilters.min === range.min &&
                      revenueFilters.max === range.max
                    }
                    onCheckedChange={(checked) =>
                      handleRevenueFilterChange(range.id, checked === true)
                    }
                  />
                  <p className="text-sm">{range.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 font-medium">Initial Investment</p>
            <div className="ml-2 mt-1.5 flex flex-col">
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
                placeholder="Search"
                className="bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <p className="text-sm text-white/50">
                {isLoading
                  ? "Loading projects..."
                  : `Showing ${projects?.projects?.length ?? 0} of ${projects?.total ?? 0} companies`}
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-white" />
                </div>
              ) : projects?.projects && projects?.projects.length > 0 ? (
                projects?.projects.map((project) => (
                  <CompanyCard key={project.id} project={project} />
                ))
              ) : (
                <p className="text-center text-sm text-white/50">
                  No projects found matching your criteria.
                </p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <p className="text-sm text-white/50">
                {isLoading
                  ? "Loading projects..."
                  : `Showing ${projects?.projects?.length ?? 0} of ${projects?.total ?? 0} companies`}
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
                disabled={(projects?.total ?? 0) - (page + 1) * 20 <= 0}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CompanyCard({ project }: { project: Project & { state: State | null; country: Country | null } }) {
  return (
    <Link
      href={`/companies/${project.id}`}
      className="cursor-pointer rounded-xl border-2 border-white/10 bg-[#1E202A] p-6 transition-all hover:border-white/20"
    >
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:gap-6">
        {project.logo ? (
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={project.logo}
              alt={`${project.name} Logo`}
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

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">{project.name}</h3>
          </div>
          {project.state?.name && project.country?.name && (
            <span className="text-white/70">
              {project.state.name}, {project.country.name}
            </span>
          )}
          <p className="mt-1 line-clamp-3">
            {project.quickSolution ?? "No description available"}
          </p>
        </div>
      </div>
    </Link>
  );
}
