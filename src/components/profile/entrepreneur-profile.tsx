import {
  type Country,
  type State,
  type Entrepreneur,
  type Project,
} from "@prisma/client";
import {
  ArrowRight,
  Building2,
  CircleUserRound,
  Loader2,
  MapPin,
  Pencil,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/utils/api";
import { EntrepreneurForm } from "./entrepreneur-form";

export const EntrepreneurProfile = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { data: entrepreneur, isPending: isLoading } =
    api.entrepreneur.getByUserId.useQuery();

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isEditing) {
    return (
      <EntrepreneurForm
        entrepreneur={entrepreneur}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="rounded-lg border border-white/10 px-12 pb-20 pt-6">
      <div className="flex items-center space-x-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB]">
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
      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-3xl font-semibold">
          {entrepreneur?.firstName + " " + entrepreneur?.lastName}
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
      <p className="mt-3 text-lg text-gray-400">
        {entrepreneur?.companyRole ?? "Entrepreneur"}
        {entrepreneur?.companyName ? `, ${entrepreneur.companyName}` : ""}
      </p>
      <p className="mt-1 flex items-center gap-1 text-gray-400">
        <MapPin className="mr-0.5 h-4 w-4" />
        {entrepreneur?.state && entrepreneur?.country
          ? `${entrepreneur.state.name}, ${entrepreneur.country.name}`
          : "Not specified"}
      </p>
      <h3 className="mt-12 font-semibold">About me</h3>
      <p className="mt-3 text-gray-400">
        {entrepreneur?.about ?? "No description"}
      </p>
      <h3 className="mt-12 font-semibold">Company</h3>
      {entrepreneur?.projects && entrepreneur?.projects.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {entrepreneur?.projects.map((project) => (
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
      <Button
        className="mt-4 md:w-1/3"
        onClick={() => router.push("/create-company")}
      >
        Add your Company
        <ArrowRight className="ml-2" />
      </Button>
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
    <div className="rounded-xl border-2 border-white/10 bg-[#1E202A] p-6">
      <div className="flex justify-between">
        <div className="flex gap-6">
          <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-lg">
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
                <Building2 className="size-6 text-neutral-200" />
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{project.name}</h3>
              </div>
              {project.state?.name && project.country?.name && (
                <span className="text-white/70">
                  {project.state?.name}, {project.country?.name}
                </span>
              )}
              <p>{project.quickSolution}</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="my-6 border-white/10" />
      <div className="flex items-center gap-2">
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
            <User className="size-4 text-neutral-200" />
          </div>
        )}
        <p className="text-sm font-light">
          Founded by
          <span className="text-[#EFD687]"> {profileData.firstName}</span>
        </p>
        <div className="ml-auto flex space-x-2">
          {Array.from({
            length: project.investorSlots
              ? project.investorSlots > 5
                ? 5
                : project.investorSlots
              : 0,
          }).map((_, i) => (
            <CircleUserRound key={i} color="#EFD687" className="h-4 w-4" />
          ))}
          {project.investorSlots && project.investorSlots > 5 && (
            <p className="text-sm font-light text-white/50">
              (+{project.investorSlots - 5})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
