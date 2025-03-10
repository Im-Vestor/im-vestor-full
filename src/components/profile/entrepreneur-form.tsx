import { zodResolver } from "@hookform/resolvers/zod";
import { type Entrepreneur } from "@prisma/client";
import { ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/utils/api";
import { sendImageToBackend } from "~/utils/file";

const entrepreneurFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  companyRole: z.string().min(1, "Role is required"),
  companyName: z.string().min(1, "Company name is required"),
  fiscalCode: z.string().min(1, "Fiscal code is required"),
  mobileFone: z.string().min(1, "Mobile phone is required"),
  about: z.string().optional(),
  photo: z.string().optional(),
  banner: z.string().optional(),
});

interface EntrepreneurFormProps {
  entrepreneur: Entrepreneur | null | undefined;
  onCancel: () => void;
}

export const EntrepreneurForm = ({
  entrepreneur,
  onCancel,
}: EntrepreneurFormProps) => {
  const utils = api.useUtils();

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [country, setCountry] = useState<string>(entrepreneur?.countryId?.toString() ?? "");

  const { data: countries, isLoading: isLoadingCountries } =
    api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } =
    api.country.getStates.useQuery({
      countryId: country,
    });

  const { mutate: updateEntrepreneur, isPending: isUpdatingEntrepreneur } =
    api.entrepreneur.update.useMutation({
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        void utils.entrepreneur.getByUserId.invalidate();
        onCancel();
      },
      onError: (error) => {
        toast.error("Failed to update profile. Please try again.");
        console.error("Update error:", error);
      },
    });

  const form = useForm<z.infer<typeof entrepreneurFormSchema>>({
    resolver: zodResolver(entrepreneurFormSchema),
    defaultValues: {
      firstName: entrepreneur?.firstName ?? "",
      lastName: entrepreneur?.lastName ?? "",
      country: entrepreneur?.countryId?.toString() ?? "",
      state: entrepreneur?.stateId?.toString() ?? "",
      companyRole: entrepreneur?.companyRole ?? "",
      companyName: entrepreneur?.companyName ?? "",
      fiscalCode: entrepreneur?.fiscalCode ?? "",
      mobileFone: entrepreneur?.mobileFone ?? "",
      about: entrepreneur?.about ?? "",
      photo: entrepreneur?.photo ?? "",
      banner: entrepreneur?.banner ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => updateEntrepreneur({ ...data }))}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-[#242630]"
      >
        {renderBannerUpload(
          entrepreneur?.id ?? "",
          entrepreneur?.banner ?? null,
          form.getValues("banner") ?? null,
          isUploadingBanner,
          setIsUploadingBanner,
          (banner: string) => form.setValue("banner", banner),
        )}
        <div className="flex items-center justify-center">
          {renderPhotoUpload(
            entrepreneur?.id ?? "",
            entrepreneur?.photo ?? null,
            form.getValues("photo") ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue("photo", photo),
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  First Name*
                </Label>
                <FormControl>
                  <Input
                    placeholder="John"
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Last Name*
                </Label>
                <FormControl>
                  <Input
                    placeholder="Doe"
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fiscalCode"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Fiscal Code*
                </Label>
                <FormControl>
                  <Input
                    placeholder="01234567890"
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobileFone"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Mobile Phone*
                </Label>
                <FormControl>
                  <PhoneInput
                    {...field}
                    placeholder="999 999 999"
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Country*
                </Label>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => {
                      field.onChange(value);
                      setCountry(value);
                      form.setValue("state", "");
                    }}
                    disabled={isLoadingCountries}
                  >
                    <SelectTrigger disabled={isUpdatingEntrepreneur}>
                      <SelectValue placeholder="Country*" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map((country) => (
                        <SelectItem
                          key={country.id}
                          value={country.id.toString()}
                        >
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  State*
                </Label>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => field.onChange(value)}
                    disabled={
                      !form.getValues("country") ||
                      isLoadingCountries ||
                      isLoadingStates
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State*" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map((state) => (
                        <SelectItem
                          key={state.id}
                          value={state.id.toString()}
                        >
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Company Name*
                </Label>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="companyRole"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Role*
                </Label>
                <FormControl>
                  <Input
                    placeholder="CEO"
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6">
          <FormField
            control={form.control}
            name="about"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  About me
                </Label>
                <FormControl>
                  <Textarea
                    placeholder="I'm a startup founder..."
                    {...field}
                    disabled={isUpdatingEntrepreneur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 flex justify-end gap-4 pb-8 pt-8">
          <Button
            variant="secondary"
            disabled={isUpdatingEntrepreneur}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingEntrepreneur}>
            {isUpdatingEntrepreneur ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const renderBannerUpload = (
  userId: string,
  currentBanner: string | null,
  bannerUploaded: string | null,
  isUploadingBanner: boolean,
  setIsUploadingBanner: (isUploading: boolean) => void,
  setBanner: (banner: string) => void,
) => {
  return (
    <div className="relative mb-8 w-full">
      <div className="h-48 w-full overflow-hidden rounded-t-lg bg-[#282B37]">
        {(bannerUploaded ?? currentBanner) && (
          <Image
            src={bannerUploaded ?? currentBanner ?? ""}
            alt="Profile Banner"
            layout="fill"
            objectFit="cover"
            className="rounded-t-md transition-opacity duration-300 hover:opacity-75"
          />
        )}
      </div>
      <div className="absolute right-4 top-4">
        <label htmlFor="banner-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-[#282A37] px-4 py-2 text-sm text-white hover:bg-[#282A37]/90">
            <ImageIcon className="h-4 w-4" />
            {isUploadingBanner ? "Uploading..." : "Change Banner"}
          </div>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              setIsUploadingBanner(true);

              const imageUrl = await sendImageToBackend(file, userId);

              setBanner(imageUrl ?? "");

              setIsUploadingBanner(false);
            }}
            disabled={isUploadingBanner}
          />
        </label>
      </div>
    </div>
  );
};

const renderPhotoUpload = (
  userId: string,
  currentPhoto: string | null,
  photoUploaded: string | null,
  isUploadingPhoto: boolean,
  setIsUploadingPhoto: (isUploading: boolean) => void,
  setPhoto: (photo: string) => void,
) => {
  return (
    <div className="relative">
      <label htmlFor="photo-upload">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] hover:cursor-pointer hover:opacity-75">
          {(photoUploaded ?? currentPhoto) ? (
            <Image
              src={photoUploaded ?? currentPhoto ?? ""}
              alt="Profile"
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <Plus className="h-8 w-8 text-black" />
          )}
        </div>

        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingPhoto(true);

            const imageUrl = await sendImageToBackend(file, userId);

            setPhoto(imageUrl ?? "");

            setIsUploadingPhoto(false);
          }}
          disabled={isUploadingPhoto}
        />
      </label>
    </div>
  );
};

export { renderBannerUpload, renderPhotoUpload };
