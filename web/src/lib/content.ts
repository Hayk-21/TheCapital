import { db } from "./db";
import { entrySlotKey, listDef, type Lang, type Scope } from "./content-schema";

// Загрузка контента из базы. Типы и хелперы вывода живут в ./view —
// оттуда их импортируют и сервер, и клиентские компоненты.

export * from "./view";
import type {
  EntryData,
  ImageView,
  ListEntryView,
  MenuGroupView,
  PageContent,
  SiteChrome,
} from "./view";

// ─────────────────────────────────────────────────────────────

function parseData(raw: string): EntryData {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as EntryData) : {};
  } catch {
    return {};
  }
}

function emptyImage(key: string, placeholder = ""): ImageView {
  return {
    key,
    src: null,
    width: null,
    height: null,
    alt: { en: "", ru: "" },
    fit: "cover",
    focalX: 50,
    focalY: 50,
    scale: 1,
    placeholder,
  };
}

type SlotRow = {
  key: string;
  fit: string;
  focalX: number;
  focalY: number;
  scale: number;
  placeholder: string | null;
  media: {
    path: string;
    width: number | null;
    height: number | null;
    altEn: string | null;
    altRu: string | null;
  } | null;
};

function toImageView(row: SlotRow): ImageView {
  return {
    key: row.key,
    src: row.media?.path ?? null,
    width: row.media?.width ?? null,
    height: row.media?.height ?? null,
    alt: { en: row.media?.altEn ?? "", ru: row.media?.altRu ?? "" },
    fit: row.fit,
    focalX: row.focalX,
    focalY: row.focalY,
    scale: row.scale,
    placeholder: row.placeholder ?? "",
  };
}

/** Шапка, подвал, контакты — нужны на каждой странице. */
export async function getSiteChrome(): Promise<SiteChrome> {
  const [settingRows, navRows, commonTexts, logoRow] = await Promise.all([
    db.setting.findMany(),
    db.navItem.findMany({ where: { visible: true }, orderBy: { position: "asc" } }),
    db.text.findMany({ where: { scope: "common" } }),
    db.imageSlot.findUnique({ where: { key: "common.logo" }, include: { media: true } }),
  ]);

  return {
    logo: logoRow ? toImageView(logoRow) : emptyImage("common.logo", "Знак"),
    settings: Object.fromEntries(settingRows.map((s) => [s.key, s.value])),
    nav: navRows.map((n) => ({
      id: n.id,
      href: n.href,
      label: { en: n.labelEn, ru: n.labelRu },
      external: n.external,
      position: n.position,
    })),
    common: Object.fromEntries(commonTexts.map((t) => [t.key, { en: t.en, ru: t.ru }])),
  };
}

/** Весь контент одной страницы: тексты, списки, картинки + сквозные блоки. */
export async function getPageContent(scope: Scope): Promise<PageContent> {
  const chrome = await getSiteChrome();

  const [textRows, blocks, slotRows] = await Promise.all([
    db.text.findMany({ where: { scope } }),
    db.listBlock.findMany({
      where: { scope },
      include: { items: { orderBy: { position: "asc" } } },
    }),
    db.imageSlot.findMany({
      where: { key: { startsWith: `${scope}.` } },
      include: { media: true },
    }),
  ]);

  const slots = new Map(slotRows.map((row) => [row.key, toImageView(row)]));

  const lists: Record<string, ListEntryView[]> = {};
  for (const block of blocks) {
    const def = listDef(block.scope, block.key);
    lists[block.key] = block.items.map((item) => {
      const slotKey = entrySlotKey(block.scope, block.key, item.id);
      return {
        id: item.id,
        position: item.position,
        visible: item.visible,
        en: parseData(item.en),
        ru: parseData(item.ru),
        image: def?.image
          ? (slots.get(slotKey) ?? emptyImage(slotKey, def.imagePlaceholder ?? ""))
          : null,
      };
    });
  }

  return {
    ...chrome,
    scope,
    texts: Object.fromEntries(textRows.map((t) => [t.key, { en: t.en, ru: t.ru }])),
    lists,
    images: Object.fromEntries(slots),
  };
}

/** Меню заведения — отдельная сущность, поэтому и грузится отдельно. */
export async function getMenuGroups(): Promise<MenuGroupView[]> {
  const groups = await db.menuGroup.findMany({
    where: { visible: true },
    orderBy: [{ section: "asc" }, { position: "asc" }],
    include: { items: { where: { visible: true }, orderBy: { position: "asc" } } },
  });

  return groups.map((g) => ({
    id: g.id,
    section: g.section,
    title: { en: g.titleEn, ru: g.titleRu },
    note: { en: g.noteEn ?? "", ru: g.noteRu ?? "" },
    position: g.position,
    visible: g.visible,
    items: g.items.map((i) => ({
      id: i.id,
      name: { en: i.nameEn, ru: i.nameRu },
      desc: { en: i.descEn ?? "", ru: i.descRu ?? "" },
      priceAmount: i.priceAmount,
      priceFrom: i.priceFrom,
      position: i.position,
      visible: i.visible,
    })),
  }));
}

/** Всё меню, включая скрытые позиции — для админки. */
export async function getMenuGroupsForAdmin(): Promise<MenuGroupView[]> {
  const groups = await db.menuGroup.findMany({
    orderBy: [{ section: "asc" }, { position: "asc" }],
    include: { items: { orderBy: { position: "asc" } } },
  });

  return groups.map((g) => ({
    id: g.id,
    section: g.section,
    title: { en: g.titleEn, ru: g.titleRu },
    note: { en: g.noteEn ?? "", ru: g.noteRu ?? "" },
    position: g.position,
    visible: g.visible,
    items: g.items.map((i) => ({
      id: i.id,
      name: { en: i.nameEn, ru: i.nameRu },
      desc: { en: i.descEn ?? "", ru: i.descRu ?? "" },
      priceAmount: i.priceAmount,
      priceFrom: i.priceFrom,
      position: i.position,
      visible: i.visible,
    })),
  }));
}
