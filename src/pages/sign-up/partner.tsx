import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/ui/phone-input";
import { api } from "~/utils/api";

const formSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    companyName: z
      .string()
      .min(2, "Company name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    mobileFone: z.string().min(1, "Mobile phone is required"),
    referralToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupPartner() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      mobileFone: "",
      companyName: "",
      referralToken: (router.query.referralToken as string) ?? "",
    },
  });

  const { mutateAsync: registerPartner, isPending: isRegistering } =
    api.partner.create.useMutation({
      onSuccess: () => {
        toast.success("Account created successfully!");
        void router.push("/login");
      },
      onError: (error) => {
        toast.error("Failed to create account. " + error.message);
        console.error("Registration error:", error);
      },
    });

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="mt-4 w-full md:min-w-[80rem] md:max-w-[80rem]">
        <Header />
      </div>
      <div
        className={`rounded-2xl backdrop-blur-md border-4 border-white/10 bg-[#181920] bg-opacity-30 p-6 md:max-w-[40rem]`}
      >
        <button
          type="button"
          className="flex items-center gap-2 hover:opacity-75"
          onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <Form {...form}>
          <form className="mt-8">
            {step === 1 && (
              <div className="md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  Your account as <br />
                  <span className="text-[#E5CD82]">Partner</span>
                </h2>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          First Name*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Last Name*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doe"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mobileFone"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Mobile Phone*
                        </Label>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            placeholder="999 999 999"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Company Name*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Company Name"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Email*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="example@email.com"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Password*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Confirm Password*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="min-w-[20rem] md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  Were you <br />
                  <span className="text-[#E5CD82]">referred?</span>
                </h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="referralToken"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Referral Token (optional)
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="6U5T4V00"
                            disabled={isRegistering}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <Button
              type={"button"}
              className="mt-12 w-full"
              disabled={isRegistering || !form.formState.isValid}
              onClick={async () => {
                if (step === 2) {
                  await registerPartner(form.getValues());
                } else {
                  setStep(step + 1);
                }
              }}
            >
              {step === 3
                ? "Take your pass"
                : form.formState.isValid
                  ? "Continue"
                  : "Please fill all the fields"}{" "}
              <ArrowRight className="ml-2" />
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
