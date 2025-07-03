import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Currency, ProjectStage } from '@prisma/client';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, CalendarIcon, Loader2, PlusIcon, Trash2Icon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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
import { sendImageToBackend } from '~/utils/file';

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  logo: z.string().optional(),
  quickSolution: z.string().min(10, 'Quick solution must be at least 10 characters'),
  website: z.string().optional(),
  foundationDate: z.date(),
  sectorId: z.string().min(1, 'Company sector is required'),
  stage: z.nativeEnum(ProjectStage),
  country: z.string().min(1, 'Country is required'),
  state: z.string().min(1, 'State is required'),
  about: z
    .string()
    .min(10, 'About must be at least 10 characters')
    .max(280, 'About must be at most 280 characters'),
  startInvestment: z.number().min(1, 'Requested founds is required'),
  investorSlots: z.number().min(1, 'Investors slots is required'),
  annualRevenue: z.number().min(1, 'Annual revenue is required'),
  investmentGoal: z.number().min(1, 'Investment goal is required'),
  equity: z.number().optional(),
  currency: z.nativeEnum(Currency, {
    required_error: 'Currency is required',
  }),
  photo1: z.string().optional(),
  photo2: z.string().optional(),
  photo3: z.string().optional(),
  photo4: z.string().optional(),
  videoUrl: z.string().optional(),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional()
    .default([]),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function EditCompany() {
  const router = useRouter();
  const { companyId } = router.query;
  const { user } = useUser();

  const [country, setCountry] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState<Record<string, boolean>>({});
  const [uploadingVideo, setUploadingVideo] = useState(false);

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

  const { data: project } = api.project.getById.useQuery(
    { id: companyId as string },
    {
      enabled: !!companyId,
    }
  );

  const { mutateAsync: updateCompany, isPending } = api.project.update.useMutation({
    onSuccess: () => {
      toast.success('Company updated successfully!');
      void router.push('/profile');
    },
    onError: error => {
      toast.error('Failed to update company. Please try again.');
      console.error(
        'Update company error:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    },
  });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      logo: '',
      quickSolution: '',
      website: '',
      foundationDate: new Date(),
      sectorId: '',
      stage: ProjectStage.PRE_SEED,
      country: '',
      state: '',
      about: '',
      startInvestment: 0,
      investorSlots: 0,
      annualRevenue: 0,
      investmentGoal: 0,
      equity: 0,
      currency: Currency.USD,
      photo1: '',
      photo2: '',
      photo3: '',
      photo4: '',
      videoUrl: '',
      faqs: [{ question: '', answer: '' }],
    },
  });

  useEffect(() => {
    if (project && project.country && project.state) {
      setCountry(project.country.id.toString());
      form.reset({
        name: project.name,
        logo: project.logo ?? undefined,
        quickSolution: project.quickSolution ?? '',
        website: project.website ?? '',
        foundationDate: project.foundationDate ?? new Date(),
        sectorId: project.sector.id,
        stage: project.stage ?? ProjectStage.PRE_SEED,
        country: project.country.id.toString(),
        state: project.state.id.toString(),
        about: project.about ?? '',
        startInvestment: project.startInvestment ?? 0,
        investorSlots: project.investorSlots ?? 0,
        annualRevenue: project.annualRevenue ?? 0,
        investmentGoal: project.investmentGoal ?? 0,
        equity: project.equity ?? 0,
        currency: project.currency ?? Currency.USD,
        photo1: project.photo1 ?? '',
        photo2: project.photo2 ?? '',
        photo3: project.photo3 ?? '',
        photo4: project.photo4 ?? '',
        videoUrl: project.videoUrl ?? '',
        faqs: project.faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
        })),
      });
      setIsLoading(false);
    }
  }, [project, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      setIsUploading(true);

      const imageUrl = await sendImageToBackend(file, user?.id ?? '');

      setIsUploading(false);

      form.setValue('logo', imageUrl ?? '');
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    photoField: 'photo1' | 'photo2' | 'photo3' | 'photo4'
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setUploadingPhotos(prev => ({ ...prev, [photoField]: true }));

      const imageUrl = await sendImageToBackend(file, user?.id ?? '');

      setUploadingPhotos(prev => ({ ...prev, [photoField]: false }));

      if (imageUrl) {
        form.setValue(photoField, imageUrl);
      }
    }
  };

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

      setUploadingVideo(true);

      const videoUrl = await sendImageToBackend(file, user?.id ?? '');

      setUploadingVideo(false);

      if (videoUrl) {
        form.setValue('videoUrl', videoUrl);
      }
    }
  };

  async function onSubmit(data: CompanyFormValues) {
    if (!companyId) return;

    await updateCompany({
      id: companyId as string,
      ...data,
    });
  }

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6 rounded-xl border-2 border-white/10 bg-card md:px-16 px-4 py-8">
              <button
                type="button"
                className="flex items-center gap-2 hover:opacity-75"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h1 className="text-lg font-bold">Edit Company</h1>
              <FormField
                control={form.control}
                name="logo"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative h-24 w-24 hover:opacity-75">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            {...field}
                          />
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#D1D5DC]">
                            {value ? (
                              <Image
                                src={value}
                                alt="Logo preview"
                                className="h-full w-full rounded-md object-cover"
                                width={100}
                                height={100}
                              />
                            ) : isUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-black" />
                            ) : (
                              <PlusIcon className="h-6 w-6 text-black" />
                            )}
                          </div>
                        </div>
                        {value && (
                          <button
                            type="button"
                            onClick={() => onChange(undefined)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Company Name*</Label>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quickSolution"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Quick Solution*</Label>
                    <FormControl>
                      <Textarea placeholder="Describe your solution" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Website (optional)</Label>
                    <FormControl>
                      <Input
                        className="w-full md:w-1/2"
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="foundationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <Label className="font-normal text-neutral-200">Foundation Date*</Label>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full md:w-1/2 border-none pl-3 text-left font-normal',
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sectorId"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Company Sector*</Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) => {
                            field.onChange(value);
                          }}
                          disabled={isLoadingAreas}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas?.map(area => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.name}
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
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Company Stage*</Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_STAGES.map(stage => (
                              <SelectItem key={stage.value} value={stage.value}>
                                {stage.label}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
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
                          disabled={
                            !form.getValues('country') || isLoadingCountries || isLoadingStates
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
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">About Company*</Label>
                    <FormControl>
                      <Textarea placeholder="Tell us about your company" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <h3 className="mt-2 text-lg">Financial Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startInvestment"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Requested founds*</Label>
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
                  name="investorSlots"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Investors Slots*</Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter number of slots"
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Annual Revenue*</Label>
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
                  name="equity"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Equity (%)</Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Enter equity percentage"
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">Currency*</Label>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Currency.USD}>$ USD</SelectItem>
                            <SelectItem value={Currency.EUR}>€ EUR</SelectItem>
                            <SelectItem value={Currency.BRL}>R$ BRL</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <h3 className="mt-2 text-lg">Company Photos</h3>
              <p className="text-sm text-white/60">
                Upload up to 4 photos of your company (max 2MB each)
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(['photo1', 'photo2', 'photo3', 'photo4'] as const).map((photoField, index) => (
                  <FormField
                    key={photoField}
                    control={form.control}
                    name={photoField}
                    render={({ field: { onChange, value, ...field } }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="relative h-32 w-full hover:opacity-75 border-2 border-dashed border-white/20 rounded-lg">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => handlePhotoUpload(e, photoField)}
                                className="absolute inset-0 cursor-pointer opacity-0"
                                {...field}
                              />
                              <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/5">
                                {value ? (
                                  <Image
                                    src={value}
                                    alt={`Photo ${index + 1} preview`}
                                    className="h-full w-full rounded-lg object-cover"
                                    width={200}
                                    height={128}
                                  />
                                ) : uploadingPhotos[photoField] ? (
                                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                                ) : (
                                  <div className="text-center">
                                    <PlusIcon className="h-6 w-6 text-white/50 mx-auto mb-2" />
                                    <p className="text-xs text-white/50">Photo {index + 1}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {value && (
                              <button
                                type="button"
                                onClick={() => onChange('')}
                                className="text-red-500 hover:text-red-600 text-sm"
                              >
                                Remove photo
                              </button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
              <h3 className="mt-2 text-lg">Company Video</h3>
              <p className="text-sm text-white/60">
                Upload a video of your company (max 50MB, recommended 1 minute duration)
              </p>
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative h-40 w-full hover:opacity-75 border-2 border-dashed border-white/20 rounded-lg">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            {...field}
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
                            ) : uploadingVideo ? (
                              <Loader2 className="h-6 w-6 animate-spin text-white" />
                            ) : (
                              <div className="text-center">
                                <PlusIcon className="h-8 w-8 text-white/50 mx-auto mb-2" />
                                <p className="text-sm text-white/50">Upload Company Video</p>
                                <p className="text-xs text-white/30">
                                  Max 50MB, 1 minute recommended
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {value && (
                          <button
                            type="button"
                            onClick={() => onChange('')}
                            className="text-red-500 hover:text-red-600 text-sm"
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
              <h3 className="mt-2 text-lg">Company FAQ</h3>
              <div className="space-y-4">
                {form.watch('faqs')?.map((_, index) => (
                  <div key={index}>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`faqs.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="w-11/12">
                              <FormControl>
                                <Input placeholder={`Question ${index + 1}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentFaq = form.getValues('faqs') ?? [];
                            form.setValue(
                              'faqs',
                              currentFaq.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`faqs.${index}.answer`}
                        render={({ field }) => (
                          <FormItem className="w-11/12">
                            <FormControl>
                              <Input placeholder={`Answer ${index + 1}`} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentFaq = form.getValues('faqs') ?? [];
                    form.setValue('faqs', [...currentFaq, { question: '', answer: '' }]);
                  }}
                >
                  <PlusIcon className="h-4 w-4" /> Add Question
                </Button>
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button className="w-1/3" type="submit" disabled={isPending}>
                  {isPending ? (
                    'Updating...'
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Update</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
