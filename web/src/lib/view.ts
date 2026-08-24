// Формы данных и хелперы вывода — без единого обращения к базе.
// Отдельный модуль нужен, чтобы клиентские компоненты могли их импортировать,
// не утаскивая в браузерный бандл Prisma и нативный SQLite.

import type { Lang } from "./content-schema";

export type Bilingual = { en: string; ru: string };
export type TextMap = Record<string, Bilingual>;
export type EntryData = Record<string, string>;

export type ImageView = {
  key: string;
  src: string | null;
  width: number | null;
  height: number | null;
  alt: Bilingual;
  fit: string;
  focalX: number;
  focalY: number;
  scale: number;
  placeholder: string;
};

export type ListEntryView = {
  id: string;
  position: number;
  visible: boolean;
  en: EntryData;
  ru: EntryData;
  image: ImageView | null;
};

export type NavView = {
  id: string;
  href: string;
  label: Bilingual;
  external: boolean;
  position: number;
};

export type MenuItemView = {
  id: string;
  name: Bilingual;
  desc: Bilingual;
  priceAmount: number | null;
  priceFrom: boolean;
  position: number;
  visible: boolean;
};

export type MenuGroupView = {
  id: string;
  section: string;
  title: Bilingual;
  note: Bilingual;
  position: number;
  visible: boolean;
  items: MenuItemView[];
};

export type SiteChrome = {
  /** Знак в шапке; пустой слот, пока картинку не загрузили. */
  logo: ImageView;
  settings: Record<string, string>;
  nav: NavView[];
  common: TextMap;
};

export type PageContent = SiteChrome & {
  scope: string;
  texts: TextMap;
  lists: Record<string, ListEntryView[]>;
  images: Record<string, ImageView>;
};

/** "5 000 ֏" для ru, "5,000 ֏" для en; priceFrom добавляет «от»/«from». */
export function formatPrice(
  amount: number | null,
  from: boolean,
  lang: Lang,
): string {
  if (amount == null) return "";
  const grouped =
    lang === "ru"
      ? amount.toLocaleString("ru-RU").replace(/ /g, " ")
      : amount.toLocaleString("en-US");
  const prefix = from ? (lang === "ru" ? "от " : "from ") : "";
  return `${prefix}${grouped} ֏`;
}

export function pick(value: Bilingual | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] || value.en || value.ru || "";
}
