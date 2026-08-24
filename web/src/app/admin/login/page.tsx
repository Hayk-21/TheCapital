import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Вход — The Capital" };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return <LoginForm />;
}
