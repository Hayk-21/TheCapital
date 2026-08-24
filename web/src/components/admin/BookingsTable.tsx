"use client";

import { useState, useTransition } from "react";
import { deleteBooking, updateBooking } from "@/lib/actions";

export type BookingRow = {
  id: string;
  name: string;
  phone: string;
  date: string | null;
  time: string | null;
  guests: number | null;
  seating: string | null;
  note: string | null;
  lang: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
};

const STATUSES: Array<{ value: string; label: string }> = [
  { value: "new", label: "новая" },
  { value: "confirmed", label: "подтверждена" },
  { value: "declined", label: "отказ" },
  { value: "done", label: "гость был" },
];

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Все" },
  ...STATUSES,
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const [filter, setFilter] = useState("all");
  const [pending, startTransition] = useTransition();

  const rows = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count =
            f.value === "all"
              ? bookings.length
              : bookings.filter((b) => b.status === f.value).length;
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
              <th>Когда</th>
              <th>Гость</th>
              <th>На когда</th>
              <th>Детали</th>
              <th>Статус</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} style={{ opacity: pending ? 0.6 : 1 }}>
                <td style={{ whiteSpace: "nowrap", color: "#8e857c" }}>
                  {formatDate(b.createdAt)}
                  <div className="adm-hint">{b.lang.toUpperCase()}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <a href={`tel:${b.phone}`} style={{ fontSize: 13 }}>
                    {b.phone}
                  </a>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {b.date || "—"}
                  {b.time ? `, ${b.time}` : ""}
                  <div className="adm-hint">{b.guests ? `${b.guests} гостей` : ""}</div>
                </td>
                <td style={{ maxWidth: 260 }}>
                  {b.seating && <div>{b.seating}</div>}
                  {b.note && <div className="adm-hint">{b.note}</div>}
                </td>
                <td>
                  <select
                    className="adm-input"
                    style={{ minWidth: 150 }}
                    defaultValue={b.status}
                    onChange={(e) =>
                      startTransition(async () => {
                        await updateBooking(b.id, { status: e.target.value });
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
                    data-status={b.status}
                    style={{ marginTop: 8, display: "inline-block" }}
                  >
                    {STATUSES.find((s) => s.value === b.status)?.label ?? b.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant="ghost"
                    onClick={() => {
                      if (confirm(`Удалить заявку от ${b.name}?`))
                        startTransition(async () => {
                          await deleteBooking(b.id);
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
