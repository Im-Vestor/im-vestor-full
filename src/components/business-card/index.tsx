import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import Image from "next/image";

export function BusinessCardDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md  bg-background space-y-2">
        <DialogHeader>
          <DialogTitle>Download Business Card</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg">
              <Image
                src="/images/businesscard1.png"
                alt="Business Card Template 1"
                width={400}
                height={225}
                className="w-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button variant="secondary" size="sm">
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg">
              <Image
                src="/images/businesscard1.png"
                alt="Business Card Template 2"
                width={400}
                height={225}
                className="w-full object-cover"
              />
            </div>
            <div className="flex justify-between items-center">
              <Button variant="secondary" size="sm">
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}