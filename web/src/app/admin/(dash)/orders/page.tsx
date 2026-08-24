import type { Metadata } from "next";
import { db } from "@/lib/db";
import { OrdersTable } from "@/components/admin/OrdersTable";

export const metadata: Metadata = { title: "Заказы — The Capital" };

export default async function OrdersPage() {
  const orders = await db.order.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: { items: true },
  });

  return (
    <>
      <h1 className="adm-title">Заказы с сайта</h1>
      <p className="adm-sub">
        Оформляются на странице «Заказ». Оплата при получении, доставку
        подтверждаем по телефону. Показаны последние 200.
      </p>

      {orders.length === 0 ? (
        <div className="adm-card">
          <span className="adm-hint">Заказов пока нет.</span>
        </div>
      ) : (
        <OrdersTable
          orders={orders.map((o) => ({
            id: o.id,
            number: o.number,
            kind: o.kind,
            name: o.name,
            phone: o.phone,
            address: o.address,
            comment: o.comment,
            atTime: o.atTime,
            itemsTotal: o.itemsTotal,
            deliveryFee: o.deliveryFee,
            total: o.total,
            lang: o.lang,
            status: o.status,
            createdAt: o.createdAt.toISOString(),
            items: o.items.map((i) => ({
              id: i.id,
              titleRu: i.titleRu,
              titleEn: i.titleEn,
              price: i.price,
              qty: i.qty,
              note: i.note,
            })),
          }))}
        />
      )}
    </>
  );
}
