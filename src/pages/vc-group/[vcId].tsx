import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Loader2, MapPin, MessageCircle, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Header } from '~/components/header';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { api } from '~/utils/api';

export default function VcGroupDetails() {
  const router = useRouter();
  const { user } = useUser();
  const { vcId } = router.query;
  const [isPokeDialogOpen, setIsPokeDialogOpen] = useState(false);
  const [pokeMessage, setPokeMessage] = useState('Hello, I am interested in connecting with you!');

  const isEntrepreneur = user?.publicMetadata.userType === 'ENTREPRENEUR';

  const { data: loggedInUser, refetch: refetchUser } = api.user.getUserById.useQuery({
    userId: user?.id ?? '',
  });

  const { data: vcGroup, isLoading } = api.vcGroup.getById.useQuery(
    { id: vcId as string },
    { enabled: !!vcId }
  );

  const { mutate: sendPoke, isPending: isSendingPoke } = api.poke.sendPokeToVcGroup.useMutation({
    onSuccess: () => {
      toast.success('Poke sent successfully!');
      setIsPokeDialogOpen(false);
      setPokeMessage('Hello, I am interested in connecting with you!');
      void refetchUser();
    },
    onError: error => {
      toast.error(error.message || 'Failed to send poke');
    },
  });

  const handleSendPoke = () => {
    if (loggedInUser?.availablePokes === 0) {
      router.push('/shop');
      return;
    }
    if (!pokeMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    sendPoke({
      vcGroupId: vcGroup!.id,
      message: pokeMessage.trim(),
    });
  };

  if (isLoading || !vcGroup) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
        <Header />
        <div className="mt-16 flex items-center justify-center sm:mt-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  console.log(vcGroup);
  console.log(loggedInUser);

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-card p-4 sm:p-8">
        {/* Vc Group Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="mb-4 flex items-center gap-2 hover:opacity-75 sm:mb-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="mt-8 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full sm:h-32 sm:w-32">
              {vcGroup.logo ? (
                <Image
                  src={vcGroup.logo}
                  alt={`${vcGroup.name}`}
                  width={128}
                  height={128}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10">
                  <User className="size-10 text-neutral-200 sm:size-12" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold sm:text-3xl">{vcGroup.name}</h1>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-white/70 sm:text-sm">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    {vcGroup.state?.name && vcGroup.country?.name ? (
                      <span>
                        {vcGroup.state.name}, {vcGroup.country.name}
                      </span>
                    ) : (
                      <span>Location not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isEntrepreneur && (
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                disabled={!loggedInUser || loggedInUser?.availablePokes === 0}
                onClick={() => setIsPokeDialogOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Poke
              </Button>
              <p className="text-sm text-white/70">{loggedInUser?.availablePokes} pokes left</p>
            </div>
          )}
        </div>

        <hr className="my-6 border-white/10 sm:my-8" />

        {/* About section */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <div>
            <h2 className="text-lg font-semibold sm:text-xl">About</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-white/80 sm:mt-4 sm:text-base">
              {vcGroup.bio ?? 'No detailed description available.'}
            </p>
          </div>

          <div className="border-l-2 border-white/10 pl-6">
            <h2 className="text-lg font-semibold sm:text-xl">Members</h2>
            <div className="mt-6 whitespace-pre-wrap text-sm text-white/80 sm:text-base flex flex-col gap-4">
              {vcGroup.members.map(member => (
                <div key={member.id} className="flex gap-3 items-start">
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={`${member.name}`}
                      width={48}
                      height={48}
                      className="size-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-full bg-white/10">
                      <User className="size-6 text-neutral-200 sm:size-8" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-semibold sm:text-xl">{member.name}</h3>
                    <p className=" whitespace-pre-wrap text-sm text-white/80 sm:text-base">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPokeDialogOpen} onOpenChange={setIsPokeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Poke to {vcGroup.name}</DialogTitle>
            <DialogDescription>
              Write a personalized message to introduce yourself and your project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poke-message">Message</Label>
              <Textarea
                id="poke-message"
                placeholder="Enter your message here..."
                value={pokeMessage}
                onChange={e => setPokeMessage(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={500}
                disabled={isSendingPoke}
              />
              <p className="text-xs text-white/50">{pokeMessage.length}/500 characters</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPokeDialogOpen(false)}
              disabled={isSendingPoke}
            >
              Cancel
            </Button>
            <Button onClick={handleSendPoke} disabled={isSendingPoke || !pokeMessage.trim()}>
              {isSendingPoke ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Send Poke
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
