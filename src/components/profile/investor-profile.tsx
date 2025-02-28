import { Loader2, MapPin, Pencil, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { InvestorForm } from "./investor-form";

export const InvestorProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: investor, isPending: isLoading } = api.investor.getByUserId.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center mt-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (isEditing) {
    return (
      <InvestorForm 
        investor={investor} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <div className="rounded-lg border border-white/10 px-12 pb-20 pt-6">
      <div className="flex items-center space-x-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB]">
          {investor?.photo ? (
            <Image
              src={investor?.photo ?? ""}
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
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-3xl font-semibold">
          {investor?.firstName + " " + investor?.lastName}
        </h2>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </div>
      <p className="mt-1 flex items-center gap-1 text-gray-400">
        <MapPin className="mr-0.5 h-4 w-4" />
        {investor?.state && investor?.country
          ? `${investor.state.name}, ${investor.country.name}`
          : "Not specified"}
      </p>
      <h3 className="mt-12 font-semibold">About me</h3>
      <p className="mt-3 text-gray-400">
        {investor?.about ?? "No description"}
      </p>
      <h3 className="mt-12 font-semibold">Portfolio</h3>
      <p>TODO</p>
    </div>
  );
}; 