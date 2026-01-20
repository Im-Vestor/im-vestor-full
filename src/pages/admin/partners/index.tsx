import { useState } from "react";
import AdminLayout from "~/pages/admin";
import { api } from "~/utils/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table";
import { Switch } from "~/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Search, Building2, Upload, Users, Check, Link2, Pencil } from "lucide-react";
import { Input } from "~/components/ui/input";
import Image from "next/image";
import { cn } from "~/lib/utils";
import { sendImageToBackend } from "~/utils/file";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

export default function AdminPartnersPage() {
  const [search, setSearch] = useState("");
  const [uploadingPartnerId, setUploadingPartnerId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMarqueeLinkId, setEditingMarqueeLinkId] = useState<string | null>(null);
  const [isMarqueeLinkSheetOpen, setIsMarqueeLinkSheetOpen] = useState(false);
  const [marqueeLinkType, setMarqueeLinkType] = useState<string>("");
  const [marqueeLinkUrl, setMarqueeLinkUrl] = useState<string>("");
  const utils = api.useUtils();

  const { data: partners, isLoading } = api.partner.adminGetAll.useQuery();

  const { data: partnerReferrals, isLoading: isLoadingReferrals } = api.partner.adminGetPartnerReferrals.useQuery(
    { partnerUserId: selectedPartnerId ?? "" },
    { enabled: !!selectedPartnerId }
  );

  const { mutate: toggleFeatured, isPending: isToggling } = api.partner.toggleFeatured.useMutation({
    onSuccess: () => {
      toast.success("Partner status updated");
      void utils.partner.adminGetAll.invalidate();
      void utils.partner.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update status: " + error.message);
    }
  });

  const { mutate: updateLogo } = api.partner.adminUpdateLogo.useMutation({
    onSuccess: () => {
      toast.success("Logo updated successfully");
      void utils.partner.adminGetAll.invalidate();
      void utils.partner.getAll.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to update logo: " + error.message);
    },
    onSettled: () => {
      setUploadingPartnerId(null);
    }
  });

  const { mutate: updateMarqueeLink, isPending: isUpdatingMarqueeLink } = api.partner.adminUpdateMarqueeLink.useMutation({
    onSuccess: () => {
      toast.success("Marquee link updated successfully");
      void utils.partner.adminGetAll.invalidate();
      void utils.partner.getAll.invalidate();
      setIsMarqueeLinkSheetOpen(false);
      setEditingMarqueeLinkId(null);
    },
    onError: (error) => {
      toast.error("Failed to update marquee link: " + error.message);
    }
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, partnerId: string, userId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPartnerId(partnerId);
      const logoUrl = await sendImageToBackend(file, userId);
      updateLogo({ id: partnerId, companyLogoUrl: logoUrl });
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
      setUploadingPartnerId(null);
    }
  };

  const filteredPartners = partners?.filter(partner =>
    partner.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    partner.firstName.toLowerCase().includes(search.toLowerCase()) ||
    partner.lastName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Partners Management</h1>
          <p className="text-muted-foreground">
            Manage partners and select which ones appear in the "Trusted by Leading Partners" carousel.
          </p>
        </div>

        <div className="rounded-md border border-white/10 bg-background-secondary overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white">Partner</TableHead>
                <TableHead className="text-white">Company</TableHead>
                <TableHead className="text-white">Email</TableHead>
                <TableHead className="text-white text-center">Referrals</TableHead>
                <TableHead className="text-white text-center">Marquee Link</TableHead>
                <TableHead className="text-white text-center">In Carousel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredPartners?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No partners found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners?.map((partner) => (
                  <TableRow key={partner.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                          {partner.photo ? (
                            <Image src={partner.photo} alt={partner.firstName} width={32} height={32} className="object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white/50">
                              {partner.firstName[0]}{partner.lastName[0]}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-white">{partner.firstName} {partner.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative group/logo">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                            {partner.companyLogoUrl ? (
                              <Image src={partner.companyLogoUrl} alt="Logo" width={40} height={40} className="object-contain" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}

                            {uploadingPartnerId === partner.id && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                            )}
                          </div>

                          <label
                            htmlFor={`logo-${partner.id}`}
                            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
                          >
                            <Upload className="h-3 w-3 text-black" />
                            <input
                              id={`logo-${partner.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleLogoUpload(e, partner.id, partner.userId)}
                              disabled={!!uploadingPartnerId}
                            />
                          </label>
                        </div>
                        <span className="text-gray-300 font-medium">{partner.companyName || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400 font-mono text-xs">
                      {partner.user.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => {
                          setSelectedPartnerId(partner.userId);
                          setIsSheetOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary transition-all group"
                      >
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-bold text-white">
                          {partner.user._count.referralsAsReferrer}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => {
                          setEditingMarqueeLinkId(partner.id);
                          setMarqueeLinkType(partner.marqueeLinkType ?? "");
                          setMarqueeLinkUrl(partner.marqueeLinkUrl ?? "");
                          setIsMarqueeLinkSheetOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary transition-all group"
                        title="Edit marquee link"
                      >
                        <Link2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-white">
                          {partner.marqueeLinkType ? partner.marqueeLinkType : "Not set"}
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Switch
                          checked={partner.isFeatured}
                          onCheckedChange={(checked) => toggleFeatured({ id: partner.id, isFeatured: checked })}
                          disabled={isToggling}
                        />
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-wider",
                          partner.isFeatured ? "text-[#EDD689]" : "text-gray-500"
                        )}>
                          {partner.isFeatured ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md bg-background-secondary border-white/10 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Referred Users
            </SheetTitle>
          </SheetHeader>

          {isLoadingReferrals ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Loading referrals...</p>
            </div>
          ) : partnerReferrals && partnerReferrals.length > 0 ? (
            <div className="space-y-4">
              {partnerReferrals.map((ref) => (
                <div
                  key={ref.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 group hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{ref.name}</h4>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-400">
                      {ref.userType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{ref.email}</p>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] text-gray-500 italic">
                      Joined {new Date(ref.joinedAt).toLocaleDateString()}
                    </span>

                    {ref.hasClosedDeal && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full animate-pulse">
                        <Check className="h-2 w-2" />
                        DEAL CLOSED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users referred by this partner yet.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isMarqueeLinkSheetOpen} onOpenChange={setIsMarqueeLinkSheetOpen}>
        <SheetContent className="sm:max-w-md bg-background border-white/10 overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white flex items-center gap-2">
              <Link2 className="h-5 w-5 text-white" />
              Edit Marquee Link
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Link Type</Label>
              <Select
                value={marqueeLinkType}
                onValueChange={setMarqueeLinkType}
                disabled={isUpdatingMarqueeLink}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select link type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBSITE">Website</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                  <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                  <SelectItem value="TWITTER">Twitter</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose which type of link will be used in the marquee
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Custom URL (Optional)</Label>
              <Input
                value={marqueeLinkUrl}
                onChange={(e) => setMarqueeLinkUrl(e.target.value)}
                placeholder="Leave empty to use the partner's profile URL"
                disabled={isUpdatingMarqueeLink}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-muted-foreground">
                Override the default URL. If empty, the system will use the partner's profile URL for the selected type.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsMarqueeLinkSheetOpen(false);
                  setEditingMarqueeLinkId(null);
                }}
                disabled={isUpdatingMarqueeLink}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (editingMarqueeLinkId) {
                    updateMarqueeLink({
                      id: editingMarqueeLinkId,
                      marqueeLinkType: marqueeLinkType ? (marqueeLinkType as 'WEBSITE' | 'FACEBOOK' | 'INSTAGRAM' | 'LINKEDIN' | 'TWITTER') : undefined,
                      marqueeLinkUrl: marqueeLinkUrl || undefined,
                    });
                  }
                }}
                disabled={isUpdatingMarqueeLink || !editingMarqueeLinkId}
                className="flex-1"
              >
                {isUpdatingMarqueeLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

