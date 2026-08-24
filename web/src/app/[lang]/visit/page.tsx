import type { Metadata } from "next";
import { SiteShell } from "@/components/site/SiteShell";
import { VisitView } from "@/components/site/VisitView";
import { pageMetadata, preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export async function generateMetadata(props: RouteParams): Promise<Metadata> {
  return pageMetadata("visit", props);
}

export default async function VisitPage(props: RouteParams & RouteSearch) {
  const { content, lang, canEdit, editing } = await preparePage("visit", props);

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <VisitView />
    </SiteShell>
  );
}
