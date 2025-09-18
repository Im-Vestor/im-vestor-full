import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { api } from '~/utils/api';
import { toast } from 'sonner';
import { Input } from './ui/input';
import { useUser } from '@clerk/nextjs';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UpdateEmailButton() {
  const [isUpdateEmailModalOpen, setIsUpdateEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const { user } = useUser();
  const { mutate: sendUpdateEmailEmail, isPending: isSendingEmail } =
    api.user.sendUpdateEmailEmail.useMutation({
      onSuccess: () => {
        toast.success('Email sent successfully!');
        setIsUpdateEmailModalOpen(false);
        setNewEmail('');
      },
      onError: () => {
        toast.error('Failed to send email!');
        setIsUpdateEmailModalOpen(false);
        setNewEmail('');
      },
    });

  return (
    <Dialog open={isUpdateEmailModalOpen} onOpenChange={setIsUpdateEmailModalOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Mail className="h-2 w-2" />
          Update Email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Email</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Enter the new email address you want to update. An confirmation email will be sent to the
          new email address.
          <br />
          <br />
          Old email:{' '}
          <span className="font-bold text-white">{user?.emailAddresses?.[0]?.emailAddress}</span>
        </DialogDescription>
        <Input
          type="email"
          placeholder="New Email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
        />
        <DialogFooter>
          <Button
            variant="secondary"
            disabled={isSendingEmail}
            onClick={() => setIsUpdateEmailModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={isSendingEmail || newEmail.length === 0 || !emailRegex.test(newEmail)}
            onClick={() => {
              sendUpdateEmailEmail({ email: newEmail });
            }}
          >
            {isSendingEmail ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
