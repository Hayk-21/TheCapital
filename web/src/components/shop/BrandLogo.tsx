"use client";

import { useRef, useState } from "react";
import { useContent } from "@/components/editor/ContentProvider";
import { setSlotMedia } from "@/lib/actions";
import { uploadImage } from "@/lib/upload-client";

/**
 * Логотип бренда на плитке витрины.
 *
 * Картинка живёт в обычном слоте `shop.brand.<id>`, как остальные фото сайта:
 * значит она сама приезжает вместе с контентом страницы, её видно в медиатеке
 * и её можно заменить прямо на витрине в режиме правки.
 */

/** Ключ слота под логотип бренда. */
export function brandSlotKey(brandId: string) {
  return `shop.brand.${brandId}`;
}

export function BrandLogo({
  brandId,
  name,
  size = "sm",
}: {
  brandId: string;
  name: string;
  /** «lg» — рядом с заголовком открытого бренда, там места больше. */
  size?: "sm" | "lg";
}) {
  const { content } = useContent();
  const src = content.images[brandSlotKey(brandId)]?.src ?? null;
  if (!src) return null;

  return (
    <span className={size === "lg" ? "cap-brand-logo cap-brand-logo-lg" : "cap-brand-logo"}>
      <img src={src} alt={name} loading="lazy" decoding="async" />
    </span>
  );
}

/** То же место в режиме правки: клик — выбрать файл, ✕ — убрать. */
export function BrandLogoEdit({
  brandId,
  name,
  save,
}: {
  brandId: string;
  name: string;
  save: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const { content } = useContent();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const key = brandSlotKey(brandId);
  const src = content.images[key]?.src ?? null;

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const id = await uploadImage(file);
      await save(() => setSlotMedia(key, id));
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить логотип");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="cap-brand-logo" data-edit="true">
      {src ? <img src={src} alt={name} /> : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pick(file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        className="cap-tool-btn"
        onClick={() => inputRef.current?.click()}
        title="Логотип бренда"
      >
        {busy ? "загружаю…" : src ? "заменить" : "+ логотип"}
      </button>

      {src && (
        <button
          type="button"
          className="cap-tool-btn"
          data-danger="true"
          title="Убрать логотип"
          onClick={() => save(() => setSlotMedia(key, null))}
        >
          ✕
        </button>
      )}
    </span>
  );
}
