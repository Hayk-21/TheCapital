"use client";

import { Suspense, type ReactNode } from "react";
import { ContentProvider } from "@/components/editor/ContentProvider";
import { EditorBar } from "@/components/editor/EditorBar";
import { CartProvider } from "@/components/shop/CartProvider";
import { CartButton } from "@/components/shop/CartButton";
import type { PageContent } from "@/lib/view";
import type { Lang } from "@/lib/content-schema";

/** Общая обёртка всех публичных страниц: контекст контента + панель редактора. */
export function SiteShell({
  content,
  lang,
  canEdit,
  editing,
  children,
}: {
  content: PageContent;
  lang: Lang;
  canEdit: boolean;
  editing: boolean;
  children: ReactNode;
}) {
  return (
    <ContentProvider content={content} lang={lang} canEdit={canEdit} editing={editing}>
      <CartProvider>
        {children}
        <CartButton />
        <Suspense fallback={null}>
          <EditorBar />
        </Suspense>
      </CartProvider>
    </ContentProvider>
  );
}
