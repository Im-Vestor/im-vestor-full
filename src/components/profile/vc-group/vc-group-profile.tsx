import { Building2, MapPin, Pencil, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { SkeletonProfile } from '../skeleton-profile';
import { VcGroupForm } from './vc-group-form';
import Link from 'next/link';
import { UpdateEmailButton } from '~/components/update-email-button';

export const VcGroupProfile = ({ userId }: { userId?: string }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Use different query based on whether userId is provided (admin view) or not (own profile)
  const { data: vcGroup, isPending: isLoading } = userId
    ? api.vcGroup.getByUserIdForAdmin.useQuery({ userId })
    : api.vcGroup.getByUserId.useQuery();

  // Disable editing when viewing someone else's profile
  const canEdit = !userId;

  if (isLoading) {
    return <SkeletonProfile />;
  }
  if (isEditing || !vcGroup?.countryId) {
    return <VcGroupForm vcGroup={vcGroup} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A] ml-12 mt-12">
        {vcGroup?.logo ? (
          <Image
            src={vcGroup.logo}
            alt="Profile"
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <Building2 className="h-8 w-8 text-black" />
        )}
      </div>

      <div className="md:px-12 px-6 pt-12">
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">{vcGroup?.name}</h2>
          {canEdit && (
            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-fit"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Pencil className="h-2 w-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <UpdateEmailButton />
            </div>
          )}
        </div>
        <hr className="my-4 sm:my-6 border-white/10" />
        <p className="mt-1 flex items-center gap-1 text-gray-400">
          <MapPin className="mr-0.5 h-4 w-4" />
          {vcGroup?.state && vcGroup?.country
            ? `${vcGroup.state.name}, ${vcGroup.country.name}`
            : 'Not specified'}
        </p>
        <hr className="my-4 sm:my-6 border-white/10" />
        <h3 className="mt-12 font-semibold">About me</h3>
        <p className="mt-3 text-gray-400">{vcGroup?.bio ?? 'No description'}</p>
        <h3 className="mt-12 font-semibold">Members</h3>
        <div className="mt-3 flex flex-col gap-4">
          {vcGroup?.members.map(member => (
            <div key={member.id} className="flex gap-3 items-start">
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={`${member.name}`}
                  width={48}
                  height={48}
                  className="size-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                  <User className="size-10 text-neutral-200 sm:size-12" />
                </div>
              )}
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold sm:text-xl">{member.name}</h3>
                <p className=" whitespace-pre-wrap text-sm text-white/80 sm:text-base">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
        <h3 className="mt-12 font-semibold">Portfolio</h3>
        <div className="mt-3">
          {vcGroup?.investedProjects.length === 0 && (
            <p className="text-sm text-white/80">No projects invested in yet</p>
          )}
          {vcGroup?.investedProjects.length > 0 &&
            vcGroup?.investedProjects.map(project => (
              <Link
                key={project.id}
                href={`/companies/${project.id}`}
                className="flex gap-3 items-start"
              >
                {project.logo ? (
                  <Image
                    src={project.logo}
                    alt={`${project.name}`}
                    width={48}
                    height={48}
                    className="size-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                    <User className="size-10 text-neutral-200 sm:size-12" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold sm:text-xl">{project.name}</h3>
                  <p className=" whitespace-pre-wrap text-sm text-white/80 sm:text-base">
                    {project.stage}
                  </p>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
