"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrderByAdmin } from "@/lib/actions";

export type PickVariant = { id: string; label: string; price: number };

const amd = (v: number) => `${v.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;

/**
 * Заказ, принятый по телефону.
 *
 * Позиции выбираются из того же каталога, что и на сайте, поэтому цена и
 * состав совпадают с витриной. Стоимость доставки сотрудник ставит сам —
 * он уже говорил с гостем и знает адрес.
 */
export function NewOrderForm({ variants }: { variants: PickVariant[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"delivery" | "pickup">("delivery");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Array<{ variantId: string; qty: number }>>([]);
  const [fee, setFee] = useState("1000");
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(variants.map((v) => [v.id, v])), [variants]);

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return variants.filter((v) => v.label.toLowerCase().includes(q)).slice(0, 12);
  }, [variants, query]);

  const itemsTotal = lines.reduce((sum, l) => sum + (byId.get(l.variantId)?.price ?? 0) * l.qty, 0);
  const deliveryFee = kind === "delivery" ? Number(fee.replace(/[^\d]/g, "")) || 0 : 0;

  const add = (id: string) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === id);
      if (i === -1) return [...prev, { variantId: id, qty: 1 }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });
    setQuery("");
  };

  if (!open)
    return (
      <div style={{ marginBottom: 20 }}>
        <button type="button" className="adm-btn" onClick={() => setOpen(true)}>
          + Новый заказ
        </button>
        {done !== null && (
          <span className="adm-hint" style={{ marginLeft: 12 }}>
            Заказ №{done} создан
          </span>
        )}
      </div>
    );

  return (
    <div className="adm-card" style={{ marginBottom: 24 }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const data = new FormData(form);
          setError(null);
          startTransition(async () => {
            try {
              const number = await createOrderByAdmin({
                kind,
                name: String(data.get("name") ?? ""),
                phone: String(data.get("phone") ?? ""),
                address: String(data.get("address") ?? ""),
                comment: String(data.get("comment") ?? ""),
                atTime: String(data.get("atTime") ?? ""),
                deliveryFee,
                lines,
              });
              setDone(number);
              setLines([]);
              setOpen(false);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Не удалось создать заказ");
            }
          });
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {(["delivery", "pickup"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className="adm-btn"
              data-variant={kind === k ? undefined : "ghost"}
              onClick={() => setKind(k)}
            >
              {k === "delivery" ? "Доставка" : "Навынос"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input className="adm-input" name="name" placeholder="Имя гостя" required style={{ minWidth: 180 }} />
          <input className="adm-input" name="phone" placeholder="Телефон" required style={{ minWidth: 160 }} />
          {kind === "delivery" && (
            <input className="adm-input" name="address" placeholder="Адрес" style={{ minWidth: 220 }} />
          )}
          <input className="adm-input" name="atTime" placeholder="Когда" style={{ width: 140 }} />
        </div>

        {/* Поиск по каталогу */}
        <div style={{ position: "relative" }}>
          <input
            className="adm-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Найти позицию — начните вводить название или бренд"
            style={{ width: "100%" }}
          />
          {found.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                marginTop: 6,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {found.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className="adm-btn"
                  data-variant="ghost"
                  style={{ justifyContent: "space-between", textAlign: "left" }}
                  onClick={() => add(v.id)}
                >
                  {v.label} — {amd(v.price)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Собранный заказ */}
        {lines.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((l) => {
              const v = byId.get(l.variantId);
              if (!v) return null;
              return (
                <div
                  key={l.variantId}
                  style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                >
                  <span style={{ flex: 1, minWidth: 200 }}>{v.label}</span>
                  <input
                    className="adm-input"
                    style={{ width: 70 }}
                    inputMode="numeric"
                    value={l.qty}
                    onChange={(e) => {
                      const qty = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                      setLines((prev) =>
                        qty <= 0
                          ? prev.filter((x) => x.variantId !== l.variantId)
                          : prev.map((x) => (x.variantId === l.variantId ? { ...x, qty } : x)),
                      );
                    }}
                  />
                  <span style={{ minWidth: 90, textAlign: "right" }}>{amd(v.price * l.qty)}</span>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant="ghost"
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.variantId !== l.variantId))
                    }
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {kind === "delivery" && (
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span className="adm-hint">Доставка</span>
              <input
                className="adm-input"
                style={{ width: 100 }}
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </label>
          )}
          <span style={{ fontWeight: 700 }}>Итого: {amd(itemsTotal + deliveryFee)}</span>
        </div>

        <input className="adm-input" name="comment" placeholder="Комментарий" />

        {error && <span style={{ color: "var(--color-accent)", fontSize: 14 }}>{error}</span>}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" className="adm-btn" disabled={pending || lines.length === 0}>
            {pending ? "Создаю…" : "Создать заказ"}
          </button>
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            onClick={() => setOpen(false)}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
