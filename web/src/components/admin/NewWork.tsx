"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Counts = { orders: number; bookings: number };

/**
 * Уведомление о новой работе.
 *
 * Панель опрашивает счётчики раз в 15 секунд: заказ приходит, когда никто не
 * смотрит на экран, и без этого его замечают через полчаса. При появлении
 * нового показываем плашку, помечаем заголовок вкладки и подаём короткий
 * сигнал — в зале на экран не смотрят.
 */
export function NewWork({ initial }: { initial: Counts }) {
  const router = useRouter();
  const [counts, setCounts] = useState(initial);
  const [flash, setFlash] = useState<string | null>(null);
  const seen = useRef(initial);
  const baseTitle = useRef<string>("");

  useEffect(() => {
    baseTitle.current = document.title.replace(/^\(\d+\)\s*/, "");
  }, []);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const res = await fetch("/api/admin/counts", { cache: "no-store" });
        if (!res.ok || !alive) return;
        const next: Counts = await res.json();
        setCounts(next);

        const newOrders = next.orders - seen.current.orders;
        const newBookings = next.bookings - seen.current.bookings;

        if (newOrders > 0 || newBookings > 0) {
          const parts: string[] = [];
          if (newOrders > 0) parts.push(`заказов: ${newOrders}`);
          if (newBookings > 0) parts.push(`заявок на бронь: ${newBookings}`);
          setFlash(parts.join(", "));
          beep();
          // Страницы списков подтягивают свежие данные без перезагрузки.
          router.refresh();
        }
        seen.current = next;
      } catch {
        // Сеть моргнула — попробуем на следующем круге.
      }
    };

    const id = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [router]);

  // Число в заголовке вкладки: видно, даже когда админка в фоне.
  useEffect(() => {
    const total = counts.orders + counts.bookings;
    if (!baseTitle.current) return;
    document.title = total > 0 ? `(${total}) ${baseTitle.current}` : baseTitle.current;
  }, [counts]);

  if (!flash) return null;

  return (
    <div className="adm-flash" role="status">
      <span>Новое — {flash}</span>
      <button type="button" className="adm-btn" data-size="s" onClick={() => setFlash(null)}>
        Понятно
      </button>
    </div>
  );
}

/** Короткий сигнал без звукового файла. */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
    osc.onended = () => void ctx.close();
  } catch {
    // Браузер не дал звук без действия пользователя — не беда.
  }
}

/** Счётчик рядом с пунктом меню. */
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return <span className="adm-badge">{count}</span>;
}
