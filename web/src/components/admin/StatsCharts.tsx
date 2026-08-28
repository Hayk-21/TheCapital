"use client";

import { useState } from "react";

/**
 * Графики статистики — общие для магазина и для кафе.
 *
 * Рисуются вручную в SVG, без библиотеки: три простые формы не стоят лишних
 * ста килобайт в бандле админки.
 *
 * Магазин и кафе живут на странице раздельно, но формы у них одни и те же:
 * столбики по дням и полосы по этапам. Отличается только то, что считается —
 * драмы у заказов, штуки у заявок.
 *
 * Палитра проверена валидатором на тёмной поверхности карточки (#1c1714):
 * шкала этапов — один синий хью светлее→темнее с различимыми шагами, выручка
 * и топ позиций — одиночные серии фирменным акцентом. Отказ намеренно серый,
 * а не красный: рядом с акцентом красный от него не отличается.
 */

const AMD = (v: number) => `${v.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;

const INK = "#f4f1ee";
const INK_2 = "#a89f96";
const INK_3 = "#8e857c";
const GRID = "#2c2521";
const ACCENT = "#ec3013";

/** Этапы заказа: один хью, светлее → темнее по мере продвижения. */
const STAGE_COLOR: Record<string, string> = {
  new: "#9ec5f4",
  confirmed: "#5598e7",
  delivering: "#2a78d6",
  done: "#184f95",
  declined: "#57534e", // выбыл — нейтральный, не участвует в шкале
};

const STAGE_LABEL: Record<string, string> = {
  new: "новые",
  confirmed: "подтверждены",
  delivering: "в доставке",
  done: "выполнены",
  declined: "отказ",
};

/** У брони свои слова для тех же этапов. */
const BOOKING_STAGE_LABEL: Record<string, string> = {
  new: "новые",
  confirmed: "подтверждены",
  done: "гость был",
  declined: "отказ",
};

export type DayPoint = { day: string; total: number; count: number };
export type StatusPoint = { status: string; count: number };
export type TopPoint = { title: string; qty: number; sum: number };

/** Графики магазина: деньги по дням, этапы заказа, что берут. */
export function ShopCharts({
  days,
  statuses,
  top,
}: {
  days: DayPoint[];
  statuses: StatusPoint[];
  top: TopPoint[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <BarsChart
        days={days}
        title="Выручка по дням"
        mode="money"
        emptyText="За этот период заказов не было — как появятся, здесь будут столбики по дням."
      />
      <div className="adm-charts-row">
        <StatusChart statuses={statuses} title="Заказы по этапам" empty="Заказов пока нет." />
        <TopChart top={top} />
      </div>
    </div>
  );
}

/** Графики кафе: заявки на бронь по дням и по этапам. */
export function CafeCharts({ days, statuses }: { days: DayPoint[]; statuses: StatusPoint[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <BarsChart
        days={days}
        title="Заявки по дням"
        mode="count"
        emptyText="За этот период заявок не было — как появятся, здесь будут столбики по дням."
      />
      <div className="adm-charts-row">
        <StatusChart
          statuses={statuses}
          title="Заявки по этапам"
          empty="Заявок пока нет."
          labels={BOOKING_STAGE_LABEL}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

/**
 * Столбики по дням: дни дискретны и их немного.
 *
 * mode="money" рисует выручку, mode="count" — количество: заявка на бронь
 * денег не приносит, но считать её по дням всё равно нужно.
 */
function BarsChart({
  days,
  title,
  mode,
  emptyText,
}: {
  days: DayPoint[];
  title: string;
  mode: "money" | "count";
  emptyText: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const value = (d: DayPoint) => (mode === "money" ? d.total : d.count);
  const label = (v: number) => (mode === "money" ? AMD(v) : String(v));
  const max = Math.max(1, ...days.map(value));
  const W = 720;
  const H = 220;
  const PAD_L = 8;
  const PAD_B = 26;
  const PAD_T = 12;
  const plotH = H - PAD_B - PAD_T;
  const slot = (W - PAD_L * 2) / Math.max(1, days.length);
  const barW = Math.max(4, Math.min(26, slot - 6));

  const empty = days.every((d) => value(d) === 0);

  return (
    <section className="adm-card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="adm-chart-title">{title}</h2>
        <span className="adm-hint">последние {days.length} дней</span>
      </header>

      {empty ? (
        <p className="adm-hint" style={{ margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            role="img"
            aria-label={title}
            style={{ display: "block", overflow: "visible" }}
          >
            {/* Сетка: три линии, чтобы читались порядки, и ни одной лишней. */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={PAD_L}
                x2={W - PAD_L}
                y1={PAD_T + plotH * (1 - f)}
                y2={PAD_T + plotH * (1 - f)}
                stroke={GRID}
                strokeWidth={1}
              />
            ))}

            {days.map((d, i) => {
              const v = value(d);
              const h = v === 0 ? 0 : Math.max(3, (v / max) * plotH);
              const x = PAD_L + i * slot + (slot - barW) / 2;
              const y = PAD_T + plotH - h;
              const active = hover === i;
              return (
                <g key={d.day}>
                  {/* Прозрачная зона наведения шире столбика — попасть проще. */}
                  <rect
                    x={PAD_L + i * slot}
                    y={PAD_T}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                  {h > 0 && (
                    <rect
                      x={x}
                      y={y}
                      width={barW}
                      height={h}
                      rx={4}
                      fill={ACCENT}
                      opacity={hover === null || active ? 1 : 0.45}
                      pointerEvents="none"
                    />
                  )}
                  {active && (
                    <text
                      x={x + barW / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fill={INK}
                      fontSize={12}
                      fontWeight={700}
                      pointerEvents="none"
                    >
                      {label(v)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Подписи дат: только края и середина, иначе слипаются. */}
            {days.map((d, i) => {
              const showAt = [0, Math.floor(days.length / 2), days.length - 1];
              if (!showAt.includes(i)) return null;
              return (
                <text
                  key={d.day}
                  x={PAD_L + i * slot + slot / 2}
                  y={H - 8}
                  textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"}
                  fill={INK_3}
                  fontSize={11}
                >
                  {d.day.slice(5).replace("-", ".")}
                </text>
              );
            })}
          </svg>

          <div className="adm-hint">
            Максимум за день — {label(max)}. Наведите на столбик, чтобы увидеть значение.
          </div>
        </>
      )}
    </section>
  );
}

/** Этапы горизонтальными полосами, шкала одного хью. */
function StatusChart({
  statuses,
  title,
  empty,
  labels = STAGE_LABEL,
}: {
  statuses: StatusPoint[];
  title: string;
  empty: string;
  labels?: Record<string, string>;
}) {
  const order = ["new", "confirmed", "delivering", "done", "declined"];
  const rows = order
    .map((s) => ({ status: s, count: statuses.find((x) => x.status === s)?.count ?? 0 }))
    .filter((r) => r.count > 0);

  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className="adm-card">
      <h2 className="adm-chart-title">{title}</h2>

      {rows.length === 0 ? (
        <p className="adm-hint" style={{ margin: 0 }}>
          {empty}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 120, fontSize: 13, color: INK_2 }}>
                {labels[r.status] ?? r.status}
              </span>
              <div style={{ flex: 1, height: 14, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: GRID,
                    borderRadius: 4,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${(r.count / max) * 100}%`,
                    background: STAGE_COLOR[r.status] ?? INK_3,
                    borderRadius: 4,
                  }}
                />
              </div>
              <span style={{ width: 34, textAlign: "right", fontWeight: 700 }}>{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Топ позиций: горизонтальные полосы, одна серия — длина и есть значение. */
function TopChart({ top }: { top: TopPoint[] }) {
  const rows = top.slice(0, 7);
  const max = Math.max(1, ...rows.map((r) => r.qty));

  return (
    <section className="adm-card">
      <h2 className="adm-chart-title">Что берут чаще всего</h2>

      {rows.length === 0 ? (
        <p className="adm-hint" style={{ margin: 0 }}>
          Пока не из чего считать.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.title} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: INK_2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.title}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                  {r.qty} шт · {AMD(r.sum)}
                </span>
              </div>
              <div style={{ height: 10, position: "relative" }}>
                <div style={{ position: "absolute", inset: 0, background: GRID, borderRadius: 4 }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${(r.qty / max) * 100}%`,
                    background: ACCENT,
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
