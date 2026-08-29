"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteVariant,
  updateProduct,
  updateVariant,
} from "@/lib/actions";

export type VariantRow = {
  id: string;
  size: string;
  price: number;
  /** Цена до скидки: на сайте она зачёркнута рядом с новой. */
  oldPrice: number | null;
  inStock: boolean;
};
export type ProductRow = {
  id: string;
  name: string;
  visible: boolean;
  /** Новый вкус: попадает в новинки на сайте. */
  isNew: boolean;
  descRu: string | null;
  variants: VariantRow[];
};

/** Драмы с пробелом между тысячами. */
const amd = (v: number) => `${v.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;

export function ProductsTable({
  brandId,
  brandName,
  products,
}: {
  brandId: string;
  brandName: string;
  products: ProductRow[];
}) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const run = (fn: () => Promise<unknown>) => startTransition(() => void fn());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);

  return (
    <>
      <p className="adm-sub">
        <Link href="/admin/shop">← Все бренды</Link> · {products.length} позиций,{" "}
        {products.reduce((n, p) => n + p.variants.length, 0)} фасовок
      </p>

      {/* Новая позиция */}
      <div className="adm-card" style={{ marginBottom: 20 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            run(async () => {
              await createProduct(brandId, name, size, Number(price.replace(/[^\d]/g, "")) || 0);
              setName("");
              setSize("");
              setPrice("");
            });
          }}
          style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            className="adm-input"
            style={{ minWidth: 220 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название позиции"
          />
          <input
            className="adm-input"
            style={{ width: 120 }}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="25 г"
          />
          <input
            className="adm-input"
            style={{ width: 120 }}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Цена"
          />
          <button type="submit" className="adm-btn" disabled={pending}>
            Добавить в «{brandName}»
          </button>
        </form>
      </div>

      <input
        className="adm-input"
        style={{ minWidth: 260, marginBottom: 16 }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию"
      />

      <div style={{ overflowX: "auto" }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>Позиция</th>
              <th>Фасовки и цены</th>
              <th>На сайте</th>
              <th>Новинка</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} style={{ opacity: pending ? 0.6 : 1 }}>
                <td style={{ minWidth: 200 }}>
                  {renaming === p.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(async () => {
                          await updateProduct(p.id, { name: draft });
                          setRenaming(null);
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
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="adm-linkish"
                      onClick={() => {
                        setRenaming(p.id);
                        setDraft(p.name);
                      }}
                      title="Переименовать"
                    >
                      {p.name}
                    </button>
                  )}
                </td>

                <td>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {p.variants.map((v) => (
                      <VariantChip key={v.id} variant={v} run={run} />
                    ))}
                    <AddVariant productId={p.id} run={run} />
                  </div>
                </td>

                <td>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant={p.visible ? undefined : "ghost"}
                    onClick={() => run(() => updateProduct(p.id, { visible: !p.visible }))}
                  >
                    {p.visible ? "показана" : "скрыта"}
                  </button>
                </td>

                <td>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant={p.isNew ? undefined : "ghost"}
                    title={
                      p.isNew ? "Убрать из новинок" : "Показать в новинках на сайте"
                    }
                    onClick={() => run(() => updateProduct(p.id, { isNew: !p.isNew }))}
                  >
                    {p.isNew ? "новинка" : "обычная"}
                  </button>
                </td>

                <td>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant="ghost"
                    onClick={() => {
                      if (confirm(`Удалить «${p.name}»?`)) run(() => deleteProduct(p.id));
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

// ─────────────────────────────────────────────────────────────

/** Фасовка: клик по цене — правка, клик по «есть/нет» — наличие. */
function VariantChip({
  variant,
  run,
}: {
  variant: VariantRow;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(variant.size);
  const [price, setPrice] = useState(String(variant.price));
  const [oldPrice, setOldPrice] = useState(variant.oldPrice ? String(variant.oldPrice) : "");

  if (open) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const was = Number(oldPrice.replace(/[^\d]/g, "")) || 0;
            await updateVariant(variant.id, {
              size,
              price: Number(price.replace(/[^\d]/g, "")) || 0,
              // Пустое поле — скидки нет, старая цена стирается.
              oldPrice: was > 0 ? was : null,
            });
            setOpen(false);
          });
        }}
        style={{ display: "flex", gap: 4, alignItems: "center" }}
      >
        <input
          className="adm-input"
          style={{ width: 80 }}
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <input
          className="adm-input"
          style={{ width: 90 }}
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className="adm-input"
          style={{ width: 110 }}
          inputMode="numeric"
          value={oldPrice}
          onChange={(e) => setOldPrice(e.target.value)}
          placeholder="была"
          title="Цена до скидки. Пусто — скидки нет"
        />
        <button type="submit" className="adm-btn">
          ОК
        </button>
        <button
          type="button"
          className="adm-btn"
          data-variant="ghost"
          onClick={() => {
            if (confirm(`Удалить фасовку «${variant.size}»?`)) run(() => deleteVariant(variant.id));
          }}
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--adm-line, #333)",
        padding: "3px 8px",
        opacity: variant.inStock ? 1 : 0.5,
      }}
    >
      <button type="button" className="adm-linkish" onClick={() => setOpen(true)}>
        {variant.size} ·{" "}
        {variant.oldPrice && variant.oldPrice > variant.price ? (
          <>
            <s style={{ opacity: 0.6 }}>{amd(variant.oldPrice)}</s> {amd(variant.price)}
          </>
        ) : (
          amd(variant.price)
        )}
      </button>
      <button
        type="button"
        className="adm-linkish"
        style={{ fontSize: 11 }}
        title={variant.inStock ? "Убрать из продажи" : "Вернуть в продажу"}
        onClick={() => run(() => updateVariant(variant.id, { inStock: !variant.inStock }))}
      >
        {variant.inStock ? "есть" : "нет"}
      </button>
    </span>
  );
}

function AddVariant({
  productId,
  run,
}: {
  productId: string;
  run: (fn: () => Promise<unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");

  if (!open)
    return (
      <button type="button" className="adm-btn" data-variant="ghost" onClick={() => setOpen(true)}>
        + фасовка
      </button>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          await createVariant(productId, size, Number(price.replace(/[^\d]/g, "")) || 0);
          setSize("");
          setPrice("");
          setOpen(false);
        });
      }}
      style={{ display: "flex", gap: 4 }}
    >
      <input
        className="adm-input"
        style={{ width: 80 }}
        autoFocus
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="100 г"
      />
      <input
        className="adm-input"
        style={{ width: 90 }}
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="цена"
      />
      <button type="submit" className="adm-btn">
        ОК
      </button>
    </form>
  );
}
