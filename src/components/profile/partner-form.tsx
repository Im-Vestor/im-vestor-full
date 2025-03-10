import { zodResolver } from "@hookform/resolvers/zod";
import { type Partner } from "@prisma/client";
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
import { api } from "~/utils/api";

const partnerFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  companyName: z.string().min(1, "Company name is required"),
  mobileFone: z.string().min(1, "Mobile phone is required"),
});

interface PartnerFormProps {
  partner: Partner | null | undefined;
  onCancel: () => void;
}

export const PartnerForm = ({ partner, onCancel }: PartnerFormProps) => {
  const utils = api.useUtils();

  const { mutate: updatePartner, isPending: isUpdatingPartner } =
    api.partner.update.useMutation({
      onSuccess: () => {
        toast.success("Profile updated successfully!");
        void utils.partner.getByUserId.invalidate();
        onCancel();
      },
      onError: (error) => {
        toast.error("Failed to update profile. Please try again.");
        console.error("Update error:", error);
      },
    });

  const form = useForm<z.infer<typeof partnerFormSchema>>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      firstName: partner?.firstName ?? "",
      lastName: partner?.lastName ?? "",
      companyName: partner?.companyName ?? "",
      mobileFone: partner?.mobileFone ?? "",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => updatePartner({ ...data }))}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-[#242630]"
      >
        <div className="mx-6 grid grid-cols-1 gap-4 pt-12 md:grid-cols-2">
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
                    disabled={isUpdatingPartner}
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
                    disabled={isUpdatingPartner}
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
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">
                  Fiscal Code*
                </Label>
                <FormControl>
                  <Input
                    placeholder="01234567890"
                    {...field}
                    disabled={isUpdatingPartner}
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
                    disabled={isUpdatingPartner}
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
            disabled={isUpdatingPartner}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingPartner}>
            {isUpdatingPartner ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
