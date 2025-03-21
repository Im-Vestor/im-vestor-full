import { zodResolver } from "@hookform/resolvers/zod";
import { type Investor } from "@prisma/client";
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
import { renderBannerUpload, renderPhotoUpload } from "./entrepreneur-form";

const investorFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  mobileFone: z.string().min(1, "Mobile phone is required"),
  fiscalCode: z.string().min(1, "Fiscal code is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  about: z.string().optional(),
  photo: z.string().optional(),
  banner: z.string().optional(),
});

interface InvestorFormProps {
  investor: Investor | null | undefined;
  onCancel: () => void;
}

export const InvestorForm = ({ investor, onCancel }: InvestorFormProps) => {
  const utils = api.useUtils();

  const [country, setCountry] = useState<string>(
    investor?.countryId?.toString() ?? "",
  );
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: countries, isLoading: isLoadingCountries } =
    api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } =
    api.country.getStates.useQuery({
      countryId: country,
    }, {
      enabled: !!country,
    });

  const { mutate: updateInvestor, isPending: isUpdatingInvestor } =
    api.investor.update.useMutation({
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        void utils.investor.getByUserId.invalidate();
        onCancel();
      },
      onError: (error) => {
        toast.error("Failed to update profile. Please try again.");
        console.error("Update error:", error);
      },
    });

  const form = useForm<z.infer<typeof investorFormSchema>>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      firstName: investor?.firstName ?? "",
      lastName: investor?.lastName ?? "",
      country: investor?.countryId?.toString() ?? "",
      state: investor?.stateId?.toString() ?? "",
      fiscalCode: investor?.fiscalCode ?? "",
      mobileFone: investor?.mobileFone ?? "",
      about: investor?.about ?? "",
      photo: investor?.photo ?? "",
      banner: investor?.banner ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          updateInvestor({
            ...data,
          }),
        )}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        {renderBannerUpload(
          investor?.id ?? "",
          investor?.banner ?? null,
          form.getValues("banner") ?? null,
          isUploadingBanner,
          setIsUploadingBanner,
          (banner: string) => form.setValue("banner", banner),
        )}
        <div className="flex flex-col items-start gap-4 ml-6">
          <Label className="font-normal text-neutral-200">Profile Picture</Label>
          {renderPhotoUpload(
            investor?.id ?? "",
            investor?.photo ?? null,
            form.getValues("photo") ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue("photo", photo),
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-8 md:grid-cols-2">
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
                    disabled={isUpdatingInvestor}
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
                    disabled={isUpdatingInvestor}
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
                    disabled={isUpdatingInvestor}
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
                    disabled={isUpdatingInvestor}
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
                <Label className="font-normal text-neutral-200">Country*</Label>
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
                    <SelectTrigger disabled={isUpdatingInvestor}>
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
                <Label className="font-normal text-neutral-200">State*</Label>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => field.onChange(value)}
                    disabled={
                      isUpdatingInvestor ||
                      !form.getValues("country") ||
                      isLoadingStates
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State*" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map((state) => (
                        <SelectItem key={state.id} value={state.id.toString()}>
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

        <div className="mx-6">
          <FormField
            control={form.control}
            name="about"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">About me*</Label>
                <FormControl>
                  <Textarea
                    placeholder="I'm a Venture Capitalist..."
                    {...field}
                    disabled={isUpdatingInvestor}
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
            disabled={isUpdatingInvestor}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingInvestor}>
            {isUpdatingInvestor ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
