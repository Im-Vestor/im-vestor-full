import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Building2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { LanguageSwitcher } from '~/components/ui/language-switcher';
import { PhoneInput } from '~/components/ui/phone-input';
import { useTranslation } from '~/hooks/use-translation';
import { api } from '~/utils/api';
import { sendImageToBackend } from '~/utils/file';

const formSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .regex(/^\p{L}{2,}$/u, 'Invalid name'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .regex(/^\p{L}{2,}$/u, 'Invalid name'),
    companyName: z.string().min(1, 'Company name is required').min(2, 'Too short'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z.string().min(1, 'Password is required').min(8, 'Min 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
    mobileFone: z.string().min(1, 'Phone is required'),
    referralToken: z.string().optional(),
    website: z
      .union([z.string().url('Invalid URL'), z.literal('')])
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    linkedinUrl: z
      .union([z.string().url('Invalid URL'), z.literal('')])
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    facebook: z
      .union([z.string().url('Invalid URL'), z.literal('')])
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    instagram: z
      .union([z.string().url('Invalid URL'), z.literal('')])
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    twitter: z
      .union([z.string().url('Invalid URL'), z.literal('')])
      .optional()
      .transform(val => (val === '' ? undefined : val)),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'Accept terms to continue',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export default function SignupPartner() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const t = useTranslation();
  const { isLoaded: isAuthLoaded, isSignedIn } = useUser();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (isAuthLoaded && isSignedIn) {
      void router.replace('/home');
    }
  }, [isAuthLoaded, isSignedIn, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      mobileFone: '',
      companyName: '',
      referralToken: (router.query.referralToken as string) ?? '',
      website: '',
      linkedinUrl: '',
      facebook: '',
      instagram: '',
      twitter: '',
      acceptTerms: false,
    },
  });

  const { mutateAsync: registerPartner, isPending: isRegistering } = api.partner.create.useMutation(
    {
      onSuccess: async (partner) => {
        toast.success(t('accountCreatedSuccessfully'));

        // Upload logo if provided (async, won't block redirect)
        // Note: Logo will be saved after user logs in and updates profile
        if (logoFile && partner?.userId) {
          setIsUploadingLogo(true);
          sendImageToBackend(logoFile, partner.userId)
            .then(() => {
              toast.info('Logo uploaded! Update your profile after logging in to save it.');
            })
            .catch((error) => {
              console.error('Failed to upload logo:', error);
              toast.info('You can add your logo in your profile after logging in.');
            })
            .finally(() => {
              setIsUploadingLogo(false);
            });
        }

        void router.push('/login');
      },
      onError: error => {
        toast.error(t('failedToCreateAccount') + ' ' + error.message);
        console.error('Registration error:', error);
      },
    }
  );
  const validateSignup = api.validation.validateSignUp.useMutation();

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="mt-4 w-[80%]">
        <Header />
      </div>

      <div
        className={`rounded-2xl backdrop-blur-md border-4 border-white/10 bg-background bg-opacity-30 p-6 md:max-w-[40rem]`}
      >
        <div className="flex justify-between items-center">
          <button
            type="button"
            className="flex items-center gap-2 hover:opacity-75"
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            <ArrowLeft className="h-4 w-4" /> {t('back')}
          </button>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </div>
        <Form {...form}>
          <form className="mt-8">
            {step === 1 && (
              <div className="md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  {t('yourAccountAs')} <br />
                  <span className="text-[#E5CD82]">{t('partner')}</span>
                </h2>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">{t('firstName')}*</Label>
                        <FormControl>
                          <Input {...field} placeholder="Your name" disabled={isRegistering} />
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
                        <Label className="font-normal text-neutral-200">{t('lastName')}*</Label>
                        <FormControl>
                          <Input {...field} placeholder="Your last name" disabled={isRegistering} />
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
                        <Label className="font-normal text-neutral-200">{t('mobilePhone')}*</Label>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            placeholder="Your mobile phone"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">{t('companyName')}*</Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your company name"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Company Logo Upload */}
                  <div className="space-y-2">
                    <Label className="font-normal text-neutral-200">Company Logo (Optional)</Label>
                    <div className="relative">
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                          {isUploadingLogo ? (
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                          ) : logoPreview ? (
                            <Image
                              src={logoPreview}
                              alt="Company Logo Preview"
                              width={96}
                              height={96}
                              className="h-24 w-24 rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="h-8 w-8 text-white/70" />
                          )}
                        </div>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setLogoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                          disabled={isRegistering || isUploadingLogo}
                        />
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 hover:bg-red-600 transition-colors"
                          disabled={isRegistering || isUploadingLogo}
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-white/60">Upload your company logo (optional)</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">Website</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://example.com"
                            disabled={isRegistering}
                          />
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
                        <Label className="font-normal text-neutral-200">{t('email')}*</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="Your email"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">{t('password')}*</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          {t('confirmPassword')}*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={isRegistering}
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
                        <Label className="font-normal text-neutral-200">LinkedIn (Optional)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://linkedin.com/company/example"
                            disabled={isRegistering}
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
                        <Label className="font-normal text-neutral-200">Facebook (Optional)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://facebook.com/example"
                            disabled={isRegistering}
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
                        <Label className="font-normal text-neutral-200">Instagram (Optional)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://instagram.com/example"
                            disabled={isRegistering}
                          />
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
                        <Label className="font-normal text-neutral-200">Twitter (Optional)</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://twitter.com/example"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label className="font-normal text-sm text-neutral-200 cursor-pointer">
                            {t('iAcceptThe')}&nbsp;
                            <Link
                              href="/terms"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              {t('termsAndConditions')}
                            </Link>
                          </Label>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="min-w-[20rem] md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  {t('wereYouReferred')} <br />
                  <span className="text-[#E5CD82]">{t('referralToken')}</span>
                </h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="referralToken"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          {t('referralTokenOptional')}
                        </Label>
                        <FormControl>
                          <Input {...field} placeholder="6U5T4V00" disabled={isRegistering} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <Button
              type={'button'}
              className="mt-12 w-full"
              disabled={isRegistering || isUploadingLogo}
              onClick={async () => {
                // Step 1: validate form fields before advancing
                if (step === 1) {
                  const isValid = await form.trigger([
                    'firstName',
                    'lastName',
                    'email',
                    'password',
                    'confirmPassword',
                    'mobileFone',
                    'companyName',
                    'acceptTerms',
                  ]);

                  if (!isValid) {
                    return;
                  }

                  // Pre-validate with server (Clerk/email/phone/password) before advancing
                  const values = form.getValues();
                  const result = await validateSignup.mutateAsync({
                    email: values.email,
                    password: values.password,
                    mobileFone: values.mobileFone,
                  });
                  if (!result.valid) {
                    if (result.fieldErrors.email) {
                      form.setError('email', { type: 'manual', message: result.fieldErrors.email });
                    }
                    if (result.fieldErrors.password) {
                      form.setError('password', { type: 'manual', message: result.fieldErrors.password });
                    }
                    if (result.fieldErrors.mobileFone) {
                      form.setError('mobileFone', { type: 'manual', message: result.fieldErrors.mobileFone });
                    }
                    return;
                  }
                }

                if (step === 2) {
                  await registerPartner(form.getValues());
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === 2
                ? t('takeYourPass')
                : form.formState.isValid
                  ? t('continue')
                  : t('pleaseFieldFields')}{' '}
              <ArrowRight className="ml-2" />
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
