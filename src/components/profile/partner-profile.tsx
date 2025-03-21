import { Building, Loader2, Pencil, User } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { PartnerForm } from "./partner-form";

export const PartnerProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: partner, isPending: isLoading } =
    api.partner.getByUserId.useQuery();

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (isEditing) {
    return (
      <PartnerForm partner={partner} onCancel={() => setIsEditing(false)} />
    );
  }

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="relative">
        <div className="h-24 w-full rounded-t-lg bg-transparent" />

        <div className="absolute bottom-0 left-12 translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A]">
            <User className="h-8 w-8 text-black" />
          </div>
        </div>
      </div>

      <div className="px-12 pt-16">
        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold">
            {partner?.firstName + " " + partner?.lastName}
          </h2>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Pencil className="h-2 w-2" />
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        </div>
        <p className="mt-1 flex items-center gap-1 text-gray-400">
          <Building className="mr-0.5 h-4 w-4" />
          {partner?.companyName}
        </p>
      </div>
    </div>
  );
};
