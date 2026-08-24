import type { Metadata } from "next";
import { MenuView } from "@/components/site/MenuView";
import { SiteShell } from "@/components/site/SiteShell";
import { getMenuGroups, getMenuGroupsForAdmin } from "@/lib/content";
import { pageMetadata, preparePage, type RouteParams, type RouteSearch } from "@/lib/page-setup";

export async function generateMetadata(props: RouteParams): Promise<Metadata> {
  return pageMetadata("menu", props);
}

export default async function MenuPage(props: RouteParams & RouteSearch) {
  const { content, lang, canEdit, editing } = await preparePage("menu", props);
  // В режиме правки показываем и скрытые позиции — иначе их не вернуть обратно.
  const groups = editing ? await getMenuGroupsForAdmin() : await getMenuGroups();

  return (
    <SiteShell content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <MenuView groups={groups} />
    </SiteShell>
  );
}
