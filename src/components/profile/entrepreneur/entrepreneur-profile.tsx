import { type Country, type Entrepreneur, type Project, type State } from '@prisma/client';
import {
  ArrowRight,
  Building2,
  CircleUserRound,
  DollarSign,
  MapPin,
  Pencil,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { SkeletonProfile } from '../skeleton-profile';
import { EntrepreneurForm } from './entrepreneur-form';

export const EntrepreneurProfile = ({ userId }: { userId?: string }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Use different query based on whether userId is provided (admin view) or not (own profile)
  const { data: entrepreneur, isPending: isLoading } = userId
    ? api.entrepreneur.getByUserIdForAdmin.useQuery({ userId })
    : api.entrepreneur.getByUserId.useQuery();

  // Disable editing when viewing someone else's profile
  const canEdit = !userId;

  if (isLoading) {
    return <SkeletonProfile />;
  }

  if (isEditing || !entrepreneur?.country) {
    return <EntrepreneurForm entrepreneur={entrepreneur} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="relative">
        {entrepreneur?.banner ? (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={entrepreneur.banner}
              alt="Banner"
              layout="fill"
              objectFit="cover"
              className="rounded-t-md"
            />
            <div className="via-90%[#23242F]/70 absolute inset-0 bg-gradient-to-b from-transparent to-[#23242F]/100" />
          </div>
        ) : (
          <div className="h-24 w-full rounded-t-lg bg-transparent" />
        )}

        <div className="absolute bottom-0 left-12 translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A]">
            {entrepreneur?.photo ? (
              <Image
                src={entrepreneur.photo}
                alt="Profile"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-black" />
            )}
          </div>
        </div>
      </div>

      <div className="md:px-12 px-6 pt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold">
            {entrepreneur?.firstName + ' ' + entrepreneur?.lastName}
          </h2>
          {canEdit && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Pencil className="h-2 w-2" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
        <p className="mt-3 text-lg text-gray-400">
          {entrepreneur?.companyRole ?? 'Entrepreneur'}
          {entrepreneur?.companyName ? `, ${entrepreneur.companyName}` : ''}
        </p>
        <p className="mt-1 flex items-center gap-1 text-gray-400">
          <MapPin className="mr-0.5 h-4 w-4" />
          {entrepreneur?.state && entrepreneur?.country
            ? `${entrepreneur.state.name}, ${entrepreneur.country.name}`
            : 'Not specified'}
        </p>
        <hr className="my-4 sm:my-6 border-white/10" />
        <h3 className="mt-12 font-semibold">About me</h3>
        <p className="mt-3 text-gray-400">{entrepreneur?.about ?? 'No description'}</p>
        <hr className="my-4 sm:my-6 border-white/10" />
        <h3 className="mt-12 font-semibold">Projects</h3>
        {entrepreneur?.projects && entrepreneur?.projects.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            {entrepreneur?.projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project as Project & { state: State; country: Country }}
                profileData={
                  entrepreneur as Entrepreneur & {
                    state: State;
                    country: Country;
                  }
                }
              />
            ))}
          </div>
        )}
        {canEdit && (
          <Button className="mt-4 md:w-1/3" onClick={() => router.push('/companies/create')}>
            Add a Project
            <ArrowRight className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

function ProjectCard({
  project,
  profileData,
}: {
  project: Project & { state: State; country: Country };
  profileData: Entrepreneur & { state: State; country: Country };
}) {
  return (
    <Link
      className="cursor-pointer rounded-xl border-2 border-white/10 bg-card p-4 sm:p-6 transition-all hover:border-white/20 relative"
      href={`/companies/${project.id}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 sm:gap-0">
        <div className="flex gap-4 sm:gap-6">
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

          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-semibold">{project.name}</h3>
                <Badge variant="outline" className="text-primary">
                  {project.visibility}
                </Badge>
              </div>
              {project.state?.name && project.country?.name && (
                <span className="text-sm sm:text-base text-white/70">
                  {project.state?.name}, {project.country?.name}
                </span>
              )}
              <p className="text-sm sm:text-base line-clamp-2 sm:line-clamp-none">
                {project.quickSolution}
              </p>
            </div>
          </div>
        </div>
        <div className="flex sm:flex-col gap-2 sm:items-end">
          <Link
            href={`/companies/edit/${project.id}`}
            className="flex h-8 w-fit items-center rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm hover:bg-white/10"
            onClick={e => e.stopPropagation()}
          >
            <Pencil className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="sm:inline">Edit</span>
          </Link>
          <Link
            href={`/companies/know-your-numbers/${project.id}`}
            className="flex h-8 w-fit items-center rounded-md border border-white/10 bg-white/5 px-2 sm:px-3 text-xs sm:text-sm hover:bg-white/10"
            onClick={e => e.stopPropagation()}
          >
            <DollarSign className="mr-1 sm:mr-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Numbers</span>
            <span className="sm:hidden">Numbers</span>
          </Link>
        </div>
      </div>
      <hr className="my-4 sm:my-6 border-white/10" />
      <div className="flex flex-wrap items-center gap-2">
        {profileData.photo ? (
          <Image
            src={profileData.photo}
            alt="Founder"
            width={24}
            height={24}
            className="h-4 w-4 rounded-full object-cover text-white/50"
          />
        ) : (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10">
            <User className="size-3 text-neutral-200" />
          </div>
        )}
        <p className="text-xs sm:text-sm font-light">
          Founded by
          <span className="text-[#EFD687]"> {profileData.firstName}</span>
        </p>
        <div className="ml-auto flex space-x-1 sm:space-x-2">
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
    </Link>
  );
}
