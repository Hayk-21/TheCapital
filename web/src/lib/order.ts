// Всё про заказ, что нужно и браузеру, и серверу.
//
// Отдельный файл, потому что actions.ts помечен "use server": оттуда можно
// экспортировать только асинхронные функции, ни констант, ни типов.

import type { Lang } from "./content-schema";

export type OrderLineInput = { itemId: string; qty: number; note?: string };

/**
 * Заказ с сайта. Времени в нём нет намеренно: заказ уходит в работу сразу,
 * выбрать час гость не может — так решили 28 августа 2026.
 */
export type OrderInput = {
  kind: "delivery" | "pickup";
  name?: string;
  phone?: string;
  address?: string;
  comment?: string;
  lang?: Lang;
  lines: OrderLineInput[];
};

/**
 * Стоимость доставки, пока её не считает Яндекс.
 * Гостю показываем как предварительную: подтверждаем по телефону.
 */
export const DELIVERY_FEE = 1000;
