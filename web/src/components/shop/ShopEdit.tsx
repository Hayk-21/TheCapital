"use client";

import { useState, type CSSProperties } from "react";
import { Editable } from "@/components/editor/Editable";
import {
  createBrand,
  createCategory,
  createProduct,
  createVariant,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  deleteVariant,
  moveBrand,
  moveCategory,
  updateBrand,
  updateCategory,
  updateProduct,
  updateVariant,
} from "@/lib/actions";
import { BrandLogoEdit } from "./BrandLogo";
import type { ShopBrand, ShopCategory, ShopProduct, ShopVariant } from "./ShopView";
import type { Lang } from "@/lib/content-schema";

/**
 * Витрина в режиме правки.
 *
 * Каталог редактируется там же, где его видит гость — как тексты на остальных
 * страницах. Отдельные таблицы в админке остаются для массовой работы, а здесь
 * правится то, что перед глазами.
 */

export type Save = (fn: () => Promise<unknown>) => Promise<void>;

const MINI: CSSProperties = {
  font: "inherit",
  fontSize: 12,
  padding: "4px 6px",
  width: 62,
  background: "#17130f",
  border: "1px solid #4a4038",
  color: "#f4f1ee",
};

const digits = (s: string) => Number(s.replace(/[^0-9]/g, "")) || 0;

/** Плитка бренда: имя, порядок, видимость, удаление. */
export function BrandCardEdit({
  brand,
  countLabel,
  onOpen,
  save,
}: {
  brand: ShopBrand;
  countLabel: string;
  onOpen: () => void;
  save: Save;
}) {
  return (
    <div className="cap-brand-card cap-editable-block" style={{ cursor: "default" }}>
      <span className="cap-block-tools">
        <button
          type="button"
          className="cap-tool-btn"
          title="Левее"
          onClick={() => save(() => moveBrand(brand.id, "up"))}
        >
          ←
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          title="Правее"
          onClick={() => save(() => moveBrand(brand.id, "down"))}
        >
          →
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          data-active={brand.isNew ? "true" : undefined}
          title={brand.isNew ? "Убрать бренд из новинок" : "Показать бренд в новинках"}
          onClick={() => save(() => updateBrand(brand.id, { isNew: !brand.isNew }))}
        >
          {brand.isNew ? "не новинка" : "новинка"}
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          title="Скрыть бренд с сайта"
          onClick={() => save(() => updateBrand(brand.id, { visible: false }))}
        >
          скрыть
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          data-danger="true"
          title="Удалить бренд со всеми позициями"
          onClick={() => {
            const n = brand.products.length;
            if (confirm(`Удалить бренд ${brand.name} вместе с позициями (${n})?`))
              save(() => deleteBrand(brand.id));
          }}
        >
          ✕
        </button>
      </span>

      <BrandLogoEdit brandId={brand.id} name={brand.name} save={save} />

      <Editable
        value={brand.name}
        editing
        placeholder="бренд"
        className="cap-brand-name"
        onSave={(next) => save(() => updateBrand(brand.id, { name: next }))}
      />
      <span className="cap-brand-meta">{countLabel}</span>
      <button
        type="button"
        className="cap-tool-btn"
        style={{ marginTop: "auto", alignSelf: "start" }}
        onClick={onOpen}
      >
        открыть позиции →
      </button>
    </div>
  );
}

export function AddBrand({ category, save }: { category: string; save: Save }) {
  const [name, setName] = useState("");

  return (
    <form
      className="cap-brand-card"
      style={{ cursor: "default" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        void save(() => createBrand(category, name)).then(() => setName(""));
      }}
    >
      <span className="cap-brand-meta">новый бренд</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={category === "coal" ? "например 27мм" : "название"}
        style={{ ...MINI, width: "100%", fontSize: 15, padding: "8px 10px" }}
      />
      <button type="submit" className="cap-tool-btn" style={{ alignSelf: "start" }}>
        добавить
      </button>
    </form>
  );
}

/** Карточка позиции: название, фасовки с ценами, наличие, удаление. */
export function ProductCardEdit({ product, save }: { product: ShopProduct; save: Save }) {
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="cap-product cap-editable-block">
      <span className="cap-block-tools">
        <button
          type="button"
          className="cap-tool-btn"
          data-active={product.isNew ? "true" : undefined}
          title={product.isNew ? "Убрать из новинок" : "Показать в новинках"}
          onClick={() => save(() => updateProduct(product.id, { isNew: !product.isNew }))}
        >
          {product.isNew ? "не новинка" : "новинка"}
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          title="Скрыть позицию с сайта"
          onClick={() => save(() => updateProduct(product.id, { visible: false }))}
        >
          скрыть
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          data-danger="true"
          title="Удалить позицию"
          onClick={() => {
            if (confirm(`Удалить позицию ${product.name}?`)) save(() => deleteProduct(product.id));
          }}
        >
          ✕
        </button>
      </span>

      <Editable
        value={product.name}
        editing
        placeholder="название"
        className="cap-product-name"
        onSave={(next) => save(() => updateProduct(product.id, { name: next }))}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {product.variants.map((v) => (
          <VariantEdit key={v.id} variant={v} save={save} />
        ))}
      </div>

      {adding ? (
        <form
          style={{ display: "flex", gap: 4, marginTop: "auto" }}
          onSubmit={(e) => {
            e.preventDefault();
            void save(() => createVariant(product.id, size, digits(price))).then(() => {
              setSize("");
              setPrice("");
              setAdding(false);
            });
          }}
        >
          <input
            autoFocus
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="100 г"
            style={MINI}
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="numeric"
            placeholder="цена"
            style={{ ...MINI, width: 72 }}
          />
          <button type="submit" className="cap-tool-btn">
            ✓
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="cap-tool-btn"
          style={{ alignSelf: "start", marginTop: "auto" }}
          onClick={() => setAdding(true)}
        >
          + фасовка
        </button>
      )}
    </div>
  );
}

/** Фасовка: клик по ней — правка размера и цены, «есть/нет» — наличие. */
function VariantEdit({ variant, save }: { variant: ShopVariant; save: Save }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(variant.size);
  const [price, setPrice] = useState(String(variant.price));

  if (open)
    return (
      <form
        style={{ display: "flex", gap: 4 }}
        onSubmit={(e) => {
          e.preventDefault();
          void save(() => updateVariant(variant.id, { size, price: digits(price) })).then(() =>
            setOpen(false),
          );
        }}
      >
        <input autoFocus value={size} onChange={(e) => setSize(e.target.value)} style={MINI} />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="numeric"
          style={{ ...MINI, width: 72 }}
        />
        <button type="submit" className="cap-tool-btn">
          ✓
        </button>
        <button
          type="button"
          className="cap-tool-btn"
          data-danger="true"
          onClick={() => {
            if (confirm(`Удалить фасовку ${variant.size}?`)) save(() => deleteVariant(variant.id));
          }}
        >
          ✕
        </button>
      </form>
    );

  return (
    <span
      className="cap-size"
      style={{ display: "inline-flex", gap: 6, opacity: variant.inStock ? 1 : 0.5 }}
    >
      <button type="button" className="adm-linkish" onClick={() => setOpen(true)}>
        {variant.size} · {variant.price}
      </button>
      <button
        type="button"
        className="adm-linkish"
        title={variant.inStock ? "Убрать из продажи" : "Вернуть в продажу"}
        onClick={() => save(() => updateVariant(variant.id, { inStock: !variant.inStock }))}
      >
        {variant.inStock ? "есть" : "нет"}
      </button>
    </span>
  );
}

export function AddProduct({ brandId, save }: { brandId: string; save: Save }) {
  const [name, setName] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");

  return (
    <form
      className="cap-product"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        void save(() => createProduct(brandId, name, size, digits(price))).then(() => {
          setName("");
          setSize("");
          setPrice("");
        });
      }}
    >
      <span className="cap-product-brand">новая позиция</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="название"
        style={{ ...MINI, width: "100%", fontSize: 14 }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="25 г"
          style={MINI}
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="numeric"
          placeholder="цена"
          style={{ ...MINI, width: 72 }}
        />
      </div>
      <button
        type="submit"
        className="cap-tool-btn"
        style={{ alignSelf: "start", marginTop: "auto" }}
      >
        добавить
      </button>
    </form>
  );
}

/** Показ скрытых брендов: без этого их не вернуть с витрины. */
export function HiddenBrands({
  brands,
  category,
  save,
}: {
  brands: ShopBrand[];
  category: string;
  save: Save;
}) {
  const hidden = brands.filter((b) => b.category === category && !b.visible);
  if (hidden.length === 0) return null;

  return (
    <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <span className="cap-brand-meta">скрытые:</span>
      {hidden.map((b) => (
        <button
          key={b.id}
          type="button"
          className="cap-tool-btn"
          title="Вернуть на сайт"
          onClick={() => save(() => updateBrand(b.id, { visible: true }))}
        >
          {b.name} ↩
        </button>
      ))}
    </div>
  );
}

export type { Lang };

/**
 * Управление разделами витрины: переименовать, спрятать, сдвинуть, удалить,
 * добавить новый рядом с «Табаками» и «Углями».
 */
export function CategoryTools({
  categories,
  current,
  save,
}: {
  categories: ShopCategory[];
  current: string;
  save: Save;
}) {
  const [adding, setAdding] = useState(false);
  const [titleRu, setTitleRu] = useState("");
  const [titleEn, setTitleEn] = useState("");

  const cat = categories.find((c) => c.key === current);

  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {cat && (
        <>
          <Editable
            value={cat.title.ru}
            editing
            placeholder="раздел"
            style={{ fontSize: 12 }}
            onSave={(next) => save(() => updateCategory(cat.key, { titleRu: next }))}
          />
          <Editable
            value={cat.title.en}
            editing
            placeholder="EN"
            style={{ fontSize: 11, color: "#8e857c" }}
            onSave={(next) => save(() => updateCategory(cat.key, { titleEn: next }))}
          />
          <button
            type="button"
            className="cap-tool-btn"
            title="Левее"
            onClick={() => save(() => moveCategory(cat.key, "up"))}
          >
            ←
          </button>
          <button
            type="button"
            className="cap-tool-btn"
            title="Правее"
            onClick={() => save(() => moveCategory(cat.key, "down"))}
          >
            →
          </button>
          <button
            type="button"
            className="cap-tool-btn"
            title={cat.visible ? "Скрыть раздел с сайта" : "Показать раздел"}
            onClick={() => save(() => updateCategory(cat.key, { visible: !cat.visible }))}
          >
            {cat.visible ? "виден" : "скрыт"}
          </button>
          <button
            type="button"
            className="cap-tool-btn"
            data-danger="true"
            title="Удалить раздел со всем содержимым"
            onClick={() => {
              if (confirm(`Удалить раздел ${cat.title.ru} со всеми брендами и позициями?`))
                save(() => deleteCategory(cat.key));
            }}
          >
            ✕
          </button>
        </>
      )}

      {adding ? (
        <form
          style={{ display: "inline-flex", gap: 4 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!titleRu.trim()) return;
            void save(() => createCategory(titleRu, titleEn)).then(() => {
              setTitleRu("");
              setTitleEn("");
              setAdding(false);
            });
          }}
        >
          <input
            autoFocus
            value={titleRu}
            onChange={(e) => setTitleRu(e.target.value)}
            placeholder="Чаши"
            style={{ ...MINI, width: 90 }}
          />
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="Bowls"
            style={{ ...MINI, width: 90 }}
          />
          <button type="submit" className="cap-tool-btn">
            ✓
          </button>
        </form>
      ) : (
        <button type="button" className="cap-tool-btn" onClick={() => setAdding(true)}>
          + раздел
        </button>
      )}
    </span>
  );
}
