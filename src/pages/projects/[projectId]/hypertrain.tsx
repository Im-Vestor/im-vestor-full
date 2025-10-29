'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Train, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { MediaUpload } from '~/components/ui/media-upload';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';

const hypertrainFormSchema = z.object({
  description: z
    .string()
    .min(1, 'Description is required')
    .max(150, 'Description must be at most 150 characters'),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video', 'none']).default('none'),
});

type HypertrainFormValues = z.infer<typeof hypertrainFormSchema>;

export default function HypertrainEdit() {
  const router = useRouter();
  const { user } = useUser();
  const { projectId } = router.query;

  const [isUploading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';

  // Get the hypertrain item if it exists
  const { data: hypertrainItem, isLoading: isLoadingHypertrain } =
    api.hypertrain.getHyperTrainItemByExternalId.useQuery(projectId as string, {
      enabled: !!projectId,
    });

  const { mutateAsync: updateHypertrainItem, isPending: isUpdating } =
    api.hypertrain.updateHyperTrainItem.useMutation({
      onSuccess: () => {
        toast.success('Hypertrain ticket updated successfully!');
        setSubmittedSuccessfully(true);
        setTimeout(() => {
          void router.push(`/projects/${String(projectId)}`);
        }, 2000);
      },
      onError: error => {
        toast.error(error.message || 'Failed to update hypertrain ticket. Please try again.');
        console.error('Update error:', error);
      },
    });

  const form = useForm<HypertrainFormValues>({
    resolver: zodResolver(hypertrainFormSchema),
    defaultValues: {
      description: '',
      mediaUrl: '',
      mediaType: 'none',
    },
  });

  const watchedDescription = form.watch('description');

  useEffect(() => {
    setCharacterCount(watchedDescription?.length || 0);
  }, [watchedDescription]);

  useEffect(() => {
    if (hypertrainItem) {
      form.reset({
        description: hypertrainItem.description ?? '',
        mediaUrl: hypertrainItem.image ?? '',
        mediaType: hypertrainItem.image ? 'image' : 'none',
      });
    }
  }, [hypertrainItem, form]);

  // Redirect if not an entrepreneur
  useEffect(() => {
    if (user && !isEntrepreneur) {
      toast.error('Only entrepreneurs can edit hypertrain tickets');
      router.push('/');
    }
  }, [user, isEntrepreneur, router]);

  // Redirect if no projectId
  useEffect(() => {
    if (router.isReady && !projectId) {
      toast.error('No project specified');
      void router.push('/profile');
    }
  }, [router, projectId]);

  const handleMediaRemove = () => {
    form.setValue('mediaUrl', '');
    form.setValue('mediaType', 'none');
    toast.success('Media removed');
  };

  const onSubmit = async (data: HypertrainFormValues) => {
    if (!projectId) {
      toast.error('No project specified');
      return;
    }

    try {
      await updateHypertrainItem({
        externalId: projectId as string,
        description: data.description,
        image: data.mediaUrl ?? undefined,
      });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  if (isLoadingHypertrain) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading hypertrain ticket...</p>
        </div>
      </main>
    );
  }

  if (!hypertrainItem) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Hypertrain Ticket Not Found</CardTitle>
              <CardDescription>
                This project doesn&apos;t have an active hypertrain ticket. Please purchase one
                first.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/shop')}>Go to Shop</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (submittedSuccessfully) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32 flex flex-col items-center justify-center gap-6">
          <CheckCircle2 className="h-24 w-24 text-green-500" />
          <h1 className="text-3xl font-bold text-center">Successfully Updated!</h1>
          <p className="text-muted-foreground text-center">
            Your hypertrain ticket has been updated. Redirecting...
          </p>
        </div>
      </main>
    );
  }

  const isFormValid = form.formState.isValid && !isUploading;
  const charactersRemaining = 150 - characterCount;
  const isNearLimit = characterCount > 120;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />

      <div className="mt-12 space-y-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Edit Hypertrain Ticket</h1>
          <p className="text-muted-foreground">
            Customize your project&apos;s appearance in the Hypertrain feed
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription>
                  Write a short, compelling description for your project (max 150 characters)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Description Field */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Textarea
                            placeholder="e.g., Revolutionary AI solution for sustainable energy management..."
                            className="resize-none"
                            rows={4}
                            maxLength={150}
                            {...field}
                          />
                          <div className="flex justify-between text-sm">
                            <FormMessage />
                            <span
                              className={`font-medium ${
                                isNearLimit
                                  ? 'text-yellow-600 dark:text-yellow-500'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {characterCount} / 150 characters
                              {charactersRemaining < 30 && ` (${charactersRemaining} remaining)`}
                            </span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Make it catchy and informative to attract investors
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media Upload</CardTitle>
                <CardDescription>
                  Upload an image or video to showcase your project (optional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="mediaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <MediaUpload
                          currentMedia={field.value}
                          onUpload={url => {
                            field.onChange(url);
                          }}
                          onRemove={handleMediaRemove}
                          isUploading={isUploading}
                          acceptedTypes="both"
                          maxSizeInMB={50}
                          disabled={isUpdating}
                          userId={user?.id}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Supported formats: JPG, PNG, GIF, WebP for images | MP4, WebM, MOV for
                        videos (Max 50MB)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                {form.watch('mediaType') !== 'none' && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-sm font-medium">
                      Media Type:{' '}
                      <span className="capitalize text-primary">{form.watch('mediaType')}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Ready to update?</p>
                    <p className="text-sm text-muted-foreground">
                      Your changes will be visible immediately in the Hypertrain feed
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isFormValid || isUpdating}
                      className="min-w-[140px]"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Train className="mr-2 h-4 w-4" />
                          Update Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </main>
  );
}
