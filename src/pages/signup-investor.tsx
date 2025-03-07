import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { Currency } from "@prisma/client";
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
import { Checkbox } from "~/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MultiSelect } from "~/components/ui/multi-select";
import { PhoneInput } from "~/components/ui/phone-input";
import { PopoverContent } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { api } from "~/utils/api";

const formSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    mobileFone: z.string().min(1, "Mobile phone is required"),
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    investmentMinValue: z
      .number()
      .min(1, "Minimum investment value is required"),
    investmentMaxValue: z
      .number()
      .min(1, "Maximum investment value is required"),
    investmentNetWorth: z.number().min(1, "Net worth is required"),
    investmentAnnualIncome: z.number().min(1, "Annual income is required"),
    currency: z.nativeEnum(Currency, {
      required_error: "Currency is required",
    }),
    birthDate: z.date({
      required_error: "Birth date is required",
    }),
    areas: z.array(z.number()).min(1, "At least one area is required"),
    referralToken: z.string().optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
    acceptConfidentiality: z.boolean().refine((val) => val === true, {
      message: "You must accept the confidentiality agreement",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupInvestor() {
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
      city: "",
      country: "",
      investmentMinValue: 0,
      investmentMaxValue: 0,
      investmentNetWorth: 0,
      investmentAnnualIncome: 0,
      currency: Currency.USD,
      birthDate: new Date(
        new Date().setFullYear(new Date().getFullYear() - 18),
      ),
      areas: [],
      referralToken: (router.query.referralToken as string) ?? "",
      acceptTerms: false,
      acceptConfidentiality: false,
    },
  });

  const { data: areas } = api.area.getAll.useQuery();

  const { mutateAsync: registerInvestor, isPending: isRegistering } =
    api.investor.create.useMutation({
      onSuccess: () => {
        toast.success("Account created successfully!");
        setStep(step + 1);
      },
      onError: (error) => {
        toast.error("Failed to create account. Please try again.");
        console.error("Registration error:", error);
      },
    });

  const formatCurrency = (value: number) => {
    if (value >= 5000000) return "5M+";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <main className="flex min-h-screen flex-col items-center pb-12">
      <div className="mt-4 w-full md:min-w-[80rem] md:max-w-[80rem]">
        <Header />
      </div>
      <div
        className={`md:max-w-[40rem] ${step !== 7 && "rounded-2xl border-4 border-white/10 bg-[#181920] bg-opacity-30 p-6 backdrop-blur-md"}`}
      >
        {step !== 7 && (
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
                  <span className="text-[#E5CD82]">Investor</span>
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
                            placeholder="John"
                            {...field}
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
                            placeholder="Doe"
                            {...field}
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
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  Select your <br />
                  <span className="text-[#E5CD82]">Investment Areas</span>
                </h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="areas"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <MultiSelect
                            options={
                              areas?.map((area) => ({
                                label: area.name,
                                value: area.id.toString(),
                              })) ?? []
                            }
                            selected={field.value.map(String)}
                            onChange={(values) =>
                              field.onChange(values.map((v) => Number(v)))
                            }
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
              <div className="md:min-w-[30rem] md:max-w-[30rem]">
                <h2 className="my-8 text-center text-4xl font-semibold">
                  What are your <br />
                  <span className="text-[#E5CD82]">Investment capacity?</span>
                </h2>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="investmentMinValue"
                      render={({ field: minField }) => (
                        <FormField
                          control={form.control}
                          name="investmentMaxValue"
                          render={({ field: maxField }) => (
                            <FormItem>
                              <Label className="text-white">
                                Investment Range
                              </Label>
                              <FormControl>
                                <div className="space-y-4">
                                  <Slider
                                    min={2500}
                                    max={5000000}
                                    step={2500}
                                    defaultValue={[2500, 5000000]}
                                    minStepsBetweenThumbs={1}
                                    value={[
                                      Number(minField.value || "2500"),
                                      Number(maxField.value || "5000000"),
                                    ]}
                                    onValueChange={([min, max]) => {
                                      if (min && max) {
                                        minField.onChange(min);
                                        maxField.onChange(max);
                                      }
                                    }}
                                    className="py-4"
                                  />
                                  <div className="flex justify-between text-sm text-white/70">
                                    <span>$2.5K</span>
                                    <div className="space-x-2">
                                      <span>
                                        {formatCurrency(
                                          Number(minField.value) || 2500,
                                        )}
                                      </span>
                                      <span>-</span>
                                      <span>
                                        {formatCurrency(
                                          Number(maxField.value) || 5000000,
                                        )}
                                      </span>
                                    </div>
                                    <span>$5M+</span>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Currency*
                        </Label>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Currency.USD}>
                                $ USD
                              </SelectItem>
                              <SelectItem value={Currency.EUR}>
                                € EUR
                              </SelectItem>
                              <SelectItem value={Currency.BRL}>
                              R$ BRL
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="investmentNetWorth"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Net Worth*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            placeholder="Enter amount in USD"
                            disabled={isRegistering}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || !isNaN(Number(value))) {
                                field.onChange(Number(value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="investmentAnnualIncome"
                    render={({ field }) => (
                      <FormItem>
                        <Label className="font-normal text-neutral-200">
                          Annual Income*
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min={0}
                            placeholder="Enter amount in USD"
                            disabled={isRegistering}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || !isNaN(Number(value))) {
                                field.onChange(Number(value));
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="md:min-w-[25rem] md:max-w-[25rem]">
                <h2 className="mb-12 mt-8 text-center text-4xl font-semibold">
                  Terms & <span className="text-[#E5CD82]">Conditions</span>
                </h2>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-gray-400 bg-white data-[state=checked]:bg-[#E5CD82]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>I accept the terms and conditions</Label>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptConfidentiality"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-gray-400 bg-white data-[state=checked]:bg-[#E5CD82]"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <Label>I accept the confidentiality agreement</Label>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 5 && (
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

            {step === 6 && (
              <SignUpCard
                name={
                  form.getValues("firstName") + " " + form.getValues("lastName")
                }
                type="investor"
                features={[
                  "See all our projects",
                  "See entrepreneur profiles",
                  "Filter Projects",
                  "Meetings",
                  "Interests Match Notifications",
                ]}
              />
            )}

            {step === 7 && <FinishCard name={form.getValues("firstName")} />}

            {step !== 7 && (
              <Button
                type="button"
                className="mt-12 w-full"
                disabled={isRegistering}
                onClick={async () => {
                  let isValid = false;

                  switch (step) {
                    case 1:
                      isValid = await form.trigger([
                        "firstName",
                        "lastName",
                        "email",
                        "password",
                        "mobileFone",
                        "birthDate",
                      ]);
                      break;
                    case 2:
                      isValid = await form.trigger("areas");
                      break;
                    case 3:
                      isValid = await form.trigger([
                        "investmentMinValue",
                        "investmentMaxValue",
                        "investmentNetWorth",
                        "investmentAnnualIncome",
                      ]);
                      break;
                    case 4:
                      isValid = await form.trigger("acceptTerms");
                      break;
                    case 5:
                      isValid = true; // Referral token is optional
                      if (isValid) {
                        await registerInvestor(form.getValues());
                        return;
                      }
                      break;
                    case 6:
                      isValid = true;
                      break;
                  }

                  if (isValid && step !== 5) {
                    setStep(step + 1);
                  } else {
                    console.error("Invalid form");
                    console.log(form.formState.errors);
                  }
                }}
              >
                {isRegistering ? (
                  "Creating account..."
                ) : step === 6 ? (
                  "Take your pass"
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2" />
                  </>
                )}
              </Button>
            )}
          </form>
        </Form>
      </div>
    </main>
  );
}
