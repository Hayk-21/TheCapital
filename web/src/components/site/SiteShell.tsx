"use client";

import { Suspense, type ReactNode } from "react";
import { ContentProvider } from "@/components/editor/ContentProvider";
import { EditorBar } from "@/components/editor/EditorBar";
import { CartProvider } from "@/components/shop/CartProvider";
import { CartButton } from "@/components/shop/CartButton";
import { NewsBar } from "@/components/shop/NewsBar";
import type { PageContent } from "@/lib/view";
import type { NewsItem } from "@/lib/news";
import type { Lang } from "@/lib/content-schema";

/** Общая обёртка всех публичных страниц: контекст контента + панель редактора. */
export function SiteShell({
  content,
  lang,
  canEdit,
  editing,
  news = [],
  children,
}: {
  content: PageContent;
  lang: Lang;
  canEdit: boolean;
  editing: boolean;
  /** Новинки магазина: полоса о них висит над шапкой на всех страницах. */
  news?: NewsItem[];
  children: ReactNode;
}) {
  return (
    <ContentProvider content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <CartProvider>
        <NewsBar news={news} />
        {children}
        <CartButton />
        <Suspense fallback={null}>
          <EditorBar />
        </Suspense>
      </CartProvider>
    </ContentProvider>
  );
}
