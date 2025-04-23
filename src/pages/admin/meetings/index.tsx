import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { CopyIcon, Loader2 } from 'lucide-react';
import AdminLayout from '../index';
import { api } from '~/utils/api';

function Meetings() {
  const [instantRoomUrl, setInstantRoomUrl] = useState<string | null>(null);

  const { mutate: createInstant, isPending: isCreatingInstant } = api.meeting.createInstantMeeting.useMutation({
    onSuccess: (data) => {
      setInstantRoomUrl(data.url);
      toast.success('Instant room created!');
    },
    onError: (error) => {
      toast.error(`Failed to create instant room: ${error.message}`);
      setInstantRoomUrl(null);
    },
  });

  const handleCreateInstantRoom = () => {
    setInstantRoomUrl(null);
    createInstant();
  };

  const handleCopyUrl = () => {
    if (instantRoomUrl) {
      navigator.clipboard.writeText(instantRoomUrl)
        .then(() => {
          toast.success('URL copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy URL: ', err);
          toast.error('Failed to copy URL.');
        });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Meetings</h1>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4">Instant Meeting Room</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Quickly generate a temporary video call room. The room will be available immediately and expire in one hour.
        </p>
        <div className="flex flex-col gap-4">
          <Button
            onClick={handleCreateInstantRoom}
            disabled={isCreatingInstant}
            className="w-fit"
          >
            {isCreatingInstant ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Instant Room'
            )}
          </Button>

          {instantRoomUrl && (
            <div className="flex flex-col gap-2 pt-4">
              <Label htmlFor="instant-room-url">Room URL:</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="instant-room-url"
                  type="text"
                  readOnly
                  value={instantRoomUrl}
                  className="flex-grow bg-background/50"
                />
                <Button variant="outline" size="icon" onClick={handleCopyUrl} aria-label="Copy URL">
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This room is active for 1 hour.</p>
              <Button
                variant="secondary"
                onClick={() => window.open(instantRoomUrl, '_blank')}
                className="mt-2 w-fit"
              >
                Open Room
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <AdminLayout>
      <Meetings />
    </AdminLayout>
  );
}