import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { NewWork } from "@/components/admin/NewWork";
import { db } from "@/lib/db";

export default async function DashLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // Сколько работы ждёт ответа — счётчики в меню и стартовое значение
  // для наблюдателя, который потом опрашивает их сам.
  const [orders, bookings] = await Promise.all([
    db.order.count({ where: { status: "new" } }),
    db.booking.count({ where: { status: "new" } }),
  ]);
  const counts = { orders, bookings };

  return (
    <div className="adm">
      <AdminNav name={session.name} role={session.role} counts={counts} />
      <NewWork initial={counts} />
      <main className="adm-main">{children}</main>
    </div>
  );
}
