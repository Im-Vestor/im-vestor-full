import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import QRCode from "react-qr-code";
import { useState } from "react";
import { cn } from "~/lib/utils";

export function BusinessCardDialog({ trigger }: { trigger: React.ReactNode }) {
  const { user } = useUser();
  const { data: referral } = api.referral.getReferralDetails.useQuery();
  const [showFrontSide, setShowFrontSide] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<1 | 2>(1);

  const toggleCardSide = () => {
    setShowFrontSide(!showFrontSide);
  };

  const referralUrl = `https://imvestor.com?ref=${referral?.referralCode}`;
  const userName = user ? `${user.firstName} ${user.lastName}` : "Your Name";

  // Function to handle download (in a real app would use html-to-image or similar)
  const handleDownload = () => {
    // In a production application, you would use a library like html-to-image to capture the card
    // For now we'll show a success message
    alert(`Business card template ${selectedTemplate} will be downloaded.`);
  };

  const renderCardTemplate = () => {
    return (
      <div className="space-y-6">
        {/* Card Preview */}
        <div
          className={cn(
            "relative h-56 w-full max-w-sm mx-auto rounded-xl overflow-hidden transform transition-transform duration-700 cursor-pointer shadow-xl",
            showFrontSide ? "" : "rotate-y-180"
          )}
          onClick={toggleCardSide}
        >
          {/* Front Side - Logo */}
          <div
            className={cn(
              "absolute w-full h-full backface-hidden transition-all duration-700",
              showFrontSide ? "opacity-100" : "opacity-0"
            )}
          >
            <div className={cn(
              "flex flex-col items-center justify-center w-full h-full p-6",
              selectedTemplate === 1 ? "bg-gradient-to-r from-[#111111] to-[#222222]" : "bg-gradient-to-r from-[#131335] to-[#1f203e]"
            )}>
              <Image
                src="/logo/imvestor.png"
                alt="Im-Vestor Logo"
                width={100}
                height={100}
                className="mb-4"
              />
              <h3 className={cn(
                "text-2xl font-bold tracking-wider text-center",
                selectedTemplate === 1 ? "text-[#E5CD82]" : "text-white"
              )}>
                Im-Vestor
              </h3>
            </div>
          </div>

          {/* Back Side - User Info & QR Code */}
          <div
            className={cn(
              "absolute w-full h-full backface-hidden rotate-y-180 transition-all duration-700",
              showFrontSide ? "opacity-0" : "opacity-100"
            )}
          >
            <div className={cn(
              "flex flex-col items-center justify-between w-full h-full p-6",
              selectedTemplate === 1 ? "bg-gradient-to-r from-[#151515] to-[#252525]" : "bg-gradient-to-r from-[#23243e] to-[#343560]"
            )}>
              <div className="text-center mb-2">
                <h3 className={cn(
                  "text-xl font-bold",
                  selectedTemplate === 1 ? "text-[#E5CD82]" : "text-white"
                )}>
                  {userName}
                </h3>
                <p className="text-sm text-white/60">Member</p>
              </div>

              <div className="bg-white p-2 rounded-md">
                <QRCode
                  value={referralUrl}
                  size={100}
                  className="w-auto h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCardSide}
          >
            <RotateCcw size={16} className="mr-2" />
            Flip Card
          </Button>
          <div className="space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-background space-y-6">
        <DialogHeader>
          <DialogTitle>Your Business Card</DialogTitle>
        </DialogHeader>

        {/* Template tabs */}
        <div className="flex gap-4 mb-4">
          <Button
            variant={selectedTemplate === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate(1)}
            className="flex-1"
          >
            Classic
          </Button>
          <Button
            variant={selectedTemplate === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTemplate(2)}
            className="flex-1"
          >
            Modern
          </Button>
        </div>

        {/* Selected template */}
        {renderCardTemplate()}
      </DialogContent>
    </Dialog>
  );
}