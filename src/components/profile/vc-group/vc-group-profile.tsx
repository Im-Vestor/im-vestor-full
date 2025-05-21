import { Building2, MapPin, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { SkeletonProfile } from '../skeleton-profile';
import { VcGroupForm } from './vc-group-form';

export const VcGroupProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: vcGroup, isPending: isLoading } = api.vcGroup.getByUserId.useQuery();

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

      <div className="px-12 pt-12">
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">{vcGroup?.name}</h2>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="h-2 w-2" />
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
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
        <h3 className="mt-12 font-semibold">Portfolio</h3>
        <p>TODO</p>
      </div>
    </div>
  );
};
