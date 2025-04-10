import { useEffect } from "react";
import { useRouter } from "next/router";
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";


export default function Admin({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin/login");
  }, [router]);

  return (
    <div className="flex h-screen bg-dark text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

