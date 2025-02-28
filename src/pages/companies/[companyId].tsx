import { type Currency, type ProjectStage } from "@prisma/client";
import {
  Building2,
  CircleUserRound,
  Globe,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Header } from "~/components/header";
import { api } from "~/utils/api";

// Helper function to format currency
const formatCurrency = (value: number, currency: Currency = "USD"): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(value);
};

// Helper function to format stage names
const formatStage = (stage: ProjectStage | null | undefined) => {
  if (!stage) return "Not specified";

  return stage
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export default function CompanyDetails() {
  const router = useRouter();
  const { companyId } = router.query;

  const { data: project, isLoading } = api.project.getById.useQuery(
    { id: companyId as string },
    { enabled: !!companyId },
  );

  if (isLoading || !project) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl p-8">
        <Header />
        <div className="mt-32 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] p-8 pt-6">
        {/* Company Header */}
        <div className="flex items-start gap-8">
          <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg">
            {project.logo ? (
              <Image
                src={project.logo}
                alt={`${project.name} Logo`}
                width={96}
                height={96}
                className="h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10">
                <Building2 className="size-10 text-neutral-200" />
              </div>
            )}
          </div>

          <div className="mt-2 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-semibold">{project.name}</h1>
              <span className="rounded-full bg-[#323645] px-6 py-1 font-light">
                {project.sector?.name ?? "Uncategorized"}
              </span>
            </div>

            <p className="mt-2 text-lg text-white/80">
              {project.quickSolution ?? "No description available"}
            </p>

            <div className="mt-2 flex items-center gap-1.5 text-white/70">
              <MapPin className="h-4 w-4" />
              {project.state?.name && project.country?.name ? (
                <span>
                  {project.state.name}, {project.country.name}
                </span>
              ) : (
                <span>Location not specified</span>
              )}

              {project.website && (
                <>
                  <span className="mx-2">•</span>
                  <Globe className="h-4 w-4" />
                  <a
                    href={
                      project.website.startsWith("http")
                        ? project.website
                        : `https://${project.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {project.website}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <hr className="my-8 border-white/10" />

        {/* Company Details */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">About the Company</h2>
            <p className="mt-4 whitespace-pre-wrap text-white/80">
              {project.about ?? "No detailed description available."}
            </p>

            <h2 className="mt-8 text-xl font-semibold">Founder</h2>
            <div className="mt-4 flex items-center gap-4">
              {project.Entrepreneur?.photo ? (
                <Image
                  src={project.Entrepreneur.photo}
                  alt="Founder"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <User className="size-6 text-neutral-200" />
                </div>
              )}
              <div>
                <p className="font-medium text-[#EFD687]">
                  {project.Entrepreneur?.firstName}{" "}
                  {project.Entrepreneur?.lastName}
                </p>
                <p className="text-sm text-white/70">Founder</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Investment Details</h2>
            <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-[#1E202A] p-6">
              <div className="flex justify-between">
                <span className="text-white/70">Stage</span>
                <span className="font-medium">
                  {formatStage(project.stage)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Annual Revenue</span>
                <span className="font-medium">
                  {project.annualRevenue
                    ? formatCurrency(project.annualRevenue, project.currency)
                    : "Not specified"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Initial Investment</span>
                <span className="font-medium">
                  {project.startInvestment
                    ? formatCurrency(project.startInvestment, project.currency)
                    : "Not specified"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-white/70">Investment Goal</span>
                <span className="font-medium">
                  {formatCurrency(project.investmentGoal, project.currency)}
                </span>
              </div>

              {project.equity !== null && project.equity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-white/70">Equity Offered</span>
                  <span className="font-medium">{project.equity}%</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-white/70">Investor Slots</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {project.investorSlots ?? 0}
                  </span>
                  <div className="flex space-x-1">
                    {Array.from({
                      length: Math.min(project.investorSlots ?? 0, 5),
                    }).map((_, i) => (
                      <CircleUserRound
                        key={i}
                        color="#EFD687"
                        className="h-4 w-4"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {project.foundationDate && (
                <div className="flex justify-between">
                  <span className="text-white/70">Founded</span>
                  <span className="font-medium">
                    {new Date(project.foundationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQs */}
        {project.faqs && project.faqs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold">
              Frequently Asked Questions
            </h2>
            <div className="mt-4 space-y-6">
              {project.faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-lg border border-white/10 bg-[#1E202A] p-6"
                >
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  <p className="mt-2 text-white/80">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files/Documents */}
        {project.files && project.files.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold">Documents</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {project.files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-lg border border-white/10 bg-[#1E202A] p-4"
                >
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-white/50">
                    {file.type} • {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
