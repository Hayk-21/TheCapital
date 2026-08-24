"use client";

import { useMemo, useState } from "react";
import { useContent } from "@/components/editor/ContentProvider";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/lib/view";
import { INPUT, PAGE, PAGE_KICKER, PAGE_TITLE } from "@/components/site/styles";
import type { Lang } from "@/lib/content-schema";

export type ShopVariant = { id: string; size: string; price: number; inStock: boolean };
export type ShopProduct = { id: string; name: string; variants: ShopVariant[] };
export type ShopBrand = { id: string; category: string; name: string; products: ShopProduct[] };

/**
 * Витрина в два шага: сначала бренды, потом вкусы выбранного бренда.
 *
 * Товаров под тысячу, поэтому одним списком их показывать нельзя — гость
 * тонет. Каталог всё равно отдаётся страницей целиком: фильтрация и поиск
 * идут в браузере, без запроса на каждый символ.
 */
export function ShopView({ brands }: { brands: ShopBrand[] }) {
  const { lang, content } = useContent();
  const { add } = useCart();

  const [category, setCategory] = useState("tobacco");
  const [openBrand, setOpenBrand] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const searching = query.trim().length > 0;

  const inCategory = useMemo(
    () => brands.filter((b) => b.category === category),
    [brands, category],
  );

  const brand = openBrand ? brands.find((b) => b.id === openBrand) ?? null : null;

  // Поиск идёт по всему разделу, не только по открытому бренду.
  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return inCategory
      .map((b) => ({
        brand: b,
        products: b.products.filter((p) => p.name.toLowerCase().includes(q)),
      }))
      .filter((x) => x.products.length > 0);
  }, [inCategory, query]);

  const priceRange = (b: ShopBrand) => {
    const prices = b.products.flatMap((p) => p.variants.filter((v) => v.inStock).map((v) => v.price));
    if (prices.length === 0) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const addLine = (b: ShopBrand, p: ShopProduct, v: ShopVariant) =>
    add({
      itemId: v.id,
      titleEn: `${b.name} · ${p.name}`,
      titleRu: `${b.name} · ${p.name}`,
      size: v.size,
      price: v.price,
    });

  return (
    <div style={PAGE}>
      <Header />

      {/* ── Шапка страницы ─────────────────────────────────── */}
      <section className="cap-shop-head">
        <span style={PAGE_KICKER}>{t("Hookah shop", "Наши дистрибуции")}</span>
        <h1 style={PAGE_TITLE}>{t("Tobacco and coal, delivered.", "Табак и угли, с доставкой.")}</h1>
        <p style={{ margin: 0, maxWidth: "56ch", color: "#a89f96", lineHeight: 1.6, fontSize: 17 }}>
          {t(
            "What we keep on the shelf, now to take home. Delivery across Yerevan, payment on receipt.",
            "То, что стоит у нас на полке, теперь можно забрать домой. Доставка по Еревану, оплата при получении.",
          )}
        </p>
      </section>

      {brands.length === 0 ? (
        <section className="cap-shop-section" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "#a89f96", fontSize: 16, margin: 0 }}>
            {t(
              "The shop is being filled in. Call us and we will sort it out by phone.",
              "Магазин пока наполняется. Позвоните — соберём заказ по телефону.",
            )}
          </p>
          <a
            href={`tel:${content.settings.phoneHref ?? ""}`}
            className="btn btn-primary"
            style={{ alignSelf: "start" }}
          >
            {content.settings.phone ?? ""}
          </a>
        </section>
      ) : (
        <>
          {/* ── Панель: разделы и поиск ───────────────────── */}
          <div className="cap-shop-bar">
            <div className="cap-shop-bar-inner">
            <div style={{ display: "flex", border: "2px solid #4a4038", flex: "0 0 auto" }}>
              {[
                { key: "tobacco", label: t("Tobacco", "Табаки") },
                { key: "coal", label: t("Coal", "Угли") },
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setCategory(c.key);
                    setOpenBrand(null);
                    setQuery("");
                  }}
                  className="cap-shop-tab"
                  data-active={category === c.key}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Search by flavour", "Поиск по вкусу")}
              style={{ ...INPUT, maxWidth: 300, padding: "9px 12px" }}
            />

            {brand && !searching && (
              <button type="button" className="cap-shop-back" onClick={() => setOpenBrand(null)}>
                ← {t("All brands", "Все бренды")}
              </button>
            )}
            </div>
          </div>

          {/* ── Результаты поиска по всему разделу ────────── */}
          {searching && (
            <section className="cap-shop-section">
              <p className="cap-shop-count">
                {found.reduce((n, x) => n + x.products.length, 0)}{" "}
                {t("found", "найдено")}
              </p>
              {found.length === 0 && (
                <p style={{ color: "#a89f96" }}>{t("Nothing found.", "Ничего не нашлось.")}</p>
              )}
              {found.map(({ brand: b, products }) => (
                <div key={b.id} style={{ marginBottom: 40 }}>
                  <h2 className="cap-shop-brand-title">{b.name}</h2>
                  <div className="cap-shop-grid">
                    {products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        brandName={b.name}
                        lang={lang}
                        onAdd={(v) => addLine(b, p, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ── Список брендов ────────────────────────────── */}
          {!searching && !brand && (
            <section className="cap-shop-section">
              <div className="cap-brand-grid">
                {inCategory.map((b) => {
                  const range = priceRange(b);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className="cap-brand-card"
                      onClick={() => setOpenBrand(b.id)}
                    >
                      <span className="cap-brand-name">{b.name}</span>
                      <span className="cap-brand-meta">
                        {b.products.length} {plural(b.products.length, lang, b.category)}
                      </span>
                      {range && (
                        <span className="cap-brand-price">
                          {range.min === range.max
                            ? formatPrice(range.min, false, lang)
                            : `${formatPrice(range.min, false, lang)} — ${formatPrice(range.max, false, lang)}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Товары бренда ─────────────────────────────── */}
          {!searching && brand && (
            <section className="cap-shop-section">
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 24,
                }}
              >
                <h2 className="cap-shop-brand-title" style={{ margin: 0 }}>
                  {brand.name}
                </h2>
                <span className="cap-shop-count" style={{ margin: 0 }}>
                  {brand.products.length} {plural(brand.products.length, lang, brand.category)}
                </span>
              </div>

              <div className="cap-shop-grid">
                {brand.products.map((p) => (
                  <ProductCard key={p.id} product={p} lang={lang} onAdd={(v) => addLine(brand, p, v)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Footer narrow />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

/** «88 вкусов» для табака, «6 позиций» для углей — у угля вкуса нет. */
function plural(n: number, lang: Lang, category: string) {
  const coal = category === "coal";
  if (lang !== "ru") {
    if (coal) return n === 1 ? "item" : "items";
    return n === 1 ? "flavour" : "flavours";
  }
  const last = n % 10;
  const tens = n % 100;
  const many = coal ? "позиций" : "вкусов";
  if (tens >= 11 && tens <= 14) return many;
  if (last === 1) return coal ? "позиция" : "вкус";
  if (last >= 2 && last <= 4) return coal ? "позиции" : "вкуса";
  return many;
}

function ProductCard({
  product,
  brandName,
  lang,
  onAdd,
}: {
  product: ShopProduct;
  /** Показываем бренд только там, где вкусы разных брендов идут вперемешку. */
  brandName?: string;
  lang: Lang;
  onAdd: (v: ShopVariant) => void;
}) {
  const sellable = product.variants.filter((v) => v.inStock);
  const [picked, setPicked] = useState(sellable[0]?.id ?? "");
  const variant = sellable.find((v) => v.id === picked) ?? sellable[0];
  const [justAdded, setJustAdded] = useState(false);

  const t = (en: string, ru: string) => (lang === "ru" ? ru : en);

  return (
    <div className="cap-product">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="cap-product-name">{product.name}</span>
        {brandName && <span className="cap-product-brand">{brandName}</span>}
      </div>

      {!variant ? (
        <span className="cap-product-out">{t("Out of stock", "Нет в наличии")}</span>
      ) : (
        <>
          {sellable.length > 1 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {sellable.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setPicked(v.id)}
                  className="cap-size"
                  data-active={v.id === variant.id}
                >
                  {v.size}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="cap-product-price">{formatPrice(variant.price, false, lang)}</span>
              {sellable.length === 1 && <span className="cap-product-size">{variant.size}</span>}
            </div>
            <button
              type="button"
              className="cap-cart-btn"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                onAdd(variant);
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 900);
              }}
              aria-label={t("Add to order", "Добавить в заказ")}
            >
              {justAdded ? "✓" : "+"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
