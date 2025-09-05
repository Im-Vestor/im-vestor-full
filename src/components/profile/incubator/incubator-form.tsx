import { zodResolver } from '@hookform/resolvers/zod';
import { type Area, type Offer, type Incubator } from '@prisma/client';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Checkbox } from '~/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import MultipleSelector, { type Option } from '~/components/ui/multiple-select';
import { PhoneInput } from '~/components/ui/phone-input';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { renderPhotoUpload } from '../entrepreneur/entrepreneur-form';
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
import { Trash2Icon } from 'lucide-react';

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

const incubatorFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email('Invalid email address'),
  logo: z.string().optional(),
  phone: z.string().optional(),
  openingDate: z.date().optional(),
  startupsIncubated: z.number().optional(),
  startupsInIncubator: z.number().optional(),
  brochureUrl: z.string().optional(),
  acceptStartupsOutsideRegion: z.boolean().optional(),
  // -----
  areas: z.array(optionSchema).optional(),
  offers: z.array(optionSchema).optional(),
  // ------
  linkedinUrl: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  // ----
  ownerName: z.string().optional(),
  ownerEmail: z.string().email('Invalid email address').optional(),
  ownerPhone: z.string().optional(),
  ownerRole: z.string().optional(),
  // ----
  associatedIncubators: z.string().optional(),
  associatedUniversities: z.string().optional(),
  activePrograms: z.string().optional(),
  // ----
  countryId: z.string().optional(),
  stateId: z.string().optional(),
});

interface IncubatorFormProps {
  incubator: (Incubator & { areas: Area[]; offers: Offer[] }) | null | undefined;
  onCancel: () => void;
}

export const IncubatorForm = ({ incubator, onCancel }: IncubatorFormProps) => {
  const utils = api.useUtils();

  const [areasOptions, setAreasOptions] = useState<Option[]>([]);
  const [offersOptions, setOffersOptions] = useState<Option[]>([]);
  const [country, setCountry] = useState<string>(incubator?.countryId?.toString() ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: areas, isLoading: isLoadingAreas } = api.area.getAll.useQuery();
  const { data: offers, isLoading: isLoadingOffers } = api.offer.getAll.useQuery();
  const { data: countries, isLoading: isLoadingCountries } = api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } = api.country.getStates.useQuery(
    {
      countryId: country,
    },
    {
      enabled: !!country,
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

  const { mutate: updateIncubator, isPending: isUpdatingIncubator } =
    api.incubator.update.useMutation({
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        void utils.incubator.getByUserId.invalidate();
        onCancel();
      },
      onError: error => {
        toast.error('Failed to update profile. Please try again.');
        console.error('Update error:', error);
      },
    });

  const form = useForm<z.infer<typeof incubatorFormSchema>>({
    resolver: zodResolver(incubatorFormSchema),
    defaultValues: {
      name: incubator?.name ?? '',
      bio: incubator?.bio ?? '',
      description: incubator?.description ?? '',
      website: incubator?.website ?? '',
      email: incubator?.email ?? '',
      logo: incubator?.logo ?? '',
      phone: incubator?.phone ?? '',
      countryId: incubator?.countryId?.toString() ?? '',
      stateId: incubator?.stateId?.toString() ?? '',
      openingDate: incubator?.openingDate ? new Date(incubator.openingDate) : undefined,
      startupsIncubated: incubator?.startupsIncubated ?? 0,
      startupsInIncubator: incubator?.startupsInIncubator ?? 0,
      brochureUrl: incubator?.brochureUrl ?? '',
      acceptStartupsOutsideRegion: incubator?.acceptStartupsOutsideRegion ?? false,
      areas:
        incubator?.areas?.map(area => ({
          value: area.id.toString(),
          label: area.name,
        })) ?? [],
      offers:
        incubator?.offers?.map(offer => ({
          value: offer.id.toString(),
          label: offer.name,
        })) ?? [],
      linkedinUrl: incubator?.linkedinUrl ?? '',
      facebook: incubator?.facebook ?? '',
      instagram: incubator?.instagram ?? '',
      twitter: incubator?.twitter ?? '',
      ownerName: incubator?.ownerName ?? '',
      ownerEmail: incubator?.ownerEmail ?? '',
      ownerPhone: incubator?.ownerPhone ?? '',
      ownerRole: incubator?.ownerRole ?? '',
      associatedIncubators: incubator?.associatedIncubators ?? '',
      associatedUniversities: incubator?.associatedUniversities ?? '',
      activePrograms: incubator?.activePrograms ?? '',
    },
  });

  useEffect(() => {
    if (areas && areas.length > 0) {
      setAreasOptions(
        areas.map(area => ({
          value: area.id.toString(),
          label: area.name,
        }))
      );
    }
  }, [areas]);

  useEffect(() => {
    if (offers && offers.length > 0) {
      setOffersOptions(offers.map(offer => ({ value: offer.id.toString(), label: offer.name })));
    }
  }, [offers]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data =>
          updateIncubator({
            ...data,
            areas: data.areas?.map(area => Number(area.value)) ?? [],
            offers: data.offers?.map(offer => Number(offer.value)) ?? [],
            countryId: Number(data.countryId) ?? '',
            stateId: Number(data.stateId) ?? '',
          })
        )}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        <div className="flex flex-col items-start gap-4 ml-6 pt-12">
          {renderPhotoUpload(
            incubator?.id ?? '',
            incubator?.logo ?? null,
            form.getValues('logo') ?? null,
            isUploadingPhoto,
            setIsUploadingPhoto,
            (photo: string) => form.setValue('logo', photo)
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Name*</Label>
                <FormControl>
                  <Input placeholder="Y Combinator" {...field} disabled={isUpdatingIncubator} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Email*</Label>
                <FormControl>
                  <Input
                    placeholder="ycombinator@gmail.com"
                    {...field}
                    disabled={isUpdatingIncubator}
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
            name="website"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Website</Label>
                <FormControl>
                  <Input
                    placeholder="https://www.ycombinator.com"
                    value={value ?? ''}
                    onChange={e => onChange(e.target.value)}
                    {...fieldProps}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Phone</Label>
                <FormControl>
                  <PhoneInput {...field} placeholder="999 999 999" disabled={isUpdatingIncubator} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="countryId"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Country</Label>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => {
                      field.onChange(value);
                      setCountry(value);
                      form.setValue('stateId', '');
                    }}
                    disabled={isLoadingCountries}
                  >
                    <SelectTrigger disabled={isUpdatingIncubator}>
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
            name="stateId"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">State</Label>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value: string) => field.onChange(value)}
                    disabled={
                      isUpdatingIncubator || !form.getValues('countryId') || isLoadingStates
                    }
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
          {areasOptions.length > 0 && (
            <FormField
              control={form.control}
              name="areas"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-normal text-neutral-200">Interested Areas</Label>
                  <FormControl>
                    <MultipleSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isUpdatingIncubator || isLoadingAreas}
                      defaultOptions={areasOptions}
                      placeholder="Select areas"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No results found.
                        </p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {offersOptions.length > 0 && (
            <FormField
              control={form.control}
              name="offers"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-normal text-neutral-200">Offers</Label>
                  <FormControl>
                    <MultipleSelector
                      {...field}
                      defaultOptions={offersOptions}
                      disabled={isUpdatingIncubator || isLoadingOffers}
                      placeholder="Select offers"
                      emptyIndicator={
                        <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                          No results found.
                        </p>
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startupsIncubated"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Startups Incubated</Label>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter amount in USD"
                    {...field}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || !isNaN(Number(value))) {
                        field.onChange(Number(value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startupsInIncubator"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Startups in Incubator</Label>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Enter amount in USD"
                    {...field}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || !isNaN(Number(value))) {
                        field.onChange(Number(value));
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="openingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <Label className="font-normal text-neutral-200">Opening Date</Label>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full border-none pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Select date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto border-none p-0" align="start">
                      <Calendar
                        mode="single"
                        captionLayout="dropdown"
                        showOutsideDays={false}
                        selected={field.value}
                        onSelect={field.onChange}
                        fromYear={1930}
                        toYear={2025}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brochureUrl"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Brochure URL</Label>
                <FormControl>
                  <Input
                    placeholder="https://www.ycombinator.com/brochure.pdf"
                    {...field}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Socials */}
        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-4">
          <FormField
            control={form.control}
            name="linkedinUrl"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">LinkedIn URL</Label>
                <FormControl>
                  <Input
                    placeholder="https://www.linkedin.com/company/ycombinator"
                    {...field}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Facebook</Label>
                <FormControl>
                  <Input
                    placeholder="https://www.facebook.com/ycombinator"
                    {...field}
                    disabled={isUpdatingIncubator}
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
                  <Input placeholder="@ycombinator" {...field} disabled={isUpdatingIncubator} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="twitter"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Twitter</Label>
                <FormControl>
                  <Input placeholder="@ycombinator" {...field} disabled={isUpdatingIncubator} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6">
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Bio</Label>
                <FormControl>
                  <Textarea
                    placeholder="We are a venture capital firm that invests in early-stage startups..."
                    {...field}
                    disabled={isUpdatingIncubator}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Description</Label>
                <FormControl>
                  <Textarea
                    placeholder="We are a venture capital firm that invests in early-stage startups..."
                    {...field}
                    disabled={isUpdatingIncubator}
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
            name="acceptStartupsOutsideRegion"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <Label className="font-normal text-neutral-200">
                  Accept Startups Outside Region
                </Label>
                <FormControl className="flex items-center gap-2">
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
          <FormField
            control={form.control}
            name="associatedIncubators"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Associated Incubators</Label>
                <FormControl>
                  <Input
                    placeholder="Y Combinator, Techstars, 500 Startups"
                    {...field}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="associatedUniversities"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Associated Universities</Label>
                <FormControl>
                  <Input
                    placeholder="NYU, Stanford, MIT"
                    {...field}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="activePrograms"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Active Programs</Label>
                <FormControl>
                  <Input
                    placeholder="We have a program for startups in the US and Europe"
                    {...field}
                    disabled={isUpdatingIncubator}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 flex justify-end gap-4 pb-8 pt-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="flex items-center gap-2 mr-auto">
                <Trash2Icon className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers. You will lose access to all your projects and
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
          <Button variant="secondary" disabled={isUpdatingIncubator} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingIncubator}>
            {isUpdatingIncubator ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
