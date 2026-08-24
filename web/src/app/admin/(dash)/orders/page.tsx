import type { Metadata } from "next";
import { db } from "@/lib/db";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { NewOrderForm } from "@/components/admin/NewOrderForm";

export const metadata: Metadata = { title: "Заказы — The Capital" };

export default async function OrdersPage() {
  // Каталог для ручного заказа: те же позиции, что видит гость.
  const variants = await db.productVariant.findMany({
    where: { inStock: true, product: { visible: true, brand: { visible: true } } },
    include: { product: { include: { brand: true } } },
    orderBy: { product: { name: "asc" } },
    take: 4000,
  });

  const orders = await db.order.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 200,
    include: { items: true },
  });

  return (
    <>
      <h1 className="adm-title">Заказы</h1>
      <p className="adm-sub">
        Приходят со страницы «Заказ» или заводятся здесь вручную — например,
        принятые по телефону. Показаны последние 200.
      </p>

      <NewOrderForm
        variants={variants.map((v) => ({
          id: v.id,
          label: `${v.product.brand.name} · ${v.product.name}, ${v.size}`,
          price: v.price,
        }))}
      />

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
