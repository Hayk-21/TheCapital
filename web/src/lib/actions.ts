"use server";

import { revalidatePath } from "next/cache";
import { db } from "./db";
import { requireSession } from "./auth";
import { entrySlotKey, listDef, type Lang } from "./content-schema";
import { DELIVERY_FEE, type OrderInput } from "./order";
import { formatHours, isShopOpen, shopHours } from "./hours";

// Все действия редактора живут здесь. Каждое проверяет сессию — server action
// доступен по сети, поэтому «кнопки не видно» защитой не считается.

async function refresh() {
  // Контент используется на всех публичных страницах и в админке.
  revalidatePath("/", "layout");
}

// ─────────────────────────────────────────────────────────────
//  Тексты
// ─────────────────────────────────────────────────────────────

export async function saveText(
  scope: string,
  key: string,
  lang: Lang,
  value: string,
) {
  await requireSession();
  const trimmed = value.replace(/\s+$/g, "");

  await db.text.upsert({
    where: { scope_key: { scope, key } },
    update: { [lang]: trimmed },
    create: {
      scope,
      key,
      en: lang === "en" ? trimmed : "",
      ru: lang === "ru" ? trimmed : "",
    },
  });

  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Списки
// ─────────────────────────────────────────────────────────────

function parse(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Правка одного поля одного элемента списка. */
export async function saveEntryField(
  entryId: string,
  lang: Lang,
  field: string,
  value: string,
) {
  await requireSession();

  const entry = await db.listEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new Error("Элемент не найден");

  const data = parse(entry[lang]);
  data[field] = value.replace(/\s+$/g, "");

  await db.listEntry.update({
    where: { id: entryId },
    data: { [lang]: JSON.stringify(data) },
  });

  await refresh();
}

export async function addEntry(scope: string, key: string) {
  await requireSession();

  const def = listDef(scope, key);
  if (!def) throw new Error(`Неизвестный список: ${scope}.${key}`);

  const block = await db.listBlock.upsert({
    where: { scope_key: { scope, key } },
    update: {},
    create: { scope, key },
  });

  const last = await db.listEntry.findFirst({
    where: { blockId: block.id },
    orderBy: { position: "desc" },
  });

  const blank = JSON.stringify(
    Object.fromEntries(def.fields.map((f) => [f.name, ""])),
  );

  const entry = await db.listEntry.create({
    data: {
      blockId: block.id,
      position: (last?.position ?? -1) + 1,
      en: blank,
      ru: blank,
    },
  });

  if (def.image) {
    await db.imageSlot.create({
      data: {
        key: entrySlotKey(scope, key, entry.id),
        placeholder: def.imagePlaceholder ?? "Фото",
      },
    });
  }

  await refresh();
  return entry.id;
}

export async function deleteEntry(entryId: string) {
  await requireSession();

  const entry = await db.listEntry.findUnique({
    where: { id: entryId },
    include: { block: true },
  });
  if (!entry) return;

  await db.imageSlot.deleteMany({
    where: { key: entrySlotKey(entry.block.scope, entry.block.key, entry.id) },
  });
  await db.listEntry.delete({ where: { id: entryId } });

  await refresh();
}

/** Сдвиг элемента вверх/вниз — меняется местами с соседом. */
export async function moveEntry(entryId: string, direction: "up" | "down") {
  await requireSession();

  const entry = await db.listEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;

  const neighbour = await db.listEntry.findFirst({
    where:
      direction === "up"
        ? { blockId: entry.blockId, position: { lt: entry.position } }
        : { blockId: entry.blockId, position: { gt: entry.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.listEntry.update({
      where: { id: entry.id },
      data: { position: neighbour.position },
    }),
    db.listEntry.update({
      where: { id: neighbour.id },
      data: { position: entry.position },
    }),
  ]);

  await refresh();
}

export async function toggleEntryVisible(entryId: string) {
  await requireSession();
  const entry = await db.listEntry.findUnique({ where: { id: entryId } });
  if (!entry) return;
  await db.listEntry.update({
    where: { id: entryId },
    data: { visible: !entry.visible },
  });
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Картинки
// ─────────────────────────────────────────────────────────────

export async function setSlotMedia(slotKey: string, mediaId: string | null) {
  await requireSession();
  await db.imageSlot.upsert({
    where: { key: slotKey },
    update: { mediaId },
    create: { key: slotKey, mediaId },
  });
  await refresh();
}

export async function updateSlotFraming(
  slotKey: string,
  framing: { fit?: string; focalX?: number; focalY?: number; scale?: number },
) {
  await requireSession();
  await db.imageSlot.update({ where: { key: slotKey }, data: framing });
  await refresh();
}

export async function saveMediaAlt(mediaId: string, lang: Lang, value: string) {
  await requireSession();
  await db.media.update({
    where: { id: mediaId },
    data: lang === "en" ? { altEn: value } : { altRu: value },
  });
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Навигация
// ─────────────────────────────────────────────────────────────

export async function saveNavItem(
  id: string,
  data: { labelEn?: string; labelRu?: string; href?: string; visible?: boolean },
) {
  await requireSession();
  await db.navItem.update({ where: { id }, data });
  await refresh();
}

export async function addNavItem() {
  await requireSession();
  const last = await db.navItem.findFirst({ orderBy: { position: "desc" } });
  const item = await db.navItem.create({
    data: {
      labelEn: "New page",
      labelRu: "Новый пункт",
      href: "/",
      position: (last?.position ?? -1) + 1,
    },
  });
  await refresh();
  return item.id;
}

export async function deleteNavItem(id: string) {
  await requireSession();
  await db.navItem.delete({ where: { id } });
  await refresh();
}

export async function moveNavItem(id: string, direction: "up" | "down") {
  await requireSession();
  const item = await db.navItem.findUnique({ where: { id } });
  if (!item) return;

  const neighbour = await db.navItem.findFirst({
    where:
      direction === "up"
        ? { position: { lt: item.position } }
        : { position: { gt: item.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.navItem.update({ where: { id: item.id }, data: { position: neighbour.position } }),
    db.navItem.update({ where: { id: neighbour.id }, data: { position: item.position } }),
  ]);
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Настройки
// ─────────────────────────────────────────────────────────────

export async function saveSetting(key: string, value: string) {
  await requireSession();
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Меню заведения
// ─────────────────────────────────────────────────────────────

export async function saveMenuGroup(
  id: string,
  data: {
    titleEn?: string;
    titleRu?: string;
    noteEn?: string | null;
    noteRu?: string | null;
    visible?: boolean;
  },
) {
  await requireSession();
  await db.menuGroup.update({ where: { id }, data });
  await refresh();
}

export async function addMenuGroup(section: string) {
  await requireSession();
  const last = await db.menuGroup.findFirst({
    where: { section },
    orderBy: { position: "desc" },
  });
  const group = await db.menuGroup.create({
    data: {
      section,
      titleEn: "New category",
      titleRu: "Новая категория",
      position: (last?.position ?? -1) + 1,
    },
  });
  await refresh();
  return group.id;
}

export async function deleteMenuGroup(id: string) {
  await requireSession();
  await db.menuGroup.delete({ where: { id } });
  await refresh();
}

export async function moveMenuGroup(id: string, direction: "up" | "down") {
  await requireSession();
  const group = await db.menuGroup.findUnique({ where: { id } });
  if (!group) return;

  const neighbour = await db.menuGroup.findFirst({
    where:
      direction === "up"
        ? { section: group.section, position: { lt: group.position } }
        : { section: group.section, position: { gt: group.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.menuGroup.update({ where: { id: group.id }, data: { position: neighbour.position } }),
    db.menuGroup.update({ where: { id: neighbour.id }, data: { position: group.position } }),
  ]);
  await refresh();
}

export async function saveMenuItem(
  id: string,
  data: {
    nameEn?: string;
    nameRu?: string;
    descEn?: string | null;
    descRu?: string | null;
    priceAmount?: number | null;
    priceFrom?: boolean;
    visible?: boolean;
  },
) {
  await requireSession();
  await db.menuItem.update({ where: { id }, data });
  await refresh();
}

export async function addMenuItem(groupId: string) {
  await requireSession();
  const last = await db.menuItem.findFirst({
    where: { groupId },
    orderBy: { position: "desc" },
  });
  const item = await db.menuItem.create({
    data: {
      groupId,
      nameEn: "New item",
      nameRu: "Новая позиция",
      position: (last?.position ?? -1) + 1,
    },
  });
  await refresh();
  return item.id;
}

export async function deleteMenuItem(id: string) {
  await requireSession();
  await db.menuItem.delete({ where: { id } });
  await refresh();
}

export async function moveMenuItem(id: string, direction: "up" | "down") {
  await requireSession();
  const item = await db.menuItem.findUnique({ where: { id } });
  if (!item) return;

  const neighbour = await db.menuItem.findFirst({
    where:
      direction === "up"
        ? { groupId: item.groupId, position: { lt: item.position } }
        : { groupId: item.groupId, position: { gt: item.position } },
    orderBy: { position: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.menuItem.update({ where: { id: item.id }, data: { position: neighbour.position } }),
    db.menuItem.update({ where: { id: neighbour.id }, data: { position: item.position } }),
  ]);
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Брони
// ─────────────────────────────────────────────────────────────

export type BookingInput = {
  name: string;
  phone: string;
  date?: string;
  time?: string;
  guests?: string;
  seating?: string;
  note?: string;
  lang?: string;
};

/** Публичное действие — вызывается формой на странице «Контакты». */
export async function createBooking(input: BookingInput) {
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name || !phone) throw new Error("Имя и телефон обязательны");

  const guests = input.guests ? Number.parseInt(input.guests, 10) : null;

  await db.booking.create({
    data: {
      name: name.slice(0, 120),
      phone: phone.slice(0, 60),
      date: input.date?.slice(0, 40) || null,
      time: input.time?.slice(0, 40) || null,
      guests: Number.isFinite(guests) ? guests : null,
      seating: input.seating?.slice(0, 120) || null,
      note: input.note?.slice(0, 1000) || null,
      lang: input.lang === "ru" ? "ru" : "en",
    },
  });

  revalidatePath("/admin/bookings");
}

export async function updateBooking(
  id: string,
  data: {
    status?: string;
    adminNote?: string;
    date?: string;
    time?: string;
    guests?: number | null;
    seating?: string;
    name?: string;
    phone?: string;
  },
) {
  await requireSession();
  await db.booking.update({
    where: { id },
    data: {
      ...data,
      // Пустое поле означает «не указано», а не пустую строку.
      date: data.date === undefined ? undefined : data.date.trim() || null,
      time: data.time === undefined ? undefined : data.time.trim() || null,
      seating: data.seating === undefined ? undefined : data.seating.trim() || null,
      name: data.name?.trim().slice(0, 120),
      phone: data.phone?.trim().slice(0, 60),
      guests:
        data.guests === undefined ? undefined : Number.isFinite(data.guests) ? data.guests : null,
    },
  });
  revalidatePath("/admin/bookings");
}

export async function deleteBooking(id: string) {
  await requireSession();
  await db.booking.delete({ where: { id } });
  revalidatePath("/admin/bookings");
}

// ─────────────────────────────────────────────────────────────
//  Заказы с сайта
// ─────────────────────────────────────────────────────────────

/**
 * Оформление заказа с сайта.
 *
 * Цены берутся из базы, а не из корзины: в браузере они могли устареть или
 * быть подменены. Названия копируются в строки заказа снимком, чтобы правка
 * меню задним числом не меняла уже оформленный заказ.
 */
export async function createOrder(input: OrderInput) {
  // Часы проверяем на сервере, а не только кнопкой на витрине: server action
  // доступен по сети, и ночной заказ иначе прошёл бы мимо закрытого магазина.
  const hours = shopHours(
    Object.fromEntries(
      (
        await db.setting.findMany({
          where: { key: { in: ["shopOpenFrom", "shopOpenTo"] } },
        })
      ).map((s) => [s.key, s.value]),
    ),
  );
  if (!isShopOpen(hours)) {
    throw new Error(`Заказы принимаем с ${formatHours(hours)}`);
  }

  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name || !phone) throw new Error("Имя и телефон обязательны");

  const kind = input.kind === "pickup" ? "pickup" : "delivery";
  const address = input.address?.trim();
  if (kind === "delivery" && !address) throw new Error("Для доставки нужен адрес");

  const wanted = input.lines
    .filter((l) => l.itemId && Number.isFinite(l.qty) && l.qty > 0)
    .slice(0, 60);
  if (wanted.length === 0) throw new Error("Корзина пуста");

  const variants = await db.productVariant.findMany({
    where: { id: { in: wanted.map((l) => l.itemId) }, inStock: true },
    include: { product: { include: { brand: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines = wanted.flatMap((l) => {
    const v = byId.get(l.itemId);
    if (!v || !v.product.visible || !v.product.brand.visible) return [];
    const title = `${v.product.brand.name} · ${v.product.name}, ${v.size}`;
    return [
      {
        variantId: v.id,
        titleEn: title,
        titleRu: title,
        price: v.price,
        qty: Math.min(Math.floor(l.qty), 50),
        note: l.note?.slice(0, 300) || null,
      },
    ];
  });

  if (lines.length === 0) throw new Error("Этих товаров больше нет в продаже");

  const itemsTotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const deliveryFee = kind === "delivery" ? DELIVERY_FEE : 0;

  const last = await db.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });

  const order = await db.order.create({
    data: {
      number: (last?.number ?? 0) + 1,
      kind,
      name: name.slice(0, 120),
      phone: phone.slice(0, 60),
      address: kind === "delivery" ? address!.slice(0, 300) : null,
      comment: input.comment?.slice(0, 1000) || null,
      // Времени нет: заказ с сайта уходит в работу сразу.
      atTime: null,
      itemsTotal,
      deliveryFee,
      total: itemsTotal + deliveryFee,
      lang: input.lang === "ru" ? "ru" : "en",
      items: { create: lines },
    },
    select: { number: true, total: true },
  });

  revalidatePath("/admin/orders");
  return order;
}

export async function updateOrder(id: string, data: { status?: string; adminNote?: string }) {
  await requireSession();
  await db.order.update({ where: { id }, data });
  revalidatePath("/admin/orders");
}

export async function deleteOrder(id: string) {
  await requireSession();
  await db.order.delete({ where: { id } });
  revalidatePath("/admin/orders");
}

// ─────────────────────────────────────────────────────────────
//  Магазин: бренды, товары, фасовки
// ─────────────────────────────────────────────────────────────

/** Новый бренд встаёт в конец своего раздела. */
export async function createBrand(category: string, name: string) {
  await requireSession();
  const clean = name.trim();
  if (!clean) throw new Error("Нужно название бренда");

  const last = await db.productBrand.findFirst({
    where: { category },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const brand = await db.productBrand.create({
    data: { category, name: clean.slice(0, 120), position: (last?.position ?? -1) + 1 },
  });
  revalidatePath("/admin/shop");
  await refresh();
  return brand.id;
}

export async function updateBrand(
  id: string,
  data: { name?: string; visible?: boolean; category?: string },
) {
  await requireSession();
  await db.productBrand.update({
    where: { id },
    data: { ...data, name: data.name?.trim().slice(0, 120) },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

/** Удаляет бренд вместе с товарами и фасовками. */
export async function deleteBrand(id: string) {
  await requireSession();
  await db.productBrand.delete({ where: { id } });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function moveBrand(id: string, dir: "up" | "down") {
  await requireSession();
  const brand = await db.productBrand.findUnique({ where: { id } });
  if (!brand) return;

  const neighbour = await db.productBrand.findFirst({
    where: {
      category: brand.category,
      position: dir === "up" ? { lt: brand.position } : { gt: brand.position },
    },
    orderBy: { position: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.productBrand.update({ where: { id: brand.id }, data: { position: neighbour.position } }),
    db.productBrand.update({ where: { id: neighbour.id }, data: { position: brand.position } }),
  ]);
  revalidatePath("/admin/shop");
  await refresh();
}

/** Товар заводится сразу с одной фасовкой — без неё его нельзя купить. */
export async function createProduct(brandId: string, name: string, size: string, price: number) {
  await requireSession();
  const clean = name.trim();
  if (!clean) throw new Error("Нужно название");

  const last = await db.product.findFirst({
    where: { brandId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.product.create({
    data: {
      brandId,
      name: clean.slice(0, 200),
      position: (last?.position ?? -1) + 1,
      variants: {
        create: [{ size: size.trim().slice(0, 40) || "—", price: Math.max(0, Math.round(price)) }],
      },
    },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function updateProduct(
  id: string,
  data: { name?: string; visible?: boolean; descEn?: string; descRu?: string },
) {
  await requireSession();
  await db.product.update({
    where: { id },
    data: { ...data, name: data.name?.trim().slice(0, 200) },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function deleteProduct(id: string) {
  await requireSession();
  await db.product.delete({ where: { id } });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function createVariant(productId: string, size: string, price: number) {
  await requireSession();
  await db.productVariant.create({
    data: {
      productId,
      size: size.trim().slice(0, 40) || "—",
      price: Math.max(0, Math.round(price)),
    },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function updateVariant(
  id: string,
  data: { size?: string; price?: number; inStock?: boolean },
) {
  await requireSession();
  await db.productVariant.update({
    where: { id },
    data: {
      ...data,
      size: data.size?.trim().slice(0, 40),
      price: data.price == null ? undefined : Math.max(0, Math.round(data.price)),
    },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function deleteVariant(id: string) {
  await requireSession();
  await db.productVariant.delete({ where: { id } });
  revalidatePath("/admin/shop");
  await refresh();
}

// ─────────────────────────────────────────────────────────────
//  Разделы витрины
// ─────────────────────────────────────────────────────────────

/** Ключ раздела: латиница и цифры, чтобы он читался в адресе и в коде. */
function categoryKey(title: string) {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const slug = title
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug || `cat-${Date.now().toString(36)}`;
}

export async function createCategory(titleRu: string, titleEn?: string) {
  await requireSession();
  const ru = titleRu.trim();
  if (!ru) throw new Error("Нужно название раздела");

  let key = categoryKey(titleEn?.trim() || ru);
  // Ключ уникален: если такой уже есть, добавляем номер.
  for (let i = 2; await db.productCategory.findUnique({ where: { key } }); i++) {
    key = `${categoryKey(titleEn?.trim() || ru)}-${i}`;
  }

  const last = await db.productCategory.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.productCategory.create({
    data: {
      key,
      titleRu: ru.slice(0, 60),
      titleEn: (titleEn?.trim() || ru).slice(0, 60),
      position: (last?.position ?? -1) + 1,
    },
  });
  revalidatePath("/admin/shop");
  await refresh();
  return key;
}

export async function updateCategory(
  key: string,
  data: { titleRu?: string; titleEn?: string; visible?: boolean },
) {
  await requireSession();
  await db.productCategory.update({
    where: { key },
    data: {
      ...data,
      titleRu: data.titleRu?.trim().slice(0, 60),
      titleEn: data.titleEn?.trim().slice(0, 60),
    },
  });
  revalidatePath("/admin/shop");
  await refresh();
}

/** Удаляет раздел вместе с брендами и позициями внутри него. */
export async function deleteCategory(key: string) {
  await requireSession();
  await db.productCategory.delete({ where: { key } });
  revalidatePath("/admin/shop");
  await refresh();
}

export async function moveCategory(key: string, dir: "up" | "down") {
  await requireSession();
  const cat = await db.productCategory.findUnique({ where: { key } });
  if (!cat) return;

  const neighbour = await db.productCategory.findFirst({
    where: { position: dir === "up" ? { lt: cat.position } : { gt: cat.position } },
    orderBy: { position: dir === "up" ? "desc" : "asc" },
  });
  if (!neighbour) return;

  await db.$transaction([
    db.productCategory.update({ where: { key: cat.key }, data: { position: neighbour.position } }),
    db.productCategory.update({ where: { key: neighbour.key }, data: { position: cat.position } }),
  ]);
  revalidatePath("/admin/shop");
  await refresh();
}

/**
 * Заказ, заведённый вручную в админке — например, принятый по телефону.
 *
 * От гостевого отличается тем, что цену доставки ставит сотрудник: он уже
 * знает адрес и договорился с курьером.
 */
export async function createOrderByAdmin(input: {
  kind: "delivery" | "pickup";
  name: string;
  phone: string;
  address?: string;
  comment?: string;
  atTime?: string;
  deliveryFee?: number;
  lines: Array<{ variantId: string; qty: number; note?: string }>;
}) {
  await requireSession();

  const name = input.name?.trim();
  const phone = input.phone?.trim();
  if (!name || !phone) throw new Error("Имя и телефон обязательны");

  const wanted = input.lines.filter((l) => l.variantId && l.qty > 0).slice(0, 60);
  if (wanted.length === 0) throw new Error("Нужна хотя бы одна позиция");

  const variants = await db.productVariant.findMany({
    where: { id: { in: wanted.map((l) => l.variantId) } },
    include: { product: { include: { brand: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const lines = wanted.flatMap((l) => {
    const v = byId.get(l.variantId);
    if (!v) return [];
    const title = `${v.product.brand.name} · ${v.product.name}, ${v.size}`;
    return [
      {
        variantId: v.id,
        titleEn: title,
        titleRu: title,
        price: v.price,
        qty: Math.min(Math.floor(l.qty), 50),
        note: l.note?.slice(0, 300) || null,
      },
    ];
  });
  if (lines.length === 0) throw new Error("Этих позиций больше нет");

  const itemsTotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const deliveryFee = input.kind === "delivery" ? Math.max(0, Math.round(input.deliveryFee ?? 0)) : 0;

  const last = await db.order.findFirst({ orderBy: { number: "desc" }, select: { number: true } });

  const order = await db.order.create({
    data: {
      number: (last?.number ?? 0) + 1,
      kind: input.kind,
      name: name.slice(0, 120),
      phone: phone.slice(0, 60),
      address: input.kind === "delivery" ? input.address?.slice(0, 300) || null : null,
      comment: input.comment?.slice(0, 1000) || null,
      // Времени нет: заказ с сайта уходит в работу сразу.
      atTime: null,
      itemsTotal,
      deliveryFee,
      total: itemsTotal + deliveryFee,
      lang: "ru",
      status: "confirmed", // заказ принят сотрудником, подтверждать нечего
      items: { create: lines },
    },
    select: { number: true },
  });

  revalidatePath("/admin/orders");
  return order.number;
}
