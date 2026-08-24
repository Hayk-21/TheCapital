import { notFound } from "next/navigation";
import { LANGS } from "@/lib/content-schema";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!(LANGS as readonly string[]).includes(lang)) notFound();
  return children;
}
