import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FinishCard } from "~/components/finish-card";
import { Header } from "~/components/header";
import { SignUpCard } from "~/components/sign-up-card";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
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
import { PopoverContent } from "~/components/ui/popover";
import { api } from "~/utils/api";

const formSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    mobileFone: z.string().min(1, "Mobile phone is required"),
    birthDate: z.date({
      required_error: "Birth date is required",
    }),
    referralToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupEntrepreneur() {
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
      birthDate: new Date(
        new Date().setFullYear(new Date().getFullYear() - 18),
      ),
      referralToken: (router.query.referralToken as string) ?? "",
    },
  });

  

  const { mutateAsync: registerEntrepreneur, isPending: isRegistering } =
    api.entrepreneur.create.useMutation({
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
        className={`md:max-w-[40rem] ${step !== 4 && "rounded-2xl border-4 border-white/10 bg-background bg-opacity-30 p-6 backdrop-blur-md"}`}
      >
        {step !== 4 && (
          <button
            type="button"
            className="flex items-center gap-2 hover:opacity-75"
            onClick={() => (step > 1 ? setStep(step - 1) : router.back())}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}

        <Form {...form}>
          <form className="mt-8">
            {step === 1 && (
              <div className="md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  Your account as <br />
                  <span className="text-[#E5CD82]">Entrepreneur</span>
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
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <Label className="font-normal text-neutral-200">
                          Birth Date*
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="border-none"
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span className="font-normal text-[#E5E7EA]">
                                    Select date
                                  </span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto border-none p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              showOutsideDays={false}
                              selected={field.value}
                              onSelect={field.onChange}
                              fromYear={1930}
                              toYear={2007}
                            />
                          </PopoverContent>
                        </Popover>
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
                            placeholder="8AC7SHAS"
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

            {step === 3 && (
              <SignUpCard
                name={
                  form.getValues("firstName") + " " + form.getValues("lastName")
                }
                type="entrepreneur"
                features={[
                  "1 active project at a time",
                  "Up to 5 investors per project",
                  "Investor Search",
                  "View investor profiles",
                  "1 free pokes per month",
                ]}
              />
            )}

            {step === 4 && (
              <>
                <FinishCard name={form.getValues("firstName")} />
              </>
            )}

            {step !== 4 && (
              <Button
                type={"button"}
                className="mt-12 w-full"
                disabled={isRegistering || !form.formState.isValid}
                onClick={async () => {
                  if (step === 2) {
                    await registerEntrepreneur(form.getValues());
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
            )}
          </form>
        </Form>
      </div>
    </main>
  );
}
