import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const metadata: Metadata = { title: "Настройки — The Capital" };

export default async function SettingsPage() {
  const [session, settingRows, users] = await Promise.all([
    getSession(),
    db.setting.findMany(),
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const values = Object.fromEntries(settingRows.map((s) => [s.key, s.value]));

  return (
    <>
      <h1 className="adm-title">Настройки</h1>
      <p className="adm-sub">
        Контакты и ссылки подставляются в шапку, подвал и на страницу «Контакты».
      </p>

      <SettingsForm values={values} />

      <h2 className="adm-title" style={{ fontSize: 20, marginTop: 40 }}>
        Доступ
      </h2>
      <p className="adm-sub">Кто может редактировать сайт.</p>

      <UsersPanel
        currentUserId={session?.userId ?? ""}
        currentRole={session?.role ?? "editor"}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name ?? u.email,
          role: u.role,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
