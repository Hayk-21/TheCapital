// Часы приёма заказов в магазине.
//
// Витрина видна круглые сутки — смотреть каталог можно всегда, — а заказ
// уходит только внутри рабочего окна: ночью его некому собирать.
//
// Время считаем по Еревану, а не по часам гостя: иначе гость из другого
// пояса увидел бы открытый магазин, а сервер отказал бы ему в заказе.
// Окно может переходить через полночь («с 11:30 до 00:00»), поэтому
// сравнение не сводится к одному диапазону.

export const SHOP_TZ = "Asia/Yerevan";

/** Пока часы не заданы в админке — время, о котором договорились в августе 2026. */
export const SHOP_HOURS_FALLBACK: ShopHours = { from: "11:30", to: "00:00" };

export type ShopHours = { from: string; to: string };

/** «11:30» → 690 минут от полуночи. Мусор и пустое → null. */
export function parseTime(value: string | null | undefined): number | null {
  const match = /^\s*(\d{1,2})[:.](\d{2})\s*$/.exec(value ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  // 24:00 в настройках означает ту же полночь, что и 00:00.
  return (h % 24) * 60 + m;
}

/** «11:30» из настроек, с откатом на значение по умолчанию. */
export function shopHours(settings: Record<string, string> | undefined): ShopHours {
  const from = settings?.shopOpenFrom;
  const to = settings?.shopOpenTo;
  return {
    from: parseTime(from) === null ? SHOP_HOURS_FALLBACK.from : from!.trim(),
    to: parseTime(to) === null ? SHOP_HOURS_FALLBACK.to : to!.trim(),
  };
}

/** Минуты от полуночи по ереванскому времени. */
export function minutesInYerevan(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

/**
 * Принимаем ли заказы прямо сейчас.
 *
 * Начало и конец совпадают — магазин работает круглосуточно: так проще
 * временно снять ограничение из админки, не трогая код.
 */
export function isShopOpen(hours: ShopHours, now: Date = new Date()): boolean {
  const from = parseTime(hours.from) ?? parseTime(SHOP_HOURS_FALLBACK.from)!;
  const to = parseTime(hours.to) ?? parseTime(SHOP_HOURS_FALLBACK.to)!;
  if (from === to) return true;

  const t = minutesInYerevan(now);
  // Конец «00:00» — это полночь следующих суток, окно переходит через неё.
  return from < to ? t >= from && t < to : t >= from || t < to;
}

/** «11:30 – 00:00» одной строкой для подписей на сайте. */
export function formatHours(hours: ShopHours): string {
  return `${hours.from} – ${hours.to}`;
}
