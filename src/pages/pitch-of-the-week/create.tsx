import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import { MediaUpload } from '~/components/ui/media-upload';
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

const pitchFormSchema = z.object({
  description: z.string().max(150, 'Description must be at most 150 characters').optional(),
  image: z.string().min(1, 'Image is required'),
  video: z.string().optional(),
  date1: z.date({ required_error: 'First date is required' }),
  date2: z.date({ required_error: 'Second date is required' }),
  projectId: z.string().optional(),
});

type PitchFormValues = z.infer<typeof pitchFormSchema>;

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours!, minutes!, 0, 0);
  return result;
}

export default function CreatePitch() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [time1, setTime1] = useState('18:00');
  const [time2, setTime2] = useState('18:00');

  const isFromCheckout = router.query.checkout === 'success';
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);

  const { data: userData, isLoading: isLoadingUser } = api.user.getUser.useQuery(undefined, {
    enabled: isLoaded && !!user,
    refetchInterval: waitingForWebhook ? 2000 : false,
  });

  const { data: entrepreneurData } = api.entrepreneur.getByUserId.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  const { mutateAsync: createPitch, isPending: isCreating } = api.pitch.create.useMutation({
    onSuccess: () => {
      toast.success('Pitch agendado com sucesso!');
      void router.push('/public-pitch');
    },
    onError: error => {
      toast.error(error.message || 'Falha ao agendar o pitch');
    },
  });

  const form = useForm<PitchFormValues>({
    resolver: zodResolver(pitchFormSchema),
    defaultValues: {
      description: '',
      image: '',
      video: '',
    },
  });

  const hasTickets = (userData?.availablePublicPitchTickets ?? 0) > 0;
  const projects = entrepreneurData?.projects ?? [];

  // When coming from checkout, poll until the webhook processes the ticket
  useEffect(() => {
    if (isFromCheckout && !hasTickets && !isLoadingUser && userData) {
      setWaitingForWebhook(true);
    }
    if (hasTickets && waitingForWebhook) {
      setWaitingForWebhook(false);
      // Clean up the URL query param
      void router.replace('/pitch-of-the-week/create', undefined, { shallow: true });
    }
  }, [isFromCheckout, hasTickets, isLoadingUser, userData, waitingForWebhook, router]);

  const onSubmit = async (data: PitchFormValues) => {
    if (!hasTickets) {
      toast.error('Precisas de um Pitch Ticket para agendar um pitch.');
      return;
    }

    try {
      await createPitch({
        image: data.image,
        video: data.video || undefined,
        date1: data.date1,
        date2: data.date2,
        description: data.description || undefined,
        projectId: data.projectId || undefined,
      });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (!isLoaded || isLoadingUser || waitingForWebhook) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">
            {waitingForWebhook ? 'A processar o teu pagamento...' : 'A carregar...'}
          </p>
        </div>
      </main>
    );
  }

  if (!hasTickets) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Sem Pitch Tickets disponíveis</CardTitle>
              <CardDescription className="text-destructive/80">
                Precisas de um Pitch Ticket para agendar um pitch. Compra um na loja.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/shop')}>Ir à Loja</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />

      <div className="mt-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Agendar Pitch of the Week</h1>
          <p className="text-muted-foreground">
            Faz upload do teu teaser e agenda as sessões live do teu pitch.
            Tens {userData?.availablePublicPitchTickets} ticket(s) disponíveis.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Media Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Imagem Teaser (Obrigatória)
                    </CardTitle>
                    <CardDescription>
                      Upload de uma imagem para mostrar no feed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MediaUpload
                              currentMedia={field.value}
                              onUpload={url => field.onChange(url)}
                              onRemove={() => field.onChange('')}
                              isUploading={isUploading}
                              acceptedTypes="image"
                              maxSizeInMB={10}
                              userId={user?.id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="w-5 h-5" />
                      Vídeo Teaser (Opcional)
                    </CardTitle>
                    <CardDescription>
                      Upload de um vídeo curto (máx. 50MB).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="video"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <MediaUpload
                              currentMedia={field.value}
                              onUpload={url => field.onChange(url)}
                              onRemove={() => field.onChange('')}
                              isUploading={isUploading}
                              acceptedTypes="video"
                              maxSizeInMB={50}
                              userId={user?.id}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Pitch</CardTitle>
                    <CardDescription>
                      Define as datas e horas das sessões live.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição Curta (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreve brevemente o teu pitch..."
                              className="resize-none"
                              rows={3}
                              maxLength={150}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {projects.length > 0 && (
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Projeto (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleciona um projeto..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {projects.map(project => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid gap-4">
                      {/* Session 1 */}
                      <FormField
                        control={form.control}
                        name="date1"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Sessão 1 — Data e Hora</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP p')
                                    ) : (
                                      <span>Escolhe data e hora</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={date => {
                                    if (date) {
                                      field.onChange(combineDateAndTime(date, time1));
                                    }
                                  }}
                                  disabled={date => date < new Date()}
                                  initialFocus
                                />
                                <div className="border-t p-3">
                                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    Hora da sessão
                                  </label>
                                  <Input
                                    type="time"
                                    value={time1}
                                    onChange={e => {
                                      setTime1(e.target.value);
                                      if (field.value) {
                                        field.onChange(combineDateAndTime(field.value, e.target.value));
                                      }
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Session 2 */}
                      <FormField
                        control={form.control}
                        name="date2"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Sessão 2 — Data e Hora</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground'
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, 'PPP p')
                                    ) : (
                                      <span>Escolhe data e hora</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={date => {
                                    if (date) {
                                      field.onChange(combineDateAndTime(date, time2));
                                    }
                                  }}
                                  disabled={date => date < new Date()}
                                  initialFocus
                                />
                                <div className="border-t p-3">
                                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                                    Hora da sessão
                                  </label>
                                  <Input
                                    type="time"
                                    value={time2}
                                    onChange={e => {
                                      setTime2(e.target.value);
                                      if (field.value) {
                                        field.onChange(combineDateAndTime(field.value, e.target.value));
                                      }
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" disabled={isCreating || isUploading}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A agendar...
                    </>
                  ) : (
                    'Agendar Pitch'
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
