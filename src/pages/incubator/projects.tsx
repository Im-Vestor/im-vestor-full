import {
  type Incubator,
  type Country,
  type Entrepreneur,
  type Project,
  type State,
} from '@prisma/client';
import {
  Building2,
  CircleUserRound,
  DollarSign,
  Eye,
  MapPin,
  Pencil,
  Plus,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Header } from '~/components/header';
import { SkeletonProfile } from '~/components/profile/skeleton-profile';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';

export default function IncubatorProjects() {
  const router = useRouter();

  const { data: incubator, isPending: isLoading } = api.incubator.getByUserId.useQuery();

  if (isLoading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-12">
          <SkeletonProfile />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-lg border border-white/10 bg-card p-6 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-semibold">My Projects</h1>
              <p className="mt-2 text-gray-400">
                Manage and edit your projects, control visibility, and track performance.
              </p>
            </div>
            <Button
              onClick={() => router.push('/projects/create')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Project
            </Button>
          </div>

          {incubator?.projects && incubator.projects.length > 0 ? (
            <div className="grid gap-6">
              {incubator.projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project as Project & { state: State; country: Country }}
                  profileData={
                    incubator as Incubator & {
                      state: State;
                      country: Country;
                    }
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first project to start connecting with investors.
              </p>
              <Button onClick={() => router.push('/projects/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProjectCard({
  project,
  profileData,
}: {
  project: Project & { state: State; country: Country };
  profileData: Incubator & { state: State; country: Country };
}) {
  return (
    <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-6 transition-all hover:border-white/20 relative">
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-0">
        <div className="flex gap-4 sm:gap-6 flex-1">
          <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
            {project.logo ? (
              <Image
                src={project.logo}
                alt="Company Logo"
                width={72}
                height={72}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10">
                <Building2 className="size-5 sm:size-6 text-neutral-200" />
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg sm:text-xl font-semibold">{project.name}</h3>
                <Badge variant="outline" className="text-primary">
                  {project.visibility}
                </Badge>
              </div>
              {project.state?.name && project.country?.name && (
                <span className="text-sm sm:text-base text-white/70 block mb-2">
                  {project.state?.name}, {project.country?.name}
                </span>
              )}
              <p className="text-sm sm:text-base text-gray-300 line-clamp-2">
                {project.quickSolution}
              </p>
            </div>
          </div>
        </div>

        <div className="flex lg:flex-col gap-2 lg:items-end flex-wrap">
          <Link
            href={`/projects/${project.id}`}
            className="flex h-8 w-fit items-center rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm hover:bg-white/10 transition-colors"
          >
            <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>View</span>
          </Link>
          <Link
            href={`/projects/${project.id}/edit`}
            className="flex h-8 w-fit items-center rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm hover:bg-white/10 transition-colors"
          >
            <Pencil className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Edit</span>
          </Link>
          <Link
            href={`/projects/${project.id}/know-your-numbers`}
            className="flex h-8 w-fit items-center rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm hover:bg-white/10 transition-colors"
          >
            <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Numbers</span>
          </Link>
        </div>
      </div>

      <hr className="my-4 sm:my-6 border-white/10" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
            <User className="size-3 text-neutral-200" />
          </div>
          <p className="text-xs sm:text-sm font-light">
            Founded by
            <span className="text-[#EFD687]"> {profileData.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-400">
            <MapPin className="h-3 w-3" />
            <span>
              {project.state?.name}, {project.country?.name}
            </span>
          </div>
          <div className="flex space-x-1 sm:space-x-2">
            {Array.from({
              length: project.investorSlots
                ? project.investorSlots > 5
                  ? 5
                  : project.investorSlots
                : 0,
            }).map((_, i) => (
              <CircleUserRound key={i} color="#EFD687" className="h-3 w-3 sm:h-4 sm:w-4" />
            ))}
            {project.investorSlots && project.investorSlots > 5 && (
              <p className="text-xs sm:text-sm font-light text-white/50">
                (+{project.investorSlots - 5})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
