import type { Metadata } from "next";
import { db } from "@/lib/db";
import { MediaGrid } from "@/components/admin/MediaGrid";

export const metadata: Metadata = { title: "Картинки — The Capital" };

export default async function MediaPage() {
  const media = await db.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { slots: true },
  });

  return (
    <>
      <h1 className="adm-title">Картинки</h1>
      <p className="adm-sub">
        Всё, что загрузили через редактор. Файлы пережимаются в webp и лежат в
        папке <code>public/uploads</code>.
      </p>

      {media.length === 0 ? (
        <div className="adm-card">
          <span className="adm-hint">
            Пока пусто. Откройте страницу в режиме правки и перетащите фото в любое
            место под картинку.
          </span>
        </div>
      ) : (
        <MediaGrid
          items={media.map((m) => ({
            id: m.id,
            path: m.path,
            filename: m.filename,
            width: m.width,
            height: m.height,
            size: m.size,
            usedIn: m.slots.map((s) => s.key),
          }))}
        />
      )}
    </>
  );
}
