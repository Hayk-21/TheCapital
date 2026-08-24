import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["en", "ru"] as const;
const DEFAULT_LANG = "en";
const LANG_COOKIE = "capital-lang";

/**
 * Язык живёт в адресе (/en/menu, /ru/menu), чтобы у каждой версии страницы
 * был свой URL для поисковиков и чтобы ссылкой можно было поделиться.
 * Корень отдаёт язык из куки, иначе смотрит на Accept-Language.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segment = pathname.split("/")[1];
  if ((LANGS as readonly string[]).includes(segment)) {
    // Язык уже в адресе — пробрасываем его в layout, чтобы проставить <html lang>.
    const headers = new Headers(request.headers);
    headers.set("x-lang", segment);
    return NextResponse.next({ request: { headers } });
  }

  const cookieLang = request.cookies.get(LANG_COOKIE)?.value;
  const headerLang = request.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.slice(0, 2)
    .toLowerCase();

  const lang =
    cookieLang && (LANGS as readonly string[]).includes(cookieLang)
      ? cookieLang
      : headerLang && (LANGS as readonly string[]).includes(headerLang)
        ? headerLang
        : DEFAULT_LANG;

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? `/${lang}` : `/${lang}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Админка, API, статика и загруженные файлы языковой префикс не получают.
  matcher: ["/((?!admin|api|uploads|_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
