import { zodResolver } from '@hookform/resolvers/zod';
import { type Investor } from '@prisma/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Loader2, PlusIcon, Trash2Icon } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { sendImageToBackend } from '~/utils/file';
import { renderBannerUpload, renderPhotoUpload } from '../entrepreneur/entrepreneur-form';

const investorFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  mobileFone: z.string().min(1, 'Mobile phone is required'),
  fiscalCode: z.string().min(1, 'Fiscal code is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  about: z
    .string()
    .optional()
    .refine(
      value => {
        // Regex to detect URLs including:
        // - http://example.com, https://example.com
        // - www.example.com
        // - ftp://example.com
        // - example.com, subdomain.example.com
        const urlRegex = /(?:https?:\/\/|www\.|ftp:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/gi;
        return !urlRegex.test(value ?? '');
      },
      {
        message: 'URLs are not allowed in About me section',
      }
    ),
  photo: z.string().optional(),
  banner: z.string().optional(),
  personalPitchUrl: z.string().optional(),
});

interface InvestorFormProps {
  investor: Investor | null | undefined;
  onCancel: () => void;
}

export const InvestorForm = ({ investor, onCancel }: InvestorFormProps) => {
  const utils = api.useUtils();

  const [country, setCountry] = useState<string>(investor?.countryId?.toString() ?? '');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const { data: countries, isLoading: isLoadingCountries } = api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } = api.country.getStates.useQuery(
    {
      countryId: country,
    },
    {
      enabled: !!country,
    }
  );

  const { mutate: updateInvestor, isPending: isUpdatingInvestor } = api.investor.update.useMutation(
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        void utils.investor.getByUserId.invalidate();
        onCancel();
      },
      onError: error => {
        toast.error('Failed to update profile. Please try again.');
        console.error('Update error:', error);
      },
    }
  );

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

  const form = useForm<z.infer<typeof investorFormSchema>>({
    resolver: zodResolver(investorFormSchema),
    defaultValues: {
      firstName: investor?.firstName ?? '',
      lastName: investor?.lastName ?? '',
      country: investor?.countryId?.toString() ?? '',
      state: investor?.stateId?.toString() ?? '',
      fiscalCode: investor?.fiscalCode ?? '',
      mobileFone: investor?.mobileFone ?? '',
      about: investor?.about ?? '',
      photo: investor?.photo ?? '',
      banner: investor?.banner ?? '',
      personalPitchUrl: investor?.personalPitchUrl ?? '',
    },
  });

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }

      if (file.size > 1024 * 1024 * 50) {
        toast.error('Video file must be under 50MB');
        return;
      }

      setIsUploadingVideo(true);

      const videoUrl = await sendImageToBackend(file, investor?.id ?? '');

      setIsUploadingVideo(false);

      if (videoUrl) {
        form.setValue('personalPitchUrl', videoUrl);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data =>
          updateInvestor({
            ...data,
          })
        )}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        {renderBannerUpload(
          investor?.id ?? '',
          investor?.banner ?? null,
          form.getValues('banner') ?? null,
          isUploadingBanner,
          setIsUploadingBanner,
          (banner: string) => form.setValue('banner', banner)
        )}
        <div className="flex flex-col items-start gap-4 ml-6">
          <Label className="font-normal text-neutral-200">Profile Picture</Label>
          {renderPhotoUpload(
            investor?.id ?? '',
            investor?.photo ?? null,
            form.getValues('photo') ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue('photo', photo)
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
                  <Input placeholder="John" {...field} disabled={isUpdatingInvestor} />
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
                  <Input placeholder="Doe" {...field} disabled={isUpdatingInvestor} />
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
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Fiscal Code*</Label>
                <FormControl>
                  <Input
                    placeholder="01234567890"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    {...fieldProps}
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
                <Label className="font-normal text-neutral-200">Mobile Phone*</Label>
                <FormControl>
                  <PhoneInput {...field} placeholder="999 999 999" disabled={isUpdatingInvestor} />
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
                      form.setValue('state', '');
                    }}
                    disabled={isLoadingCountries}
                  >
                    <SelectTrigger disabled={isUpdatingInvestor}>
                      <SelectValue placeholder="Country*" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map(country => (
                        <SelectItem key={country.id} value={country.id.toString()}>
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
                    disabled={isUpdatingInvestor || !form.getValues('country') || isLoadingStates}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State*" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map(state => (
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

        <div className="mx-6">
          <FormField
            control={form.control}
            name="personalPitchUrl"
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Personal Pitch Video</Label>
                <p className="text-sm text-white/60 mb-2">
                  Upload a short video introducing yourself (max 50MB, 1 minute recommended)
                </p>
                <FormControl>
                  <div className="space-y-2">
                    <div className="relative h-40 w-full hover:opacity-75 border-2 border-dashed border-white/20 rounded-lg">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        {...field}
                        disabled={isUpdatingInvestor}
                      />
                      <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/5">
                        {value ? (
                          <div className="text-center">
                            <video
                              src={value}
                              className="h-32 w-auto rounded-lg mx-auto mb-2"
                              controls
                            />
                            <p className="text-xs text-white/70">Video uploaded</p>
                          </div>
                        ) : isUploadingVideo ? (
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        ) : (
                          <div className="text-center">
                            <PlusIcon className="h-8 w-8 text-white/50 mx-auto mb-2" />
                            <p className="text-sm text-white/50">Upload Personal Pitch Video</p>
                            <p className="text-xs text-white/30">Max 50MB, 1 minute recommended</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {value && (
                      <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-red-500 hover:text-red-600 text-sm"
                        disabled={isUpdatingInvestor}
                      >
                        Remove video
                      </button>
                    )}
                  </div>
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
                  all your data from our servers. You will lose access to all your investment
                  opportunities and connections. An email will be sent to you with a link to delete
                  your account. This link will expire in 24 hours.
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
            <Button variant="secondary" disabled={isUpdatingInvestor} onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingInvestor}>
              {isUpdatingInvestor ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
