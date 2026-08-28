import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CafeCharts, ShopCharts } from "@/components/admin/StatsCharts";

export const metadata: Metadata = { title: "Статистика — The Capital" };

const amd = (v: number) => `${v.toLocaleString("ru-RU").replace(/,/g, " ")} ֏`;

const DAYS = 14;

/**
 * Заказы и заявки в цифрах.
 *
 * Онлайн-магазин и кафе считаются раздельно: это разные дела с разными
 * деньгами, и общая цифра по ним ничего не значит. Магазин — заказы табака
 * и углей с сайта, кафе — заявки на столы.
 */
export default async function StatsPage() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const [orders, bookings, items, brandCount, productCount] = await Promise.all([
    db.order.findMany({
      select: { total: true, status: true, kind: true, createdAt: true },
    }),
    db.booking.findMany({
      select: { status: true, guests: true, seating: true, createdAt: true },
    }),
    db.orderItem.findMany({ select: { titleRu: true, qty: true, price: true } }),
    db.productBrand.count({ where: { visible: true } }),
    db.product.count({ where: { visible: true } }),
  ]);

  // ── Магазин ─────────────────────────────────────────────────
  // Считаем в памяти: заказов пока сотни, отдельные запросы того не стоят.
  const paid = orders.filter((o) => o.status !== "declined");
  const revenue = paid.reduce((s, o) => s + o.total, 0);
  const week = paid.filter((o) => o.createdAt >= weekAgo);
  const month = paid.filter((o) => o.createdAt >= monthAgo);
  const avg = paid.length ? Math.round(revenue / paid.length) : 0;

  const orderStatus = new Map<string, number>();
  for (const o of orders) orderStatus.set(o.status, (orderStatus.get(o.status) ?? 0) + 1);

  const top = new Map<string, { qty: number; sum: number }>();
  for (const i of items) {
    const rec = top.get(i.titleRu) ?? { qty: 0, sum: 0 };
    rec.qty += i.qty;
    rec.sum += i.qty * i.price;
    top.set(i.titleRu, rec);
  }
  const bestsellers = [...top.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);

  const delivery = paid.filter((o) => o.kind === "delivery").length;
  const orderDays = byDay(paid.map((o) => ({ at: o.createdAt, total: o.total })), now);

  // ── Кафе ────────────────────────────────────────────────────
  const live = bookings.filter((b) => b.status !== "declined");
  const bookingWeek = live.filter((b) => b.createdAt >= weekAgo);
  const bookingMonth = live.filter((b) => b.createdAt >= monthAgo);
  const guests = live.reduce((s, b) => s + (b.guests ?? 0), 0);
  const withGuests = live.filter((b) => (b.guests ?? 0) > 0);
  const avgGuests = withGuests.length
    ? Math.round((guests / withGuests.length) * 10) / 10
    : 0;

  const bookingStatus = new Map<string, number>();
  for (const b of bookings) bookingStatus.set(b.status, (bookingStatus.get(b.status) ?? 0) + 1);

  const bookingDays = byDay(live.map((b) => ({ at: b.createdAt, total: 0 })), now);

  return (
    <>
      <h1 className="adm-title">Статистика</h1>
      <p className="adm-sub">
        Онлайн-магазин и кафе считаются отдельно. Отказы в выручку и в счёт
        заявок не идут.
      </p>

      {/* ── Онлайн-магазин ───────────────────────────────────── */}
      <h2 className="adm-title" style={{ fontSize: 20, marginTop: 32 }}>
        Онлайн-магазин
      </h2>
      <p className="adm-sub">Заказы табака и углей с сайта.</p>

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
        <Card label="Товаров в продаже" value={String(productCount)} hint={`${brandCount} брендов`} />
      </div>

      <ShopCharts
        days={orderDays}
        statuses={[...orderStatus.entries()].map(([status, count]) => ({ status, count }))}
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

      {/* ── Кафе ─────────────────────────────────────────────── */}
      <h2 className="adm-title" style={{ fontSize: 20, marginTop: 56 }}>
        Кафе
      </h2>
      <p className="adm-sub">Заявки на столы с формы на странице «Контакты».</p>

      <div className="adm-grid">
        <Card
          label="Заявок, всего"
          value={String(live.length)}
          hint={`новых ${bookingStatus.get("new") ?? 0}`}
        />
        <Card label="За 30 дней" value={String(bookingMonth.length)} hint="без отказов" />
        <Card label="За 7 дней" value={String(bookingWeek.length)} hint="без отказов" />
        <Card
          label="Гостей в заявках"
          value={String(guests)}
          hint={avgGuests ? `в среднем ${avgGuests} на стол` : "число гостей не указывали"}
        />
        <Card
          label="Гость дошёл"
          value={String(bookingStatus.get("done") ?? 0)}
          hint={`подтверждено ${bookingStatus.get("confirmed") ?? 0}`}
        />
        <Card
          label="Отказов"
          value={String(bookingStatus.get("declined") ?? 0)}
          hint="в остальные цифры не входят"
        />
      </div>

      <CafeCharts
        days={bookingDays}
        statuses={[...bookingStatus.entries()].map(([status, count]) => ({ status, count }))}
      />
    </>
  );
}

/**
 * Раскладка событий по дням за две недели.
 *
 * Пустые дни тоже нужны, иначе график врёт о плотности заказов и заявок.
 */
function byDay(events: Array<{ at: Date; total: number }>, now: Date) {
  const map = new Map<string, { total: number; count: number }>();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    map.set(d.toISOString().slice(0, 10), { total: 0, count: 0 });
  }
  for (const e of events) {
    const rec = map.get(e.at.toISOString().slice(0, 10));
    if (rec) {
      rec.total += e.total;
      rec.count += 1;
    }
  }
  return [...map.entries()].map(([day, v]) => ({ day, ...v }));
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
