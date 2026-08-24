import type { CSSProperties } from "react";

// Куски оформления, которые в .dc.html повторялись в нескольких секциях.
// Значения перенесены символ в символ, чтобы сайт выглядел как макет.

/**
 * Тёмный «рифлёный» фон под дерево: полосы плюс диагональный градиент.
 * 24 августа заказчик дважды просил сделать дерево светлее — база и градиент
 * подняты двумя шагами, рисунок волокон не менялся.
 */
export const RIDGED: CSSProperties = {
  backgroundColor: "#352c20",
  backgroundImage: [
    "repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)",
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 9px)",
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, rgba(255,255,255,0.045) 2px, rgba(255,255,255,0.045) 3px, transparent 3px, transparent 168px)",
    "linear-gradient(103deg, #4a3c2d 0%, #31281d 46%, #423326 78%, #2e251b 100%)",
  ].join(", "),
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -2px 0 rgba(0,0,0,0.45)",
};

export const PAGE: CSSProperties = {
  fontFamily: "var(--font-body)",
  color: "#f4f1ee",
  background: "#1a1613",
  minHeight: "100vh",
};

export const KICKER: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "#ec3013",
};

export const PAGE_KICKER: CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.28em",
  textTransform: "uppercase",
  color: "#ec3013",
  animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
  animationDelay: "0.05s",
};

export const PAGE_TITLE: CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "clamp(38px, 4.6vw, 64px)",
  lineHeight: 0.96,
  margin: 0,
  letterSpacing: "-0.02em",
  animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
  animationDelay: "0.16s",
};

export const SECTION_TITLE: CSSProperties = {
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  fontSize: "clamp(28px, 3vw, 40px)",
  margin: 0,
  letterSpacing: "-0.01em",
};

export const OUTLINE_BTN: CSSProperties = {
  border: "2px solid #4a4038",
  background: "transparent",
  color: "#f4f1ee",
};

export const GHOST_BTN: CSSProperties = {
  background: "transparent",
  color: "#ec3013",
};

export const INPUT: CSSProperties = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "#f4f1ee",
  background: "#17130f",
  border: "2px solid #3b332c",
  padding: "12px 14px",
  width: "100%",
  boxSizing: "border-box",
};

export const FIELD_LABEL: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#a89f96",
};

export function mapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=17&output=embed`;
}

export function mapLinkUrl(query: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}
