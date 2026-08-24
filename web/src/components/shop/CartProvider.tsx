"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Корзина гостя.
 *
 * Живёт только в браузере: заказ уходит на сервер один раз, при оформлении.
 * Регистрации на сайте нет, поэтому связывать корзину с аккаунтом нечем,
 * а localStorage переживает перезагрузку и возврат на сайт.
 *
 * В строке хранится снимок названия и цены: пока гость набирает заказ,
 * меню могли поправить в админке. Сервер всё равно пересчитает по своим
 * ценам — снимок нужен, чтобы показать корзину без запроса к базе.
 */

export type CartLine = {
  /** id варианта товара — фасовка конкретного вкуса. */
  itemId: string;
  /** «Black Burn · Bananini» — бренд и название одной строкой. */
  titleEn: string;
  titleRu: string;
  /** Фасовка как её видит гость: «25 г». */
  size: string;
  price: number;
  qty: number;
  note?: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (itemId: string, note: string | undefined, qty: number) => void;
  remove: (itemId: string, note: string | undefined) => void;
  clear: () => void;
  /** Корзина прочитана из localStorage — до этого не рисуем счётчик. */
  ready: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "capital-cart-v1";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart вызван вне CartProvider");
  return ctx;
}

/** Одна и та же позиция с разными пожеланиями — разные строки. */
function sameLine(line: CartLine, itemId: string, note: string | undefined) {
  return line.itemId === itemId && (line.note ?? "") === (note ?? "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed.filter(isLine));
      }
    } catch {
      // Битое хранилище — просто начинаем с пустой корзины.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Приватный режим или переполнение — корзина останется только в памяти.
    }
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => sameLine(l, line.itemId, line.note));
      if (i === -1) return [...prev, { ...line, qty }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + qty };
      return next;
    });
  }, []);

  const setQty = useCallback((itemId: string, note: string | undefined, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => !sameLine(l, itemId, note))
        : prev.map((l) => (sameLine(l, itemId, note) ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((itemId: string, note: string | undefined) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, itemId, note)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.price * l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      ready,
    };
  }, [lines, add, setQty, remove, clear, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function isLine(x: unknown): x is CartLine {
  if (!x || typeof x !== "object") return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.itemId === "string" &&
    typeof l.titleEn === "string" &&
    typeof l.titleRu === "string" &&
    typeof l.size === "string" &&
    typeof l.price === "number" &&
    typeof l.qty === "number" &&
    l.qty > 0
  );
}
