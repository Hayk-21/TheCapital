import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ProductsTable } from "@/components/admin/ProductsTable";

export const metadata: Metadata = { title: "Позиции — The Capital" };

export default async function BrandProductsPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;

  const brand = await db.productBrand.findUnique({
    where: { id: brandId },
    include: {
      products: {
        orderBy: { position: "asc" },
        include: { variants: { orderBy: { price: "asc" } } },
      },
    },
  });
  if (!brand) notFound();

  return (
    <>
      <h1 className="adm-title">{brand.name}</h1>

      <ProductsTable
        brandId={brand.id}
        brandName={brand.name}
        products={brand.products.map((p) => ({
          id: p.id,
          name: p.name,
          visible: p.visible,
          descRu: p.descRu,
          variants: p.variants.map((v) => ({
            id: v.id,
            size: v.size,
            price: v.price,
            inStock: v.inStock,
          })),
        }))}
      />
    </>
  );
}
