import { zodResolver } from '@hookform/resolvers/zod';
import { Flag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { PhoneInput } from '~/components/ui/phone-input';
import { api } from '~/utils/api';
import QRCode from 'react-qr-code';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export default function EventosPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  const { mutateAsync: createPotentialUser, isPending } = api.potentialUser.create.useMutation({
    onSuccess: () => {
      toast.success('Thank you for your interest!');
      form.reset();
    },
    onError: (error: { message: string; }) => {
      toast.error('Failed to save your information. ' + error.message);
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await createPotentialUser({
      ...data,
      event: 'Sample Event', // You can make this dynamic based on the event
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="w-full fixed top-0 left-0 py-2 bg-card border-b border-white/10 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-center text-sm gap-2">
          <Flag className="w-3 h-3 text-yellow-500" />
          <p className="text-white tracking-wider opacity-70">
            Inscreva-se agora e aproveite 1 ano grátis.
          </p>
        </div>
      </div>
      <div className="mt-12 w-[80%]">
        <Header />
      </div>

      <div className="mt-8 w-full max-w-md rounded-2xl border-4 border-white/10 bg-[#181920] bg-opacity-30 p-8 backdrop-blur-md">
        <div className="mb-8 flex flex-col items-center">
          <QRCode
            value={typeof window !== 'undefined' ? window.location.href : ''}
            size={200}
            bgColor="transparent"
            fgColor="#E5CD82"
            level="L"
          />
        </div>

        <h1 className="mb-8 text-center text-4xl font-semibold text-[#E5CD82]">
          Join Our Network
        </h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-normal text-neutral-200">Name*</Label>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" disabled={isPending} />
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
                    <Input {...field} placeholder="john@example.com" disabled={isPending} />
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
                  <Label className="font-normal text-neutral-200">Phone (Optional)</Label>
                  <FormControl>
                    <PhoneInput {...field} placeholder="999 999 999" disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Saving...' : 'Submit'}
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
