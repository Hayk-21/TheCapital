import type { Metadata } from "next";
import { headers } from "next/headers";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";

// Archivo — шрифт макета, кириллицы в нём нет, поэтому русский текст
// подхватывает Inter: он идёт вторым в стеке и включается посимвольно.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "800"],
  variable: "--font-archivo-latin",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Capital",
  description: "Hookah lounge on Mesrop Mashtots Ave, Yerevan.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = (await headers()).get("x-lang") ?? "en";

  return (
    <html lang={lang}>
      {/*
        suppressHydrationWarning — из-за браузерных расширений: они дописывают
        в <body> свои атрибуты (data-hasqtip и подобные) до того, как React
        сверит разметку, и в дев-режиме это всплывает ложной ошибкой гидратации.
        Подавление действует только на атрибуты самого body, содержимое
        страницы проверяется как обычно.
      */}
      <body
        suppressHydrationWarning
        className={`${archivo.variable} ${inter.variable}`}
        style={
          {
            // Стек собираем здесь, чтобы токены дизайн-системы остались нетронутыми.
            "--font-archivo": `${archivo.style.fontFamily}, ${inter.style.fontFamily}`,
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
