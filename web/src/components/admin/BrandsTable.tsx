"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createBrand, deleteBrand, moveBrand, updateBrand } from "@/lib/actions";

export type BrandRow = {
  id: string;
  category: string;
  name: string;
  visible: boolean;
  products: number;
  variants: number;
  hidden: number;
};

export type CategoryRow = { key: string; title: string };

export function BrandsTable({
  categories,
  brands,
}: {
  categories: CategoryRow[];
  brands: BrandRow[];
}) {
  const [category, setCategory] = useState(categories[0]?.key ?? "tobacco");
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const rows = brands.filter((b) => b.category === category);

  const run = (fn: () => Promise<unknown>) => startTransition(() => void fn());

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            className="adm-btn"
            data-variant={category === c.key ? undefined : "ghost"}
            onClick={() => setCategory(c.key)}
          >
            {c.title} ({brands.filter((b) => b.category === c.key).length})
          </button>
        ))}
      </div>

      <div className="adm-card" style={{ marginBottom: 24 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim()) return;
            run(async () => {
              await createBrand(category, newName);
              setNewName("");
            });
          }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            className="adm-input"
            style={{ minWidth: 240 }}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={category === "coal" ? "Размер, например 25мм" : "Название бренда"}
          />
          <button type="submit" className="adm-btn" disabled={pending}>
            Добавить бренд
          </button>
        </form>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Бренд</th>
              <th>Позиций</th>
              <th>На сайте</th>
              <th>Порядок</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} style={{ opacity: pending ? 0.6 : 1 }}>
                <td>
                  {editing === b.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(async () => {
                          await updateBrand(b.id, { name: draft });
                          setEditing(null);
                        });
                      }}
                      style={{ display: "flex", gap: 6 }}
                    >
                      <input
                        className="adm-input"
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <button type="submit" className="adm-btn">
                        ОК
                      </button>
                      <button
                        type="button"
                        className="adm-btn"
                        data-variant="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Отмена
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Link href={`/admin/shop/${b.id}`} style={{ fontWeight: 600 }}>
                        {b.name}
                      </Link>
                      <button
                        type="button"
                        className="adm-linkish"
                        style={{ fontSize: 12, color: "#8e857c" }}
                        title="Переименовать"
                        onClick={() => {
                          setEditing(b.id);
                          setDraft(b.name);
                        }}
                      >
                        ✎
                      </button>
                    </div>
                  )}
                </td>

                <td data-tight>
                  {b.products}
                  <div className="adm-hint">
                    {b.variants} фасовок
                    {b.hidden > 0 ? `, ${b.hidden} скрыто` : ""}
                  </div>
                </td>

                <td data-tight>
                  <button
                    type="button"
                    className="adm-btn"
                    data-size="s"
                    data-variant={b.visible ? undefined : "ghost"}
                    onClick={() => run(() => updateBrand(b.id, { visible: !b.visible }))}
                  >
                    {b.visible ? "показан" : "скрыт"}
                  </button>
                </td>

                <td data-tight>
                  <button
                    type="button"
                    className="adm-btn"
                    data-size="s"
                    data-variant="ghost"
                    title="Выше"
                    onClick={() => run(() => moveBrand(b.id, "up"))}
                  >
                    ↑
                  </button>{" "}
                  <button
                    type="button"
                    className="adm-btn"
                    data-size="s"
                    data-variant="ghost"
                    title="Ниже"
                    onClick={() => run(() => moveBrand(b.id, "down"))}
                  >
                    ↓
                  </button>
                </td>

                <td data-tight>
                  <Link
                    href={`/admin/shop/${b.id}`}
                    className="adm-btn"
                    data-size="s"
                    data-variant="ghost"
                  >
                    Позиции →
                  </Link>{" "}
                  <button
                    type="button"
                    className="adm-btn"
                    data-size="s"
                    data-variant="ghost"
                    onClick={() => {
                      if (
                        confirm(
                          `Удалить бренд «${b.name}» вместе с ${b.products} позициями? Это необратимо.`,
                        )
                      )
                        run(() => deleteBrand(b.id));
                    }}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
