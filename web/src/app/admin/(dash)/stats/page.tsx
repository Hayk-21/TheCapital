import type { Metadata } from "next";
import { db } from "@/lib/db";
import { StatsCharts } from "@/components/admin/StatsCharts";

export const metadata: Metadata = { title: "Статистика — The Capital" };

const amd = (v: number) => `${v.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;


/** Заказы и заявки в цифрах: сколько, на какую сумму, что берут. */
export default async function StatsPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [orders, bookings, items, brandCount, productCount] = await Promise.all([
    db.order.findMany({
      select: { total: true, status: true, kind: true, createdAt: true },
    }),
    db.booking.findMany({ select: { status: true, createdAt: true } }),
    db.orderItem.findMany({ select: { titleRu: true, qty: true, price: true } }),
    db.productBrand.count({ where: { visible: true } }),
    db.product.count({ where: { visible: true } }),
  ]);

  // Считаем в памяти: заказов пока сотни, отдельные запросы того не стоят.
  const paid = orders.filter((o) => o.status !== "declined");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const week = paid.filter((o) => o.createdAt >= weekAgo);
  const month = paid.filter((o) => o.createdAt >= monthAgo);
  const avg = paid.length ? Math.round(revenue / paid.length) : 0;

  const byStatus = new Map<string, number>();
  for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);

  const top = new Map<string, { qty: number; sum: number }>();
  for (const i of items) {
    const rec = top.get(i.titleRu) ?? { qty: 0, sum: 0 };
    rec.qty += i.qty;
    rec.sum += i.qty * i.price;
    top.set(i.titleRu, rec);
  }
  const bestsellers = [...top.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

  const delivery = paid.filter((o) => o.kind === "delivery").length;

  // Выручка по дням за две недели: пустые дни тоже нужны, иначе график врёт
  // о плотности заказов.
  const DAYS = 14;
  const byDay = new Map<string, { total: number; count: number }>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    byDay.set(d.toISOString().slice(0, 10), { total: 0, count: 0 });
  }
  for (const o of paid) {
    const key = o.createdAt.toISOString().slice(0, 10);
    const rec = byDay.get(key);
    if (rec) {
      rec.total += o.total;
      rec.count += 1;
    }
  }
  const dayPoints = [...byDay.entries()].map(([day, v]) => ({ day, ...v }));

  return (
    <>
      <h1 className="adm-title">Статистика</h1>
      <p className="adm-sub">
        Заказы и заявки за всё время. Отказы в выручку не считаются.
      </p>

      <div className="adm-grid">
        <Card label="Выручка, всего" value={amd(revenue)} hint={`${paid.length} заказов`} />
        <Card
          label="За 30 дней"
          value={amd(month.reduce((s, o) => s + o.total, 0))}
          hint={`${month.length} заказов`}
        />
        <Card
          label="За 7 дней"
          value={amd(week.reduce((s, o) => s + o.total, 0))}
          hint={`${week.length} заказов`}
        />
        <Card label="Средний чек" value={amd(avg)} hint="по всем заказам" />
        <Card
          label="Доставка / навынос"
          value={`${delivery} / ${paid.length - delivery}`}
          hint="в заказах"
        />
        <Card
          label="Заявки на бронь"
          value={String(bookings.length)}
          hint={`новых ${bookings.filter((b) => b.status === "new").length}`}
        />
        <Card label="Товаров в продаже" value={String(productCount)} hint={`${brandCount} брендов`} />
      </div>

      <StatsCharts
        days={dayPoints}
        statuses={[...byStatus.entries()].map(([status, count]) => ({ status, count }))}
        top={bestsellers.map(([title, rec]) => ({ title, qty: rec.qty, sum: rec.sum }))}
      />

      {/* Те же числа таблицей: график показывает соотношение, таблица — точные
          значения и остаётся доступной, если графика не отрисовалась. */}
      {bestsellers.length > 0 && (
        <details style={{ marginTop: 24 }}>
          <summary className="adm-hint" style={{ cursor: "pointer" }}>
            Показать таблицей
          </summary>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Позиция</th>
                  <th>Штук</th>
                  <th>На сумму</th>
                </tr>
              </thead>
              <tbody>
                {bestsellers.map(([title, rec]) => (
                  <tr key={title}>
                    <td>{title}</td>
                    <td>{rec.qty}</td>
                    <td>{amd(rec.sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

    </>
  );
}

function Card({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="adm-card">
      <span className="adm-label">{label}</span>
      <div style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 28 }}>{value}</div>
      {hint && <div className="adm-hint">{hint}</div>}
    </div>
  );
}
