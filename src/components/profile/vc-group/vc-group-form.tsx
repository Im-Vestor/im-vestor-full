import { zodResolver } from '@hookform/resolvers/zod';
import { type Area, type ProjectStage, type VcGroup } from '@prisma/client';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';

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
import { PROJECT_STAGES } from '~/data/project-stages';
import { cn } from '~/lib/utils';
import { api } from '~/utils/api';
import { renderPhotoUpload } from '../entrepreneur/entrepreneur-form';

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
  disable: z.boolean().optional(),
});

const vcGroupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email('Invalid email address'),
  logo: z.string().optional(),
  phone: z.string().optional(),
  openingDate: z.date().optional(),
  managedCapital: z.number().optional(),
  averageInvestmentSize: z.number().optional(),
  brochureUrl: z.string().optional(),
  investmentPolicy: z.string().optional(),
  interestedAreas: z.array(optionSchema).optional(),
  stages: z.array(optionSchema).optional(),
  linkedinUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  principalStartups: z.string().optional(),
  principalExits: z.string().optional(),
  countryId: z.string().optional(),
  stateId: z.string().optional(),
});

interface VcGroupFormProps {
  vcGroup: (VcGroup & { interestedAreas: Area[] }) | null | undefined;
  onCancel: () => void;
}

export const VcGroupForm = ({ vcGroup, onCancel }: VcGroupFormProps) => {
  const utils = api.useUtils();

  const [areasOptions, setAreasOptions] = useState<Option[]>([]);
  const [stagesOptions, setStagesOptions] = useState<Option[]>([]);
  const [country, setCountry] = useState<string>(vcGroup?.countryId?.toString() ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const { data: areas, isLoading: isLoadingAreas } = api.area.getAll.useQuery();
  const { data: countries, isLoading: isLoadingCountries } = api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } = api.country.getStates.useQuery(
    {
      countryId: country,
    },
    {
      enabled: !!country,
    }
  );

  const { mutate: updateVcGroup, isPending: isUpdatingVcGroup } = api.vcGroup.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      void utils.vcGroup.getByUserId.invalidate();
      onCancel();
    },
    onError: error => {
      toast.error('Failed to update profile. Please try again.');
      console.error('Update error:', error);
    },
  });

  const form = useForm<z.infer<typeof vcGroupFormSchema>>({
    resolver: zodResolver(vcGroupFormSchema),
    defaultValues: {
      name: vcGroup?.name ?? '',
      bio: vcGroup?.bio ?? '',
      description: vcGroup?.description ?? '',
      website: vcGroup?.website ?? '',
      email: vcGroup?.email ?? '',
      logo: vcGroup?.logo ?? '',
      phone: vcGroup?.phone ?? '',
      countryId: vcGroup?.countryId?.toString() ?? '',
      stateId: vcGroup?.stateId?.toString() ?? '',
      openingDate: vcGroup?.openingDate ? new Date(vcGroup.openingDate) : undefined,
      managedCapital: vcGroup?.managedCapital ?? 0,
      averageInvestmentSize: vcGroup?.averageInvestmentSize ?? 0,
      brochureUrl: vcGroup?.brochureUrl ?? '',
      investmentPolicy: vcGroup?.investmentPolicy ?? '',
      interestedAreas:
        vcGroup?.interestedAreas?.map(area => ({
          value: area.id.toString(),
          label: area.name,
        })) ?? [],
      stages:
        vcGroup?.stages?.map(stage => ({
          value: stage,
          label: PROJECT_STAGES.find(s => s.value === stage)?.label ?? stage,
        })) ?? [],
      linkedinUrl: vcGroup?.linkedinUrl ?? '',
      youtubeUrl: vcGroup?.youtubeUrl ?? '',
      instagram: vcGroup?.instagram ?? '',
      twitter: vcGroup?.twitter ?? '',
      principalStartups: vcGroup?.principalStartups ?? '',
      principalExits: vcGroup?.principalExits ?? '',
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
    setStagesOptions(PROJECT_STAGES.map(stage => ({ value: stage.value, label: stage.label })));
  }, []);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data =>
          updateVcGroup({
            ...data,
            interestedAreas: data.interestedAreas?.map(area => Number(area.value)) ?? [],
            stages: (data.stages?.map(stage => stage.value) as ProjectStage[]) ?? [],
            countryId: Number(data.countryId) ?? '',
            stateId: Number(data.stateId) ?? '',
          })
        )}
        className="space-y-4 rounded-lg border-2 border-white/10 bg-card"
      >
        <div className="flex flex-col items-start gap-4 ml-6 pt-12">
          {renderPhotoUpload(
            vcGroup?.id ?? '',
            vcGroup?.logo ?? null,
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
                  <Input placeholder="Y Combinator" {...field} disabled={isUpdatingVcGroup} />
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
                    disabled={isUpdatingVcGroup}
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
                    disabled={isUpdatingVcGroup}
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
                  <PhoneInput {...field} placeholder="999 999 999" disabled={isUpdatingVcGroup} />
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
                    <SelectTrigger disabled={isUpdatingVcGroup}>
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
                    disabled={isUpdatingVcGroup || !form.getValues('countryId') || isLoadingStates}
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
              name="interestedAreas"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-normal text-neutral-200">Interested Areas</Label>
                  <FormControl>
                    <MultipleSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isUpdatingVcGroup || isLoadingAreas}
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

          <FormField
            control={form.control}
            name="stages"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Project Stages</Label>
                <FormControl>
                  <MultipleSelector
                    {...field}
                    defaultOptions={stagesOptions}
                    placeholder="Select stages"
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
        </div>

        <div className="mx-6 grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
          <FormField
            control={form.control}
            name="managedCapital"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Managed Capital</Label>
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
            name="averageInvestmentSize"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Average Investment Size</Label>
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
                    disabled={isUpdatingVcGroup}
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
                    disabled={isUpdatingVcGroup}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtubeUrl"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Youtube URL</Label>
                <FormControl>
                  <Input
                    placeholder="https://www.youtube.com/channel/UC_9-kyTW8ZkZNDHQJ6FgpwQ"
                    {...field}
                    disabled={isUpdatingVcGroup}
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
                  <Input placeholder="@ycombinator" {...field} disabled={isUpdatingVcGroup} />
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
                  <Input placeholder="@ycombinator" {...field} disabled={isUpdatingVcGroup} />
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
                    disabled={isUpdatingVcGroup}
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
                    disabled={isUpdatingVcGroup}
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
            name="investmentPolicy"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Investment Policy</Label>
                <FormControl>
                  <Textarea
                    placeholder="We focus on early-stage startups in the US and Europe..."
                    {...field}
                    disabled={isUpdatingVcGroup}
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
            name="principalStartups"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Principal Startups</Label>
                <FormControl>
                  <Textarea
                    placeholder="We invested in Stripe, Airbnb, and Facebook"
                    {...field}
                    disabled={isUpdatingVcGroup}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="principalExits"
            render={({ field }) => (
              <FormItem>
                <Label className="font-normal text-neutral-200">Principal Exits</Label>
                <FormControl>
                  <Textarea
                    placeholder="We exited from Stripe, Airbnb, and Facebook"
                    {...field}
                    disabled={isUpdatingVcGroup}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mx-6 flex justify-end gap-4 pb-8 pt-8">
          <Button variant="secondary" disabled={isUpdatingVcGroup} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdatingVcGroup}>
            {isUpdatingVcGroup ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
