import { db } from "./db";

/**
 * Новинки магазина.
 *
 * Заведение показывает их в двух местах: полосой над шапкой на всех страницах
 * и блоком карточек в начале витрины и меню — гость кафе тоже должен видеть,
 * что привезли новое. Источник один, чтобы полоса и блок не расходились.
 *
 * Новинкой помечают либо весь бренд (привезли новую линейку), либо отдельный
 * вкус. Скидка — это заполненная старая цена у фасовки, она живёт отдельно от
 * «новинки»: товар может быть просто дешевле, не будучи новым.
 */

export type NewsItem = {
  id: string;
  kind: "brand" | "product";
  /** «Sarma Classic» — бренд; у товара он же идёт подписью. */
  brand: string;
  /** Название вкуса; у бренда пусто. */
  name: string | null;
  /** Логотип бренда, если загружен. */
  logo: string | null;
  /** Минимальная цена в продаже; null — если продавать пока нечего. */
  price: number | null;
  /** Цена до скидки у той же фасовки. */
  oldPrice: number | null;
  /** Раздел витрины, чтобы ссылка вела в нужную вкладку. */
  category: string;
};

/** Сколько новинок показываем: больше десятка — это уже не новинки. */
const LIMIT = 12;

export async function getShopNews(): Promise<NewsItem[]> {
  const [brands, products] = await Promise.all([
    db.productBrand.findMany({
      where: { isNew: true, visible: true },
      orderBy: [{ category: "asc" }, { position: "asc" }],
      include: {
        products: {
          where: { visible: true },
          include: { variants: { where: { inStock: true } } },
        },
      },
    }),
    db.product.findMany({
      where: { isNew: true, visible: true, brand: { visible: true } },
      orderBy: { position: "asc" },
      include: {
        brand: { select: { id: true, name: true, category: true, isNew: true } },
        variants: { where: { inStock: true } },
      },
    }),
  ]);

  const ids = [
    ...brands.map((b) => `shop.brand.${b.id}`),
    ...products.map((p) => `shop.brand.${p.brand.id}`),
  ];
  const slots = ids.length
    ? await db.imageSlot.findMany({
        where: { key: { in: ids } },
        include: { media: { select: { path: true } } },
      })
    : [];
  const logos = new Map(slots.map((s) => [s.key, s.media?.path ?? null]));

  /** Самая дешёвая фасовка в продаже — её и показываем в карточке. */
  const cheapest = (variants: Array<{ price: number; oldPrice: number | null }>) => {
    if (variants.length === 0) return { price: null, oldPrice: null };
    const v = variants.reduce((a, b) => (b.price < a.price ? b : a));
    return { price: v.price, oldPrice: v.oldPrice };
  };

  const fromBrands: NewsItem[] = brands.map((b) => ({
    id: b.id,
    kind: "brand",
    brand: b.name,
    name: null,
    logo: logos.get(`shop.brand.${b.id}`) ?? null,
    category: b.category,
    ...cheapest(b.products.flatMap((p) => p.variants)),
  }));

  // Новый вкус внутри нового бренда отдельной карточкой не нужен: бренд уже
  // в списке, иначе вся полоса забьётся одной линейкой.
  const fromProducts: NewsItem[] = products
    .filter((p) => !p.brand.isNew)
    .map((p) => ({
      id: p.id,
      kind: "product",
      brand: p.brand.name,
      name: p.name,
      logo: logos.get(`shop.brand.${p.brand.id}`) ?? null,
      category: p.brand.category,
      ...cheapest(p.variants),
    }));

  return [...fromBrands, ...fromProducts].slice(0, LIMIT);
}
