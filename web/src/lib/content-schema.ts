// Описание контента сайта: какие есть тексты, списки и слоты под картинки.
//
// Это единственное место, где перечислена структура. Редактор берёт отсюда,
// какие поля рисовать при добавлении элемента, сид — что создавать при первом
// запуске, а страницы — какие ключи запрашивать. Добавили новый блок на
// страницу — дописали сюда, и он сразу редактируемый.

export const LANGS = ["en", "ru"] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_LABEL: Record<Lang, string> = { en: "EN", ru: "RU" };

/** Страницы сайта. "common" — сквозные элементы (шапка, подвал). */
export const SCOPES = ["common", "home", "menu", "shop", "visit"] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_LABEL: Record<Scope, string> = {
  common: "Общее",
  home: "Главная",
  menu: "Меню",
  shop: "Наши дистрибуции",
  visit: "Контакты",
};

// ─────────────────────────────────────────────────────────────
//  Списки
// ─────────────────────────────────────────────────────────────

export type FieldKind = "line" | "multiline";

export type ListField = {
  /** Ключ поля внутри JSON элемента. */
  name: string;
  /** Подпись в редакторе. */
  label: string;
  kind: FieldKind;
};

export type ListDef = {
  scope: Scope;
  key: string;
  /** Название списка в админке. */
  title: string;
  fields: ListField[];
  /** У элемента есть собственная картинка (слот `${scope}.${key}.${entryId}`). */
  image?: boolean;
  /** Подсказка для пустого слота такого элемента. */
  imagePlaceholder?: string;
};

export const LISTS = {
  "home.facts": {
    scope: "home",
    key: "facts",
    title: "Цифры под шапкой",
    fields: [
      { name: "value", label: "Значение", kind: "line" },
      { name: "label", label: "Подпись", kind: "line" },
    ],
  },
  "home.aboutTags": {
    scope: "home",
    key: "aboutTags",
    title: "Теги в блоке «О нас»",
    fields: [{ name: "text", label: "Текст", kind: "line" }],
  },
  "home.teasers": {
    scope: "home",
    key: "teasers",
    title: "Карточки «Что у нас есть»",
    image: true,
    imagePlaceholder: "Фото карточки",
    fields: [
      { name: "kicker", label: "Надзаголовок", kind: "line" },
      { name: "title", label: "Заголовок", kind: "line" },
      { name: "body", label: "Описание", kind: "multiline" },
    ],
  },
  "home.reviews": {
    scope: "home",
    key: "reviews",
    title: "Отзывы гостей",
    fields: [
      { name: "text", label: "Отзыв", kind: "multiline" },
      { name: "name", label: "Имя гостя", kind: "line" },
    ],
  },
  "visit.hours": {
    scope: "visit",
    key: "hours",
    title: "Часы работы",
    fields: [
      { name: "day", label: "День", kind: "line" },
      { name: "time", label: "Время", kind: "line" },
    ],
  },
  "visit.rules": {
    scope: "visit",
    key: "rules",
    title: "Правила",
    fields: [
      { name: "label", label: "Заголовок", kind: "line" },
      { name: "text", label: "Текст", kind: "multiline" },
    ],
  },
  "visit.seatOptions": {
    scope: "visit",
    key: "seatOptions",
    title: "Варианты посадки в форме брони",
    fields: [{ name: "text", label: "Вариант", kind: "line" }],
  },
} as const satisfies Record<string, ListDef>;

export type ListKey = keyof typeof LISTS;

export function listDef(scope: string, key: string): ListDef | undefined {
  return (LISTS as Record<string, ListDef>)[`${scope}.${key}`];
}

/** Пустой элемент списка — все поля пустыми строками. */
export function emptyEntryData(def: ListDef): Record<string, string> {
  return Object.fromEntries(def.fields.map((f) => [f.name, ""]));
}

// ─────────────────────────────────────────────────────────────
//  Слоты под картинки
// ─────────────────────────────────────────────────────────────

export type ImageSlotDef = {
  key: string;
  title: string;
  placeholder: string;
};

export const IMAGE_SLOTS: ImageSlotDef[] = [
  { key: "common.logo", title: "Логотип в шапке", placeholder: "Знак" },
  { key: "home.hero", title: "Главная — большое фото", placeholder: "Фото зала" },
  { key: "home.about", title: "Главная — блок «О нас»", placeholder: "Фото кальяна на столе" },
  { key: "menu.hero", title: "Меню — фото сверху", placeholder: "Фото чаши и углей" },
  { key: "visit.room", title: "Контакты — фото зала", placeholder: "Фото зала вечером" },
];

/** Слот картинки для элемента списка. */
export function entrySlotKey(scope: string, listKey: string, entryId: string) {
  return `${scope}.${listKey}.${entryId}`;
}

// ─────────────────────────────────────────────────────────────
//  Разделы меню заведения
// ─────────────────────────────────────────────────────────────

export const MENU_SECTIONS = {
  shisha: { title: "Кальяны", hasNote: true, hasDesc: true },
  kitchen: { title: "Бар и кухня", hasNote: false, hasDesc: false },
} as const;

export type MenuSection = keyof typeof MENU_SECTIONS;

// ─────────────────────────────────────────────────────────────
//  Настройки сайта
// ─────────────────────────────────────────────────────────────

export type SettingDef = {
  key: string;
  label: string;
  hint?: string;
};

export const SETTINGS: SettingDef[] = [
  { key: "brandName", label: "Название", hint: "Показывается в шапке и подвале" },
  { key: "brandCity", label: "Город", hint: "Приписка рядом с названием" },
  { key: "phone", label: "Телефон", hint: "Как показывать: +374 91 282820" },
  { key: "phoneHref", label: "Телефон для ссылки", hint: "Без пробелов: +37491282820" },
  { key: "email", label: "E-mail" },
  { key: "instagram", label: "Instagram", hint: "Полная ссылка" },
  { key: "telegram", label: "Telegram", hint: "Полная ссылка" },
  { key: "whatsapp", label: "WhatsApp", hint: "Полная ссылка" },
  { key: "mapQuery", label: "Адрес для карты", hint: "Строка запроса для Google Maps" },
  {
    key: "shopOpenFrom",
    label: "Магазин: заказы с",
    hint: "Время по Еревану, например 11:30. Раньше этого заказ не оформить",
  },
  {
    key: "shopOpenTo",
    label: "Магазин: заказы до",
    hint: "Например 00:00. Если начало и конец совпадают — заказы принимаются круглосуточно",
  },
];

export const SETTING_KEYS = SETTINGS.map((s) => s.key);
