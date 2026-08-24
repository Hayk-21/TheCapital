"use client";

import { useState, useTransition } from "react";
import { deleteOrder, updateOrder } from "@/lib/actions";

export type OrderRow = {
  id: string;
  number: number;
  kind: string;
  name: string;
  phone: string;
  address: string | null;
  comment: string | null;
  atTime: string | null;
  itemsTotal: number;
  deliveryFee: number;
  total: number;
  lang: string;
  status: string;
  createdAt: string;
  items: Array<{ id: string; titleRu: string; titleEn: string; price: number; qty: number; note: string | null }>;
};

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "new", label: "новый" },
  { value: "confirmed", label: "подтверждён" },
  { value: "delivering", label: "в доставке" },
  { value: "done", label: "выполнен" },
  { value: "declined", label: "отказ" },
];

const FILTERS = [{ value: "all", label: "Все" }, ...STATUSES];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Драмы с разделителем — в админке всегда по-русски. */
function amd(value: number) {
  return `${value.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();

  const rows = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? orders.length : orders.filter((o) => o.status === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              className="adm-btn"
              data-variant={filter === f.value ? undefined : "ghost"}
              onClick={() => setFilter(f.value)}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="adm-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Гость</th>
              <th>Куда</th>
              <th>Заказ</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} style={{ opacity: pending ? 0.6 : 1 }}>
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ fontWeight: 700 }}>№{o.number}</div>
                  <div className="adm-hint">{formatDate(o.createdAt)}</div>
                  <div className="adm-hint">{o.lang.toUpperCase()}</div>
                </td>

                <td>
                  <div style={{ fontWeight: 600 }}>{o.name}</div>
                  <a href={`tel:${o.phone}`} style={{ fontSize: 13 }}>
                    {o.phone}
                  </a>
                </td>

                <td style={{ maxWidth: 220 }}>
                  <span className="adm-pill">
                    {o.kind === "pickup" ? "навынос" : "доставка"}
                  </span>
                  {o.address && <div style={{ marginTop: 6 }}>{o.address}</div>}
                  {o.atTime && <div className="adm-hint">на {o.atTime}</div>}
                  {o.comment && <div className="adm-hint">{o.comment}</div>}
                </td>

                <td style={{ maxWidth: 320 }}>
                  {o.items.map((it) => (
                    <div key={it.id} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600 }}>{it.qty} × </span>
                      {o.lang === "ru" ? it.titleRu : it.titleEn}
                      <span className="adm-hint" style={{ display: "inline", marginLeft: 6 }}>
                        {amd(it.price * it.qty)}
                      </span>
                      {it.note && <div className="adm-hint">↳ {it.note}</div>}
                    </div>
                  ))}
                </td>

                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ fontWeight: 700 }}>{amd(o.total)}</div>
                  {o.deliveryFee > 0 && (
                    <div className="adm-hint">
                      {amd(o.itemsTotal)} + {amd(o.deliveryFee)} доставка
                    </div>
                  )}
                </td>

                <td>
                  <select
                    className="adm-input"
                    style={{ minWidth: 150 }}
                    defaultValue={o.status}
                    onChange={(e) =>
                      startTransition(async () => {
                        await updateOrder(o.id, { status: e.target.value });
                      })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="adm-pill"
                    data-status={o.status}
                    style={{ marginTop: 8, display: "inline-block" }}
                  >
                    {STATUSES.find((s) => s.value === o.status)?.label ?? o.status}
                  </span>
                </td>

                <td>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant="ghost"
                    onClick={() => {
                      if (confirm(`Удалить заказ №${o.number}?`))
                        startTransition(async () => {
                          await deleteOrder(o.id);
                        });
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
