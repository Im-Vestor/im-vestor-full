import { zodResolver } from '@hookform/resolvers/zod';
import { type Partner } from '@prisma/client';
import { Building2, Loader2, Plus, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { PhoneInput } from '~/components/ui/phone-input';
import { api } from '~/utils/api';
import { sendImageToBackend } from '~/utils/file';

const partnerFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  companyName: z.string().min(1, 'Company name is required'),
  mobileFone: z.string().min(1, 'Mobile phone is required'),
  photo: z.string().optional(),
  companyLogoUrl: z.string().optional(),
  website: z
    .union([z.string().url('Invalid website URL'), z.literal('')])
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  linkedinUrl: z
    .union([z.string().url('Invalid LinkedIn URL'), z.literal('')])
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  facebook: z
    .union([z.string().url('Invalid Facebook URL'), z.literal('')])
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  instagram: z
    .union([z.string().url('Invalid Instagram URL'), z.literal('')])
    .optional()
    .transform(val => (val === '' ? undefined : val)),
  twitter: z
    .union([z.string().url('Invalid Twitter URL'), z.literal('')])
    .optional()
    .transform(val => (val === '' ? undefined : val)),
});

interface PartnerFormProps {
  partner: Partner | null | undefined;
  onCancel: () => void;
}

export const PartnerForm = ({ partner, onCancel }: PartnerFormProps) => {
  const utils = api.useUtils();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const { mutate: updatePartner, isPending: isUpdatingPartner } = api.partner.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      void utils.partner.getByUserId.invalidate();
      onCancel();
    },
    onError: error => {
      toast.error('Failed to update profile. Please try again.');
      console.error('Update error:', error);
    },
  });

  const { mutateAsync: deleteUser } = api.user.deleteUser.useMutation({
    onSuccess: () => {
      toast.success(
        'Confirmation email sent! Please check your email to complete account deletion.'
      );
    },
    onError: error => {
      toast.error('Failed to send confirmation email. Please try again.');
      console.error('Delete user error:', error);
    },
  });

  const form = useForm<z.infer<typeof partnerFormSchema>>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      firstName: partner?.firstName ?? '',
      lastName: partner?.lastName ?? '',
      companyName: partner?.companyName ?? '',
      mobileFone: partner?.mobileFone ?? '',
      photo: partner?.photo ?? undefined,
      companyLogoUrl: partner?.companyLogoUrl ?? undefined,
      website: partner?.website ?? '',
      linkedinUrl: partner?.linkedinUrl ?? '',
      facebook: partner?.facebook ?? '',
      instagram: partner?.instagram ?? '',
      twitter: partner?.twitter ?? '',
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => updatePartner({ ...data }))}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        <div className="flex flex-col items-start gap-4 ml-6 pt-12">
          <Label className="font-normal text-neutral-200">Profile Picture</Label>
          {renderPhotoUpload(
            partner?.id ?? '',
            partner?.photo ?? null,
            form.getValues('photo') ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue('photo', photo)
          )}
        </div>

        <div className="flex flex-col items-start gap-4 ml-6">
          <Label className="font-normal text-neutral-200">Company Logo</Label>
          {renderCompanyLogoUpload(
            partner?.id ?? '',
            partner?.companyLogoUrl ?? null,
            form.getValues('companyLogoUrl') ?? null,
            isUploadingLogo,
            setIsUploadingLogo,
            (logo: string) => form.setValue('companyLogoUrl', logo)
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">First Name*</Label>
                <FormControl>
                  <Input placeholder="John" {...field} disabled={isUpdatingPartner} />
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
                <Label className="font-normal text-neutral-200">Last Name*</Label>
                <FormControl>
                  <Input placeholder="Doe" {...field} disabled={isUpdatingPartner} />
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
                <Label className="font-normal text-neutral-200">Company Name*</Label>
                <FormControl>
                  <Input placeholder="Google" {...field} disabled={isUpdatingPartner} />
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
                <Label className="font-normal text-neutral-200">Mobile Phone*</Label>
                <FormControl>
                  <PhoneInput {...field} placeholder="999 999 999" disabled={isUpdatingPartner} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Website</Label>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
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
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">LinkedIn</Label>
                <FormControl>
                  <Input
                    placeholder="https://linkedin.com/company/example"
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
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Facebook</Label>
                <FormControl>
                  <Input
                    placeholder="https://facebook.com/example"
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
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Instagram</Label>
                <FormControl>
                  <Input
                    placeholder="https://instagram.com/example"
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
            name="twitter"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Twitter</Label>
                <FormControl>
                  <Input
                    placeholder="https://twitter.com/example"
                    {...field}
                    disabled={isUpdatingPartner}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 flex justify-between items-center pb-8 pt-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2Icon className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers. You will lose access to all your partnerships and
                  connections. An email will be sent to you with a link to delete your account. This
                  link will expire in 24 hours.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await deleteUser();
                  }}
                >
                  Send Deletion Link
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-4">
            <Button variant="secondary" disabled={isUpdatingPartner} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingPartner}>
              {isUpdatingPartner ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

const renderCompanyLogoUpload = (
  userId: string,
  currentLogo: string | null,
  logoUploaded: string | null,
  isUploadingLogo: boolean,
  setIsUploadingLogo: (isUploading: boolean) => void,
  setLogo: (logo: string) => void
) => {
  return (
    <div className="relative">
      <label htmlFor="logo-upload">
        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-[#D1D5DB] hover:cursor-pointer hover:opacity-75">
          {isUploadingLogo ? (
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          ) : (logoUploaded ?? currentLogo) ? (
            <Image
              src={logoUploaded ?? currentLogo ?? ''}
              alt="Company Logo"
              width={96}
              height={96}
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-black" />
          )}
        </div>

        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingLogo(true);

            const imageUrl = await sendImageToBackend(file, userId);

            setLogo(imageUrl ?? '');

            setIsUploadingLogo(false);
          }}
          disabled={isUploadingLogo}
        />
      </label>
    </div>
  );
};

const renderPhotoUpload = (
  userId: string,
  currentPhoto: string | null,
  photoUploaded: string | null,
  isUploadingPhoto: boolean,
  setIsUploadingPhoto: (isUploading: boolean) => void,
  setPhoto: (photo: string) => void
) => {
  return (
    <div className="relative">
      <label htmlFor="photo-upload">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] hover:cursor-pointer hover:opacity-75">
          {isUploadingPhoto ? (
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          ) : (photoUploaded ?? currentPhoto) ? (
            <Image
              src={photoUploaded ?? currentPhoto ?? ''}
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
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploadingPhoto(true);

            const imageUrl = await sendImageToBackend(file, userId);

            setPhoto(imageUrl ?? '');

            setIsUploadingPhoto(false);
          }}
          disabled={isUploadingPhoto}
        />
      </label>
    </div>
  );
};
