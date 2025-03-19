import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectStage, Currency } from "@prisma/client";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Loader2,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Header } from "~/components/header";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { PROJECT_STAGES } from "~/data/project-stages";
import { cn } from "~/lib/utils";
import { api } from "~/utils/api";
import { sendImageToBackend } from "~/utils/file";

const companyFormSchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  logo: z.string().optional(),
  quickSolution: z
    .string()
    .min(10, "Quick solution must be at least 10 characters"),
  website: z.string().optional(),
  foundationDate: z.date(),
  sectorId: z.string().min(1, "Company sector is required"),
  stage: z.nativeEnum(ProjectStage),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  about: z
    .string()
    .min(10, "About must be at least 10 characters")
    .max(280, "About must be at most 280 characters"),
  startInvestment: z.number().min(1, "Start investment is required"),
  investorSlots: z.number().min(1, "Investors slots is required"),
  annualRevenue: z.number().min(1, "Annual revenue is required"),
  investmentGoal: z.number().min(1, "Investment goal is required"),
  equity: z.number().optional(),
  currency: z.nativeEnum(Currency, {
    required_error: "Currency is required",
  }),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional()
    .default([]),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CreateCompany() {
  const router = useRouter();
  const { user } = useUser();

  const [country, setCountry] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: areas, isLoading: isLoadingAreas } = api.area.getAll.useQuery();
  const { data: countries, isLoading: isLoadingCountries } =
    api.country.getAll.useQuery();
  const { data: states, isLoading: isLoadingStates } =
    api.country.getStates.useQuery({
      countryId: country,
    });

  const { mutateAsync: createCompany, isPending } =
    api.project.create.useMutation({
      onSuccess: () => {
        toast.success("Company created successfully!");
        void router.push("/profile");
      },
      onError: (error) => {
        toast.error("Failed to create company. Please try again.");
        console.error(
          "Create company error:",
          error instanceof Error ? error.message : "Unknown error",
        );
      },
    });

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      logo: "",
      quickSolution: "",
      website: "",
      foundationDate: new Date(),
      sectorId: "",
      stage: ProjectStage.PRE_SEED,
      country: "",
      state: "",
      about: "",
      startInvestment: 0,
      investorSlots: 0,
      annualRevenue: 0,
      investmentGoal: 0,
      equity: 0,
      currency: Currency.USD,
      faqs: [{ question: "", answer: "" }],
    },
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      setIsUploading(true);

      const imageUrl = await sendImageToBackend(file, user?.id ?? "");

      setIsUploading(false);

      form.setValue("logo", imageUrl ?? "");
    }
  };

  async function onSubmit(data: CompanyFormValues) {
    await createCompany(data);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6 rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] md:px-16 px-4 py-8">
              <button
                type="button"
                className="flex items-center gap-2 hover:opacity-75"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h1 className="text-lg font-bold">Create Company</h1>
              <FormField
                control={form.control}
                name="logo"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative h-24 w-24 hover:opacity-75">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            {...field}
                          />
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-[#D1D5DC]">
                            {value ? (
                              <Image
                                src={value}
                                alt="Logo preview"
                                className="h-full w-full rounded-md object-cover"
                                width={100}
                                height={100}
                              />
                            ) : isUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-black" />
                            ) : (
                              <PlusIcon className="h-6 w-6 text-black" />
                            )}
                          </div>
                        </div>
                        {value && (
                          <button
                            type="button"
                            onClick={() => onChange(undefined)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">
                      Company Name*
                    </Label>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quickSolution"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">
                      Quick Solution*
                    </Label>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your solution"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">
                      Website (optional)
                    </Label>
                    <FormControl>
                      <Input
                        className="w-full md:w-1/2"
                        type="url"
                        placeholder="https://example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="foundationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col gap-2">
                    <Label className="font-normal text-neutral-200">
                      Foundation Date*
                    </Label>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full md:w-1/2 border-none pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select date</span>
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
                            toYear={2025}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sectorId"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Company Sector*
                      </Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) => {
                            field.onChange(value);
                          }}
                          disabled={isLoadingAreas}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            {areas?.map((area) => (
                              <SelectItem
                                key={area.id}
                                value={area.id.toString()}
                              >
                                {area.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Company Stage*
                      </Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) => {
                            field.onChange(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_STAGES.map((stage) => (
                              <SelectItem key={stage.value} value={stage.value}>
                                {stage.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Country*
                      </Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) => {
                            field.onChange(value);
                            setCountry(value);
                            form.setValue("state", "");
                          }}
                          disabled={isLoadingCountries}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries?.map((country) => (
                              <SelectItem
                                key={country.id}
                                value={country.id.toString()}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        State*
                      </Label>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={(value: string) =>
                            field.onChange(value)
                          }
                          disabled={
                            !form.getValues("country") ||
                            isLoadingCountries ||
                            isLoadingStates
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="State*" />
                          </SelectTrigger>
                          <SelectContent>
                            {states?.map((state) => (
                              <SelectItem
                                key={state.id}
                                value={state.id.toString()}
                              >
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <Label className="font-normal text-neutral-200">
                      About Company*
                    </Label>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your company"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <h3 className="mt-2 text-lg">Financial Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startInvestment"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Start Investment*
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter amount in USD"
                          {...field}
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
                  name="investorSlots"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Investors Slots*
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter number of slots"
                          {...field}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Annual Revenue*
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter amount in USD"
                          {...field}
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
                  name="equity"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Equity (%)
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Enter equity percentage"
                          {...field}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="investmentGoal"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="font-normal text-neutral-200">
                        Investment Goal*
                      </Label>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Enter amount in USD"
                          {...field}
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
                            <SelectItem value={Currency.USD}>$ USD</SelectItem>
                            <SelectItem value={Currency.EUR}>€ EUR</SelectItem>
                            <SelectItem value={Currency.BRL}>R$ BRL</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <h3 className="mt-2 text-lg">Company FAQ</h3>
              <div className="space-y-4">
                {form.watch("faqs")?.map((_, index) => (
                  <div key={index}>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FormField
                          control={form.control}
                          name={`faqs.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="w-11/12">
                              <FormControl>
                                <Input
                                  placeholder={`Question ${index + 1}`}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const currentFaq = form.getValues("faqs") ?? [];
                            form.setValue(
                              "faqs",
                              currentFaq.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`faqs.${index}.answer`}
                        render={({ field }) => (
                          <FormItem className="w-11/12">
                            <FormControl>
                              <Input
                                placeholder={`Answer ${index + 1}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentFaq = form.getValues("faqs") ?? [];
                    form.setValue("faqs", [
                      ...currentFaq,
                      { question: "", answer: "" },
                    ]);
                  }}
                >
                  <PlusIcon className="h-4 w-4" /> Add Question
                </Button>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button className="w-1/3" type="submit" disabled={isPending}>
                  {isPending ? (
                    "Saving..."
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Save</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
