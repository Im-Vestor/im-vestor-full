import { Building, Building2, Loader2, Pencil, User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { PartnerForm } from './partner-form';
import { UpdateEmailButton } from '~/components/update-email-button';

export const PartnerProfile = ({ userId }: { userId?: string }) => {
  const [isEditing, setIsEditing] = useState(false);

  // Use different query based on whether userId is provided (admin view) or not (own profile)
  const { data: partner, isPending: isLoading } = userId
    ? api.partner.getByUserIdForAdmin.useQuery({ userId })
    : api.partner.getByUserId.useQuery();

  // Disable editing when viewing someone else's profile
  const canEdit = !userId;

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (isEditing) {
    return <PartnerForm partner={partner} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="relative">
        <div className="h-24 w-full rounded-t-lg bg-transparent" />

        <div className="absolute bottom-0 left-12 translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A]">
            {partner?.photo ? (
              <Image
                src={partner.photo}
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
          <h2 className="text-3xl font-semibold">{partner?.firstName + ' ' + partner?.lastName}</h2>
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
        <div className="mt-4 flex items-center gap-3">
          {partner?.companyLogoUrl ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-white/5">
              <Image
                src={partner.companyLogoUrl}
                alt="Company Logo"
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
              <Building2 className="h-6 w-6 text-neutral-400" />
            </div>
          )}
          <div>
            <p className="flex items-center gap-1 text-gray-400">
              <Building className="mr-0.5 h-4 w-4" />
              {partner?.companyName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
