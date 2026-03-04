import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Loader2, Send, Calendar } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/utils/api";

const emailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  firstText: z.string().min(1, "Heading is required"),
  secondText: z.string().min(1, "Body text is required"),
  link: z.string().optional(),
  buttonText: z.string().optional(),
  meetingDate: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface SendEmailDialogProps {
  userId: string;
  userEmail: string;
  userName?: string;
}

export function SendEmailDialog({ userId, userEmail, userName }: SendEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [includeMeeting, setIncludeMeeting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      firstText: "",
      secondText: "",
      link: "",
      buttonText: "",
      meetingDate: "",
    },
  });

  const sendEmailMutation = api.admin.sendEmailToUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setOpen(false);
      reset();
      setIncludeMeeting(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: EmailFormValues) => {
    sendEmailMutation.mutate({
      userId,
      subject: data.subject,
      firstText: data.firstText,
      secondText: data.secondText,
      link: data.link,
      buttonText: data.buttonText,
      meetingDate: includeMeeting && data.meetingDate ? new Date(data.meetingDate) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { reset(); setIncludeMeeting(false); } }}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 hover:border-primary/50 hover:bg-primary/10"
        >
          <Mail className="h-3 w-3 mr-1" />
          Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Email to User</DialogTitle>
          <DialogDescription>
            Send a custom email to {userName ? `${userName} (${userEmail})` : userEmail}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject
            </label>
            <Input
              id="subject"
              placeholder="Email subject line"
              {...register("subject")}
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-red-500">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="firstText" className="text-sm font-medium">
              Heading (First Text)
            </label>
            <Input
              id="firstText"
              placeholder="Main heading or greeting"
              {...register("firstText")}
              className={errors.firstText ? "border-red-500" : ""}
            />
            {errors.firstText && (
              <p className="text-xs text-red-500">{errors.firstText.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="secondText" className="text-sm font-medium">
              Body (Second Text)
            </label>
            <Textarea
              id="secondText"
              placeholder="Main content of the email"
              rows={4}
              {...register("secondText")}
              className={errors.secondText ? "border-red-500" : ""}
            />
            {errors.secondText && (
              <p className="text-xs text-red-500">{errors.secondText.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="buttonText" className="text-sm font-medium">
                Button Text (Optional)
              </label>
              <Input
                id="buttonText"
                placeholder="e.g. View Project"
                {...register("buttonText")}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="link" className="text-sm font-medium">
                Button Link (Optional)
              </label>
              <Input
                id="link"
                placeholder="https://..."
                {...register("link")}
              />
            </div>
          </div>

          <div className="border border-white/10 rounded-lg p-3 space-y-3">
            <button
              type="button"
              onClick={() => setIncludeMeeting((v) => !v)}
              className="flex items-center gap-2 text-sm font-medium w-full text-left"
            >
              <Calendar className="h-4 w-4 text-primary" />
              Include calendar invite (.ics)
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${includeMeeting ? "bg-primary/20 text-primary" : "bg-white/10 text-white/50"}`}>
                {includeMeeting ? "On" : "Off"}
              </span>
            </button>

            {includeMeeting && (
              <div className="space-y-2">
                <label htmlFor="meetingDate" className="text-sm text-white/70">
                  Meeting date & time
                </label>
                <Input
                  id="meetingDate"
                  type="datetime-local"
                  {...register("meetingDate")}
                  className={errors.meetingDate ? "border-red-500" : ""}
                />
                <p className="text-xs text-white/40">
                  A 1-hour event will be created using the Button Link as meeting URL.
                </p>
                {errors.meetingDate && (
                  <p className="text-xs text-red-500">{errors.meetingDate.message}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendEmailMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
