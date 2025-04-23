import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '~/utils/api';
import { toast } from 'sonner';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'; // Import Dialog parts
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form';
import { Loader2 } from 'lucide-react';

const supportSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
});

type SupportFormData = z.infer<typeof supportSchema>;

interface SupportModalProps {
  onClose: () => void; // Function to close the modal from the parent
}

export function SupportModal({ onClose }: SupportModalProps) {
  const form = useForm<SupportFormData>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      subject: '',
      message: '',
    },
  });

  const createTicketMutation = api.support.create.useMutation({
    onSuccess: () => {
      toast.success('Support ticket submitted successfully!');
      form.reset();
      onClose(); // Close modal on success
    },
    onError: (error) => {
      toast.error(`Failed to submit ticket: ${error.message}`);
    },
  });

  function onSubmit(data: SupportFormData) {
    createTicketMutation.mutate(data);
  }

  return (
    // DialogContent provides the modal structure
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Contact Support</DialogTitle>
        <DialogDescription>Need help or have feedback? Let us know.</DialogDescription>
      </DialogHeader>
      {/* Form implementation remains largely the same */}
      <Form {...form}>
        {/* Add py-4 for spacing between header/footer and form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Enter the subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your issue or feedback"
                    className="resize-none"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Footer contains action buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTicketMutation.isPending}>
              {createTicketMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Submit Ticket
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}