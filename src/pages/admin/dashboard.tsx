import { useUser } from "@clerk/nextjs";

export default function AdminDashboard() {
  const user = useUser();

  // validar se user é admin

  return <div>AdminDashboard</div>;
}
