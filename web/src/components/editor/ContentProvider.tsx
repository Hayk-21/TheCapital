"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { PageContent } from "@/lib/view";
import type { Lang } from "@/lib/content-schema";

export type SaveState = "idle" | "saving" | "saved" | "error";

type ContentContextValue = {
  content: PageContent;
  scope: string;
  lang: Lang;
  /** Пользователь залогинен и может включить редактирование. */
  canEdit: boolean;
  /** Режим редактирования включён прямо сейчас. */
  editing: boolean;
  saveState: SaveState;
  /** Обёртка над server action: держит индикатор и обновляет страницу. */
  save: (fn: () => Promise<unknown>) => Promise<void>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent вызван вне ContentProvider");
  return ctx;
}

export function ContentProvider({
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
  const router = useRouter();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const pending = useRef(0);

  const save = useCallback(
    async (fn: () => Promise<unknown>) => {
      pending.current += 1;
      setSaveState("saving");
      try {
        await fn();
        // Данные пришли с сервера — перечитываем, чтобы порядок и новые
        // элементы появились без ручной перезагрузки.
        router.refresh();
        if (--pending.current === 0) {
          setSaveState("saved");
          setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1500);
        }
      } catch (err) {
        pending.current = Math.max(0, pending.current - 1);
        console.error("Не удалось сохранить:", err);
        setSaveState("error");
      }
    },
    [router],
  );

  const value = useMemo<ContentContextValue>(
    () => ({
      content,
      scope: content.scope,
      lang,
      canEdit,
      editing: canEdit && editing,
      saveState,
      save,
    }),
    [content, lang, canEdit, editing, saveState, save],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}
