"use client";

import { useTransition } from "react";
import { deleteMedia } from "@/lib/admin-actions";

export type MediaItem = {
  id: string;
  path: string;
  filename: string;
  width: number | null;
  height: number | null;
  size: number;
  usedIn: string[];
};

function formatSize(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.round(bytes / 1024)} КБ`;
}

export function MediaGrid({ items }: { items: MediaItem[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="adm-media-grid" style={{ opacity: pending ? 0.6 : 1 }}>
      {items.map((item) => (
        <div key={item.id} className="adm-media-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.path} alt={item.filename} />
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, wordBreak: "break-all" }}>{item.filename}</div>
            <div className="adm-hint">
              {item.width}×{item.height} · {formatSize(item.size)}
            </div>
            <div className="adm-hint">
              {item.usedIn.length > 0 ? `Стоит в: ${item.usedIn.join(", ")}` : "Не используется"}
            </div>
            <button
              type="button"
              className="adm-btn"
              data-variant="ghost"
              onClick={() => {
                const warning =
                  item.usedIn.length > 0
                    ? "Картинка стоит на сайте — эти места станут пустыми. Удалить?"
                    : "Удалить картинку?";
                if (confirm(warning))
                  startTransition(async () => {
                    await deleteMedia(item.id);
                  });
              }}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
