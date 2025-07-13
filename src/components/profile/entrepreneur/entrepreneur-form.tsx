import { zodResolver } from '@hookform/resolvers/zod';
import { type Entrepreneur } from '@prisma/client';
import { ImageIcon, Plus, PlusIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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

const entrepreneurFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  companyRole: z.string().min(1, 'Role is required'),
  companyName: z.string().min(1, 'Company name is required'),
  fiscalCode: z.string().min(1, 'Fiscal code is required'),
  mobileFone: z.string().min(1, 'Mobile phone is required'),
  about: z
    .string()
    .min(12, 'About me must be at least 12 characters')
    .refine(
      value => {
        // Regex to detect URLs including:
        // - http://example.com, https://example.com
        // - www.example.com
        // - ftp://example.com
        // - example.com, subdomain.example.com
        const urlRegex = /(?:https?:\/\/|www\.|ftp:\/\/|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/gi;
        return !urlRegex.test(value);
      },
      {
        message: 'URLs are not allowed in About me section',
      }
    ),
  photo: z.string().optional(),
  banner: z.string().optional(),
  personalPitchUrl: z.string().optional(),
});

interface EntrepreneurFormProps {
  entrepreneur: Entrepreneur | null | undefined;
  onCancel: () => void;
}

export const EntrepreneurForm = ({ entrepreneur, onCancel }: EntrepreneurFormProps) => {
  const utils = api.useUtils();

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [country, setCountry] = useState<string>(entrepreneur?.countryId?.toString() ?? '');

  const { data: countries, isLoading: isLoadingCountries } = api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } = api.country.getStates.useQuery(
    {
      countryId: country,
    },
    {
      enabled: !!country,
    }
  );

  const { mutate: updateEntrepreneur, isPending: isUpdatingEntrepreneur } =
    api.entrepreneur.update.useMutation({
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        void utils.entrepreneur.getByUserId.invalidate();
        onCancel();
      },
      onError: error => {
        toast.error('Failed to update profile. Please try again.');
        console.error('Update error:', error);
      },
    });

  const form = useForm<z.infer<typeof entrepreneurFormSchema>>({
    resolver: zodResolver(entrepreneurFormSchema),
    defaultValues: {
      firstName: entrepreneur?.firstName ?? '',
      lastName: entrepreneur?.lastName ?? '',
      country: entrepreneur?.countryId?.toString() ?? '',
      state: entrepreneur?.stateId?.toString() ?? '',
      companyRole: entrepreneur?.companyRole ?? '',
      companyName: entrepreneur?.companyName ?? '',
      fiscalCode: entrepreneur?.fiscalCode ?? '',
      mobileFone: entrepreneur?.mobileFone ?? '',
      about: entrepreneur?.about ?? '',
      photo: entrepreneur?.photo ?? '',
      banner: entrepreneur?.banner ?? '',
      personalPitchUrl: entrepreneur?.personalPitchUrl ?? '',
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
        toast.error('Video file must be under 50MB'); // 50MB
        return;
      }

      setIsUploadingVideo(true);

      const videoUrl = await sendImageToBackend(file, entrepreneur?.id ?? '');

      setIsUploadingVideo(false);

      if (videoUrl) {
        form.setValue('personalPitchUrl', videoUrl);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => updateEntrepreneur({ ...data }))}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        {renderBannerUpload(
          entrepreneur?.id ?? '',
          entrepreneur?.banner ?? null,
          form.getValues('banner') ?? null,
          isUploadingBanner,
          setIsUploadingBanner,
          (banner: string) => form.setValue('banner', banner)
        )}
        <div className="flex flex-col items-start gap-4 ml-6">
          <Label className="font-normal text-neutral-200">Profile Picture</Label>
          {renderPhotoUpload(
            entrepreneur?.id ?? '',
            entrepreneur?.photo ?? null,
            form.getValues('photo') ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue('photo', photo)
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">First Name*</Label>
                <FormControl>
                  <Input placeholder="John" {...field} disabled={isUpdatingEntrepreneur} />
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
                  <Input placeholder="Doe" {...field} disabled={isUpdatingEntrepreneur} />
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
                <Label className="font-normal text-neutral-200">Mobile Phone*</Label>
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
                    <SelectTrigger disabled={isUpdatingEntrepreneur}>
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
                    disabled={!form.getValues('country') || isLoadingCountries || isLoadingStates}
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

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Company Name*</Label>
                <FormControl>
                  <Input placeholder="Acme Inc." {...field} disabled={isUpdatingEntrepreneur} />
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
                <Label className="font-normal text-neutral-200">Role*</Label>
                <FormControl>
                  <Input placeholder="CEO" {...field} disabled={isUpdatingEntrepreneur} />
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
                        disabled={isUpdatingEntrepreneur}
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
                        disabled={isUpdatingEntrepreneur}
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

        <div className="mx-6 flex justify-end gap-4 pb-8 pt-8">
          <Button variant="secondary" disabled={isUpdatingEntrepreneur} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingEntrepreneur}>
            {isUpdatingEntrepreneur ? 'Saving...' : 'Save Changes'}
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
  setBanner: (banner: string) => void
) => {
  return (
    <div className="relative mb-8 w-full">
      <div className="h-48 w-full overflow-hidden rounded-t-lg bg-[#282B37]">
        {(bannerUploaded ?? currentBanner) && (
          <Image
            src={bannerUploaded ?? currentBanner ?? ''}
            alt="Profile Banner"
            layout="fill"
            objectFit="cover"
            className="rounded-t-md transition-opacity duration-300 hover:opacity-75"
          />
        )}
      </div>
      <div className="absolute right-4 top-4">
        <label htmlFor="banner-upload" className="cursor-pointer">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-background px-4 py-2 text-sm text-white hover:bg-background/90">
            <ImageIcon className="h-4 w-4" />
            {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
          </div>
          <input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;

              setIsUploadingBanner(true);

              const imageUrl = await sendImageToBackend(file, userId);

              setBanner(imageUrl ?? '');

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
  setPhoto: (photo: string) => void
) => {
  return (
    <div className="relative">
      <label htmlFor="photo-upload">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] hover:cursor-pointer hover:opacity-75">
          {(photoUploaded ?? currentPhoto) ? (
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

export { renderBannerUpload, renderPhotoUpload };
