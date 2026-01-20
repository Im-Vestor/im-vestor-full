import {
  Building,
  Building2,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Twitter,
  User,
  Copy,
  Check,
  TrendingUp,
  Users2,
  Wallet,
  Download,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';

import { Button } from '~/components/ui/button';
import { api } from '~/utils/api';
import { PartnerForm } from './partner-form';
import { UpdateEmailButton } from '~/components/update-email-button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { toast } from 'sonner';

export const PartnerProfile = ({ userId }: { userId?: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Use different query based on whether userId is provided (admin view) or not (own profile)
  const { data: partner, isPending: isLoading } = userId
    ? api.partner.getByUserIdForAdmin.useQuery({ userId })
    : api.partner.getByUserId.useQuery();

  // Get user email - only for own profile
  const { data: userData } = api.user.getUser.useQuery(undefined, {
    enabled: !userId && !isLoading,
  });

  // Get referral stats and list
  const { data: stats } = api.partner.getReferralStats.useQuery(undefined, {
    enabled: !userId && !isLoading,
  });

  const { data: referrals } = api.partner.getReferralList.useQuery(undefined, {
    enabled: !userId && !isLoading,
  });

  // Disable editing when viewing someone else's profile
  const canEdit = !userId;

  const handleCopyLink = async () => {
    if (userData?.referralCode) {
      const link = `${window.location.origin}/sign-up?referralToken=${userData.referralCode}`;
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeRef.current || !userData?.referralCode) return;

    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) return;

    // Convert SVG to canvas
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size with padding
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      if (ctx) {
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw QR code
        ctx.drawImage(img, padding, padding);

        // Download as PNG
        const link = document.createElement('a');
        link.download = `referral-qr-code-${userData.referralCode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toast.success('QR code downloaded!');
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (isLoading) {
    return (
      <div className="mt-32 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (isEditing) {
    return <PartnerForm partner={partner} onCancel={() => setIsEditing(false)} />;
  }

  const formatUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  };

  const socialLinks = [
    {
      name: 'Website',
      url: partner?.website,
      icon: Globe,
      color: 'text-blue-400 hover:text-blue-300',
    },
    {
      name: 'LinkedIn',
      url: partner?.linkedinUrl,
      icon: Linkedin,
      color: 'text-blue-500 hover:text-blue-400',
    },
    {
      name: 'Facebook',
      url: partner?.facebook,
      icon: Facebook,
      color: 'text-blue-600 hover:text-blue-500',
    },
    {
      name: 'Instagram',
      url: partner?.instagram,
      icon: Instagram,
      color: 'text-pink-500 hover:text-pink-400',
    },
    {
      name: 'Twitter',
      url: partner?.twitter,
      icon: Twitter,
      color: 'text-sky-400 hover:text-sky-300',
    },
  ].filter(link => link.url);

  return (
    <div className={`rounded-lg border border-white/10 pb-20 bg-card`}>
      <div className="relative">
        <div className="h-24 w-full rounded-t-lg bg-transparent" />

        <div className="absolute bottom-0 left-12 translate-y-1/2">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#D1D5DB] ring-4 ring-[#1E202A]">
            {partner?.photo ? (
              <Image
                src={partner.photo}
                alt="Profile"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-black" />
            )}
          </div>
        </div>
      </div>

      <div className="px-12 pt-16">
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold">
              {partner?.firstName} {partner?.lastName}
            </h2>
            {partner?.companyName && (
              <div className="mt-2 flex items-center gap-3">
                {partner?.companyLogoUrl ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={partner.companyLogoUrl}
                      alt="Company Logo"
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5">
                    <Building2 className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
                <p className="flex items-center gap-1 text-gray-400">
                  <Building className="mr-0.5 h-4 w-4" />
                  {partner.companyName}
                </p>
              </div>
            )}
          </div>
          {canEdit && (
            <div className="flex gap-2 items-end">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-fit"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Pencil className="h-2 w-2" />
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
              <UpdateEmailButton />
            </div>
          )}
        </div>

        <hr className="my-6 border-white/10" />

        {/* Partner Dashboard Section */}
        {canEdit && (
          <div className="mt-8 space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-solid" />
                Referral Dashboard
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Users2 className="h-4 w-4" /> Total Referrals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats?.totalReferrals ?? 0}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" /> Active Conversions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stats?.activeReferrals ?? 0}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary-solid" /> Est. Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary-solid">
                      {stats?.estimatedEarnings ?? 0}€
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Sharing Tools */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h4 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">Your Referral Link</h4>
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 rounded-lg px-4 py-2 border border-white/5 text-gray-300 font-mono text-sm flex items-center overflow-hidden whitespace-nowrap">
                  {userData?.referralCode ? (
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?referralToken=${userData.referralCode}`
                  ) : (
                    'Generating code...'
                  )}
                </div>
                <Button
                  onClick={handleCopyLink}
                  className="bg-primary-solid text-black hover:bg-primary-hover"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-2 hidden sm:inline">Copy Link</span>
                </Button>
              </div>

              {/* QR Code Section */}
              {userData?.referralCode && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <div
                    ref={qrCodeRef}
                    className="bg-white p-4 rounded-lg"
                  >
                    <QRCode
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/sign-up?referralToken=${userData.referralCode}`}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="M"
                    />
                  </div>
                  <Button
                    onClick={handleDownloadQRCode}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </Button>
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500">
                Share this link with your network. You earn for every new user who activates their account.
              </p>
            </div>

            {/* Referral History */}
            <div>
              <h4 className="text-lg font-medium mb-4">Recent Referrals</h4>
              <div className="rounded-lg border border-white/10 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-gray-400 font-medium">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3 text-center">Type</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {referrals && referrals.length > 0 ? (
                      referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{ref.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] uppercase font-bold text-gray-400">
                              {ref.userType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              ref.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">
                            {new Date(ref.joinedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                          No referrals yet. Start sharing your link to earn!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <hr className="my-6 border-white/10" />

        {/* Contact Information */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
          <div className="space-y-3">
            {userData?.email && (
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="h-5 w-5 text-gray-400" />
                <a
                  href={`mailto:${userData.email}`}
                  className="hover:text-white transition-colors"
                >
                  {userData.email}
                </a>
              </div>
            )}
            {partner?.mobileFone && (
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="h-5 w-5 text-gray-400" />
                <a
                  href={`tel:${partner.mobileFone}`}
                  className="hover:text-white transition-colors"
                >
                  {partner.mobileFone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Website & Social Media */}
        {socialLinks.length > 0 && (
          <>
            <hr className="my-6 border-white/10" />
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Website & Social Media</h3>
              <div className="flex flex-wrap gap-4">
                {socialLinks.map(link => {
                  const Icon = link.icon;
                  const formattedUrl = formatUrl(link.url);
                  return (
                    <a
                      key={link.name}
                      href={formattedUrl ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${link.color}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{link.name}</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Empty State Messages */}
        {!partner?.mobileFone && !userData?.email && socialLinks.length === 0 && (
          <>
            <hr className="my-6 border-white/10" />
            <div className="mt-8 text-center py-8 text-gray-400">
              <p>No contact information available.</p>
              {canEdit && (
                <p className="mt-2 text-sm">Click "Edit" to add your information.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
