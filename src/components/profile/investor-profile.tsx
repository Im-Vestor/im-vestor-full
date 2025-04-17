import { MapPin, Pencil, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { InvestorForm } from './investor-form';
import { SkeletonProfile } from './skeleton-profile';

export const InvestorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: investor, isPending: isLoading } = api.investor.getByUserId.useQuery();

  if (isLoading) {
    return <SkeletonProfile />;
  }
  if (isEditing || !investor?.country) {
    return <InvestorForm investor={investor} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="relative">
        {investor?.banner ? (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            <Image
              src={investor?.banner}
              alt="Banner"
              layout="fill"
              objectFit="cover"
              className="rounded-t-md"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#23242F]/100" />
          </div>
        ) : (
          <div className="h-24 w-full rounded-t-lg bg-transparent" />
        )}

        <div className="absolute bottom-0 left-12 translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A]">
            {investor?.photo ? (
              <Image
                src={investor.photo}
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

      <div className="px-12 pt-16">
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">
            {investor?.firstName + ' ' + investor?.lastName}
          </h2>
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
          {investor?.state && investor?.country
            ? `${investor.state.name}, ${investor.country.name}`
            : 'Not specified'}
        </p>
        <hr className="my-4 sm:my-6 border-white/10" />
        <h3 className="mt-12 font-semibold">About me</h3>
        <p className="mt-3 text-gray-400">{investor?.about ?? 'No description'}</p>
        <h3 className="mt-12 font-semibold">Portfolio</h3>
        <p>TODO</p>
      </div>
    </div>
  );
};
