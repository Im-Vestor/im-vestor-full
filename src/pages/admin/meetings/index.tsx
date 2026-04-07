import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { CopyIcon, Loader2, Video, Clock, ExternalLink, Link as LinkIcon } from 'lucide-react';
import AdminLayout from '../index';
import { api } from '~/utils/api';
import { Badge } from "~/components/ui/badge";
import {
  AdminPageHeader,
  AdminStatsCard,
  AdminContentCard,
  AdminSection,
  AdminStatsGrid,
  adminGradients,
  adminIconColors
} from "~/components/admin/shared";

function Meetings() {
  const [instantRoomUrl, setInstantRoomUrl] = useState<string | null>(null);

  const { mutate: createInstant, isPending: isCreatingInstant } =
    api.meeting.createInstantMeeting.useMutation({
      onSuccess: data => {
        setInstantRoomUrl(data.url);
        toast.success('Instant room created!');
      },
      onError: error => {
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
      navigator.clipboard
        .writeText(instantRoomUrl)
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
    <AdminSection>
      {/* Header */}
      <AdminPageHeader
        title="Meeting Management"
        description="Create instant video call rooms and manage meeting sessions for platform users."
        icon={Video}
        iconLabel="Video Meetings"
      />

      {/* Stats Cards */}
      <AdminStatsGrid columns={3}>
        <AdminStatsCard
          title="Active Rooms"
          value={0}
          subtitle="Currently active"
          icon={Video}
          gradient={adminGradients.green}
          iconColor={adminIconColors.green}
        />

        <AdminStatsCard
          title="Total Created"
          value="∞"
          subtitle="Unlimited rooms"
          icon={LinkIcon}
          gradient={adminGradients.blue}
          iconColor={adminIconColors.blue}
        />

        <AdminStatsCard
          title="Room Duration"
          value="1h"
          subtitle="Auto-expire time"
          icon={Clock}
          gradient={adminGradients.orange}
          iconColor={adminIconColors.orange}
        />
      </AdminStatsGrid>

      {/* Instant Meeting Room */}
      <AdminContentCard
        title="Instant Meeting Room"
        description="Quickly generate a temporary video call room. The room will be available immediately and expire in one hour."
        icon={Video}
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCreateInstantRoom}
              disabled={isCreatingInstant}
              className="bg-primary hover:bg-primary/90 transition-all duration-300 group"
            >
              {isCreatingInstant ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Create Instant Room
                </>
              )}
            </Button>

            {instantRoomUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(instantRoomUrl, '_blank')}
                className="border-border hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group"
              >
                <ExternalLink className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Open Room
              </Button>
            )}
          </div>

          {instantRoomUrl && (
            <div className="space-y-4 p-4 bg-muted/40 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  <Clock className="h-3 w-3 mr-1" />
                  Active for 1 hour
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instant-room-url" className="text-sm font-medium text-foreground">
                  Room URL:
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="instant-room-url"
                    type="text"
                    readOnly
                    value={instantRoomUrl}
                    className="flex-grow bg-background border-border text-foreground"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    aria-label="Copy URL"
                    className="border-border hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Share this URL with participants to join the meeting. The room will automatically close after 1 hour.
              </p>
            </div>
          )}
        </div>
      </AdminContentCard>
    </AdminSection>
  );
}

export default function MeetingsPage() {
  return (
    <AdminLayout>
      <Meetings />
    </AdminLayout>
  );
}
