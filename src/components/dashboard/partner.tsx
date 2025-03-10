import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "~/components/header";
import { api } from "~/utils/api";

export default function PartnerDashboard() {
  // const [page, setPage] = useState(0);

  // in this page we will need to fetch all the projects from entrepreneurs or partners that were referred by the partner

  const { data: user, isLoading } = api.user.getUser.useQuery();

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        <div className="rounded-xl border-2 border-white/10 bg-gradient-to-b from-[#20212B] to-[#242834] px-16 py-12">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Your referal code</h1>
              <p className="text-sm text-white/50">
                Share this code with your friends and earn 10% of their
                earnings.
              </p>
            </div>
            <div className="w-40 rounded-sm border-2 border-white/10 bg-[#2D2F3D] bg-opacity-30 py-2 pl-6 text-lg font-bold placeholder:text-white">
              <div className="relative flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Copy
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        user?.referralCode ?? "",
                      );
                      toast.success("Copied to clipboard!");
                    }}
                    className="absolute right-4 h-4 w-4 cursor-pointer hover:opacity-75"
                  />
                )}
                <p className="flex-1">{user?.referralCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
