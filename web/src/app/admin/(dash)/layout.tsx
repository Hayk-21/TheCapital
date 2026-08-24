import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="adm">
      <AdminNav name={session.name} role={session.role} />
      <main className="adm-main">{children}</main>
    </div>
  );
}
