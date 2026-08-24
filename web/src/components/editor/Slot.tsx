"use client";

import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
} from "react";
import { useContent } from "./ContentProvider";
import { setSlotMedia, updateSlotFraming } from "@/lib/actions";
import type { ImageView } from "@/lib/view";

/**
 * Место под картинку. В обычном режиме — просто <img> (или заглушка, если
 * фото ещё не загрузили). В режиме редактирования принимает файл перетаскиванием
 * или по клику и умеет двигать кадр.
 */
export function Slot({
  image,
  imgStyle,
  emptyLabel,
}: {
  image: ImageView | null;
  imgStyle?: CSSProperties;
  emptyLabel?: string;
}) {
  const { editing, lang, save } = useContent();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [framing, setFraming] = useState(false);
  const [focal, setFocal] = useState<{ x: number; y: number } | null>(null);

  const slotKey = image?.key;
  const focalX = focal?.x ?? image?.focalX ?? 50;
  const focalY = focal?.y ?? image?.focalY ?? 50;

  const upload = useCallback(
    async (file: File) => {
      if (!slotKey) return;
      setBusy(true);
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body });
        if (!res.ok) throw new Error(await res.text());
        const { id } = (await res.json()) as { id: string };
        await save(() => setSlotMedia(slotKey, id));
      } catch (err) {
        console.error(err);
        alert("Не удалось загрузить картинку");
      } finally {
        setBusy(false);
      }
    },
    [slotKey, save],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) void upload(file);
  };

  // Перетаскивание кадра: считаем позицию курсора в процентах от рамки.
  const onFramePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!framing || e.buttons !== 1 || !boxRef.current) return;
    const rect = boxRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setFocal({ x: Math.round(x), y: Math.round(y) });
  };

  const commitFraming = () => {
    if (!framing || !focal || !slotKey) return;
    void save(() => updateSlotFraming(slotKey, { focalX: focal.x, focalY: focal.y }));
  };

  const alt = image?.alt?.[lang] || image?.alt?.en || "";

  const picture = image?.src ? (
    <img
      src={image.src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{
        objectFit: (image.fit as CSSProperties["objectFit"]) ?? "cover",
        objectPosition: `${focalX}% ${focalY}%`,
        ...imgStyle,
      }}
    />
  ) : (
    <div className="cap-slot-empty">{editing ? (image?.placeholder || emptyLabel || "Фото") : ""}</div>
  );

  if (!editing) return <div className="cap-slot">{picture}</div>;

  return (
    <div
      className="cap-slot cap-slot-wrap"
      ref={boxRef}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onPointerMove={onFramePointerMove}
      onPointerUp={commitFraming}
      style={{ cursor: framing ? "move" : undefined }}
    >
      {picture}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      {!framing && (
        <div
          className="cap-slot-drop"
          data-active={dragOver || busy ? "true" : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Загружаю…" : image?.src ? "Заменить фото" : "Перетащите фото или нажмите"}
        </div>
      )}

      <div className="cap-block-tools" style={{ display: "flex" }}>
        {image?.src && (
          <>
            <button
              type="button"
              className="cap-tool-btn"
              onClick={() => {
                if (framing) commitFraming();
                setFraming((v) => !v);
              }}
              title="Двигать кадр перетаскиванием"
            >
              {framing ? "готово" : "кадр"}
            </button>
            <button
              type="button"
              className="cap-tool-btn"
              onClick={() =>
                slotKey &&
                save(() =>
                  updateSlotFraming(slotKey, {
                    fit: image.fit === "cover" ? "contain" : "cover",
                  }),
                )
              }
              title="Заполнять рамку или показывать целиком"
            >
              {image.fit === "cover" ? "вписать" : "заполнить"}
            </button>
            <button
              type="button"
              className="cap-tool-btn"
              data-danger="true"
              onClick={() => slotKey && save(() => setSlotMedia(slotKey, null))}
              title="Убрать фото"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
}
