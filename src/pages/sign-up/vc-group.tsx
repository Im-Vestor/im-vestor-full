import { zodResolver } from '@hookform/resolvers/zod';
import { type NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';
import { Header } from '~/components/header';
import { ArrowLeft } from 'lucide-react';
import { PhoneInput } from '~/components/ui/phone-input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

const vcGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  stateId: z.number().optional(),
  countryId: z.number().optional(),
  ownerName: z.string().min(1, 'Owner name is required'),
  ownerRole: z.string().min(1, 'Owner role is required'),
  ownerEmail: z.string().email('Invalid owner email'),
  ownerPhone: z.string().optional(),
});

type VcGroupFormData = z.infer<typeof vcGroupSchema>;

const VcGroupSignUp: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [country, setCountry] = useState<string>('');
  const { referralToken } = router.query;

  const form = useForm<VcGroupFormData>({
    resolver: zodResolver(vcGroupSchema),
  });

  const { data: countries, isLoading: isLoadingCountries } = api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } = api.country.getStates.useQuery(
    {
      countryId: country,
    },
    {
      enabled: !!country,
    }
  );

  const createVcGroup = api.vcGroup.create.useMutation({
    onSuccess: () => {
      toast.success('Your account has been created successfully.');
      void router.push('/login');
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: VcGroupFormData) => {
    try {
      setIsLoading(true);
      await createVcGroup.mutateAsync({
        ...data,
        referralToken: referralToken as string | undefined,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    form.setValue('countryId', parseInt(value));
    form.setValue('stateId', undefined);
  };

  const handleStateChange = (value: string) => {
    form.setValue('stateId', parseInt(value));
  };

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="mt-4 w-[80%]">
        <Header />
      </div>
      <div className="w-[80%] rounded-2xl border-4 border-white/10 bg-background bg-opacity-30 p-6 backdrop-blur-md md:w-[40%]">
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-75"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h2 className="my-8 text-center text-4xl font-semibold">
          Your account as <br />
          <span className="text-[#E5CD82]">VC Group</span>
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Company Name</Label>
                    <FormControl>
                      <Input {...field} placeholder="Sequoia Capital" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Bio</Label>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="We are a venture capital firm focused on technology and innovation..."
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
                    <Label className="font-normal text-neutral-200">Company Email</Label>
                    <FormControl>
                      <Input {...field} type="email" placeholder="contact@sequoiacap.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field: { onChange, ...field } }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">Company Phone</Label>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        onChange={value => onChange(value)}
                        placeholder="+1 650-854-3927"
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
                    <Label className="font-normal text-neutral-200">Password</Label>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Min. 8 characters" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-6">
                <h2 className="mb-4 text-xl font-semibold">Owner Information</h2>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">Owner Name</Label>
                        <FormControl>
                          <Input {...field} placeholder="Michael Moritz" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerRole"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">Owner Role</Label>
                        <FormControl>
                          <Input {...field} placeholder="Managing Partner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">Owner Email</Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="michael.moritz@sequoiacap.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field: { onChange, ...field } }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">Owner Phone</Label>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            onChange={value => onChange(value)}
                            placeholder="+1 650-123-4567"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
                <div>
                  <Label className="font-normal text-neutral-200">Country*</Label>
                  <Select
                    value={country}
                    onValueChange={handleCountryChange}
                    disabled={isLoadingCountries}
                  >
                    <SelectTrigger disabled={isLoadingCountries}>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries?.map(country => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-normal text-neutral-200">State*</Label>
                  <Select
                    value={form.getValues('stateId')?.toString()}
                    onValueChange={handleStateChange}
                    disabled={!country || isLoadingStates}
                  >
                    <SelectTrigger disabled={!country || isLoadingStates}>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states?.map(state => (
                        <SelectItem key={state.id} value={state.id.toString()}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default VcGroupSignUp;
