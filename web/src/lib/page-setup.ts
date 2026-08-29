import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageContent } from "./content";
import { getShopNews } from "./news";
import { getSession } from "./auth";
import { LANGS, type Lang, type Scope } from "./content-schema";

export type RouteParams = { params: Promise<{ lang: string }> };
export type RouteSearch = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function assertLang(value: string): Lang {
  if (!(LANGS as readonly string[]).includes(value)) notFound();
  return value as Lang;
}

/**
 * Общая подготовка публичной страницы: язык из адреса, контент из базы
 * и признак того, что смотрящий — залогиненный редактор.
 */
export async function preparePage(
  scope: Scope,
  props: RouteParams & Partial<RouteSearch>,
) {
  const { lang: rawLang } = await props.params;
  const lang = assertLang(rawLang);

  const search = props.searchParams ? await props.searchParams : {};
  // Новинки нужны на каждой странице: полоса о них висит над шапкой везде.
  const [content, session, news] = await Promise.all([
    getPageContent(scope),
    getSession(),
    getShopNews(),
  ]);

  return {
    lang,
    content,
    news,
    canEdit: Boolean(session),
    editing: search.edit === "1",
  };
}

/** title/description для страницы берём из тех же редактируемых текстов. */
export async function pageMetadata(
  scope: Scope,
  props: RouteParams,
): Promise<Metadata> {
  const { lang: rawLang } = await props.params;
  const lang = assertLang(rawLang);
  const content = await getPageContent(scope);

  const title = content.texts.seoTitle?.[lang] || content.settings.brandName || "The Capital";
  const description = content.texts.seoDescription?.[lang] || "";

  return {
    title,
    description,
    alternates: {
      languages: {
        en: `/en${scope === "home" ? "" : `/${scope}`}`,
        ru: `/ru${scope === "home" ? "" : `/${scope}`}`,
      },
    },
    openGraph: { title, description, type: "website" },
  };
}
