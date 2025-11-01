import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
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

const formSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    mobileFone: z.string().min(1, 'Mobile phone is required'),
    referralToken: z.string().optional(),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
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
      acceptTerms: false,
    },
  });

  const { mutateAsync: registerPartner, isPending: isRegistering } = api.partner.create.useMutation(
    {
      onSuccess: () => {
        toast.success(t('accountCreatedSuccessfully'));
        void router.push('/login');
      },
      onError: error => {
        toast.error(t('failedToCreateAccount') + ' ' + error.message);
        console.error('Registration error:', error);
      },
    }
  );

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
              disabled={isRegistering || !form.formState.isValid}
              onClick={async () => {
                if (step === 2) {
                  await registerPartner(form.getValues());
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === 3
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
