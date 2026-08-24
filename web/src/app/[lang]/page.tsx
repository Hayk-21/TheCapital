import type { Metadata } from "next";
import { HomeView } from "@/components/site/HomeView";
import { SiteShell } from "@/components/site/SiteShell";
import { pageMetadata, preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export async function generateMetadata(props: RouteParams): Promise<Metadata> {
  return pageMetadata("home", props);
}

export default async function HomePage(props: RouteParams & RouteSearch) {
  const { content, lang, canEdit, editing } = await preparePage("home", props);

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <HomeView />
    </SiteShell>
  );
}
