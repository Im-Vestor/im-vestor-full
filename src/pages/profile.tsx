import { useUser } from "@clerk/nextjs";
import { Header } from "~/components/header";
import { EntrepreneurProfile } from "~/components/profile/entrepreneur-profile";
import { InvestorProfile } from "~/components/profile/investor-profile";

export default function Profile() {
  const { user } = useUser();

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12">
        {user?.publicMetadata.userType === "ENTREPRENEUR" ? (
          <EntrepreneurProfile />
        ) : (
          <InvestorProfile />
        )}
      </div>
    </main>
  );
}
