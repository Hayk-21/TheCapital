/**
 * Первичное наполнение базы — весь контент, который раньше был захардкожен
 * в The Capital.dc.html / Menu.dc.html / Visit.dc.html.
 *
 * Скрипт идемпотентный: тексты и настройки обновляются по ключу, а списки
 * и меню заполняются только если они ещё пустые — чтобы повторный запуск
 * не затирал то, что уже наредактировали в админке.
 *
 * Полный сброс: npm run db:reset
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { IMAGE_SLOTS, LISTS, type ListDef } from "../src/lib/content-schema.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

type Pair = [en: string, ru: string];

// ─────────────────────────────────────────────────────────────
//  Настройки
// ─────────────────────────────────────────────────────────────

const SETTINGS: Record<string, string> = {
  brandName: "The Capital",
  brandCity: "Yerevan",
  phone: "+374 91 282820",
  phoneHref: "+37491282820",
  email: "hello@thecapital.am",
  instagram: "https://instagram.com",
  telegram: "https://t.me",
  whatsapp: "https://wa.me/37491282820",
  mapQuery: "31 Mesrop Mashtots Ave, Yerevan, Armenia",
};

// ─────────────────────────────────────────────────────────────
//  Навигация
// ─────────────────────────────────────────────────────────────

const NAV: Array<{ href: string; label: Pair }> = [
  { href: "/", label: ["Home", "Главная"] },
  { href: "/menu", label: ["Menu", "Меню"] },
  { href: "/shop", label: ["Hookah shop", "Наши дистрибуции"] },
  { href: "/visit", label: ["Visit", "Контакты"] },
];

// ─────────────────────────────────────────────────────────────
//  Тексты
// ─────────────────────────────────────────────────────────────

const TEXTS: Record<string, Record<string, Pair | [...Pair, "multiline"]>> = {
  common: {
    addressLine1: ["31 Mesrop Mashtots Ave", "Пр. Маштоца, 31"],
    addressLine2: ["Yerevan 0002, Armenia", "Ереван 0002, Армения"],
    addressShort: ["31 Mesrop Mashtots Ave, Yerevan 0002", "Пр. Маштоца, 31, Ереван 0002"],
  },
  home: {
    seoTitle: [
      "The Capital, hookah lounge in Yerevan",
      "The Capital, кальянная в Ереване",
    ],
    seoDescription: [
      "Hookah lounge on Mesrop Mashtots Ave in Yerevan. Open from noon, hand-mixed bowls, bar and kitchen.",
      "Кальянная на проспекте Маштоца в Ереване. Открыто с полудня, ручные миксы, бар и кухня.",
      "multiline",
    ],
    heroKicker: ["Hookah lounge · Yerevan", "Кальянная · Ереван"],
    heroTitle: ["Shisha done properly, from noon on.", "Кальян как надо, с полудня."],
    heroBody: [
      "The Capital is a hookah lounge on Mesrop Mashtots. Deep armchairs, low light, a bar that opens at noon, and a master who builds every bowl to order.",
      "The Capital, кальянная на Месропа Маштоца. Глубокие кресла, приглушённый свет, бар, который открывается в полдень, и мастер, который забивает каждую чашу под вас.",
      "multiline",
    ],
    ctaBook: ["Book a table", "Забронировать стол"],
    ctaMenu: ["See the menu", "Смотреть меню"],
    ctaCall: ["Call us", "Позвонить"],
    aboutKicker: ["About", "О нас"],
    aboutTitle: ["One room, built for staying longer.", "Один зал, чтобы остаться дольше."],
    aboutP1: [
      "We opened The Capital for the hours you give to one table. Everything is arranged around the table: the seat you sink into, the shisha in reach, the music kept low enough to talk over.",
      "Мы открыли The Capital для тех часов, которые вы отдаёте одному столу. Всё собрано вокруг стола: кресло, в которое проваливаешься, кальян под рукой, музыка достаточно тихая, чтобы разговаривать.",
      "multiline",
    ],
    aboutP2: [
      "Our masters mix by hand, taste every bowl before it leaves the bar, and come back to change the coals so it never goes flat.",
      "Мастера миксуют вручную, пробуют каждую чашу перед подачей и возвращаются менять угли, чтобы вкус не проседал.",
      "multiline",
    ],
    menuTitle: ["What we serve", "Что у нас есть"],
    menuLink: ["Full menu", "Всё меню"],
    revTitle: ["What guests say", "Отзывы гостей"],
    locKicker: ["Find us", "Как найти"],
    hoursWeek: ["Monday - Saturday", "Понедельник - Суббота"],
    hoursWeekTime: ["12:00 to 00:00", "12:00 - 00:00"],
    hoursSun: ["Sunday", "Воскресенье"],
    hoursSunTime: ["15:00 to 00:00", "15:00 - 00:00"],
  },
  menu: {
    seoTitle: ["Menu — The Capital", "Меню — The Capital"],
    seoDescription: [
      "Shisha bowls, signature mixes, cocktails, tea and food at The Capital in Yerevan.",
      "Чаши, авторские миксы, коктейли, чай и кухня в The Capital в Ереване.",
      "multiline",
    ],
    pageKicker: ["Menu", "Меню"],
    pageTitle: ["Bowls, bar and kitchen.", "Чаши, бар и кухня."],
    pageBody: [
      "Everything is built to order. Tell the master what you want, cold, sweet, heavy, sour, and the bowl comes back tuned to it. Coals changed at the table for as long as you sit.",
      "Всё делается под гостя. Скажите мастеру, какой вкус нужен, холодный, сладкий, плотный, кислый, и чаша вернётся под это. Угли меняем за столом, пока вы сидите.",
      "multiline",
    ],
    ctaBook: ["Book a table", "Забронировать стол"],
    posterText: [
      "One master, one table, coals changed until you leave.",
      "Один мастер, один стол, угли до самого конца вечера.",
      "multiline",
    ],
    kitchenTitle: ["Bar & kitchen", "Бар и кухня"],
    priceNote: [
      "Prices in Armenian dram, service not included. Kitchen closes 30 minutes before the bar.",
      "Цены в драмах, обслуживание не включено. Кухня закрывается на 30 минут раньше бара.",
      "multiline",
    ],
  },
  shop: {
    seoTitle: ["Hookah shop — The Capital", "Наши дистрибуции — The Capital"],
    seoDescription: [
      "Hookah tobacco and coal with delivery across Yerevan.",
      "Кальянный табак и угли с доставкой по Еревану.",
      "multiline",
    ],
    pageKicker: ["Hookah shop", "Наши дистрибуции"],
    pageTitle: ["Tobacco and coal, delivered.", "Табак и угли, с доставкой."],
    pageBody: [
      "What we keep on the shelf, now to take home. Delivery across Yerevan, payment on receipt.",
      "То, что стоит у нас на полке, теперь можно забрать домой. Доставка по Еревану, оплата при получении.",
      "multiline",
    ],
    catTobacco: ["Tobacco", "Табаки"],
    catCoal: ["Coal", "Угли"],
    searchHint: ["Search by flavour", "Поиск по вкусу"],
    backToBrands: ["All brands", "Все бренды"],
    emptyShop: [
      "The shop is being filled in. Call us and we will sort it out by phone.",
      "Магазин пока наполняется. Позвоните — соберём заказ по телефону.",
      "multiline",
    ],
  },
  visit: {
    seoTitle: ["Visit — The Capital", "Контакты — The Capital"],
    seoDescription: [
      "Hours, address and table booking for The Capital hookah lounge in Yerevan.",
      "Часы работы, адрес и бронь стола в кальянной The Capital в Ереване.",
      "multiline",
    ],
    pageKicker: ["Visit", "Контакты"],
    pageTitle: ["Find us, call us, hold a table.", "Найти, позвонить, забронировать."],
    pageBody: [
      "We are on Mesrop Mashtots, five minutes from Republic Square. Weekends fill up early, book ahead if you are coming with a group.",
      "Мы на Месропа Маштоца, пять минут от площади Республики. По выходным зал заполняется рано, если идёте компанией, лучше забронировать заранее.",
      "multiline",
    ],
    hoursTitle: ["Hours", "Часы работы"],
    hoursNote: [
      "Last shisha order 30 minutes before closing.",
      "Последний заказ кальяна за 30 минут до закрытия.",
    ],
    addressTitle: ["Address & contact", "Адрес и связь"],
    ctaMap: ["Open in maps", "Открыть на карте"],
    bookTitle: ["Book a table", "Бронь стола"],
    bookBody: [
      "Send the request and we will confirm by phone or WhatsApp. For six guests or more, call us directly.",
      "Отправьте заявку, мы подтвердим по телефону или в WhatsApp. Для компании от шести человек звоните напрямую.",
      "multiline",
    ],
    fName: ["Name", "Имя"],
    fPhone: ["Phone", "Телефон"],
    fDate: ["Date", "Дата"],
    fTime: ["Time", "Время"],
    fGuests: ["Guests", "Гостей"],
    fSeat: ["Seating", "Посадка"],
    fNote: ["Anything we should know", "Что нам стоит знать"],
    fSubmit: ["Send request", "Отправить заявку"],
    fError: [
      "Could not send the request. Please call us instead.",
      "Не удалось отправить заявку. Позвоните нам, пожалуйста.",
    ],
    sentTitle: ["Request sent.", "Заявка отправлена."],
    sentBody: [
      "We will call you back to confirm. If it is urgent, ring +374 91 282820.",
      "Мы перезвоним для подтверждения. Если срочно, +374 91 282820.",
      "multiline",
    ],
  },
};

// ─────────────────────────────────────────────────────────────
//  Списки
// ─────────────────────────────────────────────────────────────

type EntrySeed = { en: Record<string, string>; ru: Record<string, string> };

const LIST_DATA: Record<string, EntrySeed[]> = {
  "home.facts": [
    { en: { value: "12:00 to 00:00", label: "Open daily" }, ru: { value: "12:00 - 00:00", label: "Открыто ежедневно" } },
    { en: { value: "40+", label: "Tobacco flavours" }, ru: { value: "40+", label: "Вкусов табака" } },
    { en: { value: "80", label: "Seats & terrace" }, ru: { value: "80", label: "Мест и терраса" } },
    { en: { value: "0002", label: "Mashtots Ave, Yerevan" }, ru: { value: "0002", label: "Пр. Маштоца, Ереван" } },
  ],
  "home.aboutTags": [
    { en: { text: "Hand-mixed bowls" }, ru: { text: "Ручные миксы" } },
    { en: { text: "Open from noon" }, ru: { text: "Открыто с полудня" } },
    { en: { text: "Terrace" }, ru: { text: "Терраса" } },
    { en: { text: "No rush" }, ru: { text: "Без спешки" } },
  ],
  "home.teasers": [
    {
      en: {
        kicker: "Shisha",
        title: "Signature bowls",
        body: "Forty-plus tobaccos and our own mixes, from cold citrus to heavy dessert blends. Built on ceramic, served on ice.",
      },
      ru: {
        kicker: "Кальян",
        title: "Авторские чаши",
        body: "Больше сорока табаков и собственные миксы, от холодного цитруса до плотных десертных. На керамике, с подачей на льду.",
      },
    },
    {
      en: {
        kicker: "Bar",
        title: "Cocktails & tea",
        body: "Classic cocktails, Armenian brandy, and a full samovar tea list for the tables that stay to closing.",
      },
      ru: {
        kicker: "Бар",
        title: "Коктейли и чай",
        body: "Классические коктейли, армянский коньяк и большая чайная карта с самоваром для тех, кто остаётся до закрытия.",
      },
    },
    {
      en: {
        kicker: "Kitchen",
        title: "Food from the grill",
        body: "Boards, hot snacks and grilled plates from the kitchen, on until 23:30.",
      },
      ru: {
        kicker: "Кухня",
        title: "Еда с гриля",
        body: "Борды, горячие закуски и блюда на гриле, работает до 23:30.",
      },
    },
  ],
  "home.reviews": [
    {
      en: { text: "Best shisha in Yerevan. The master actually asks what you like and builds the bowl around it.", name: "Aram G." },
      ru: { text: "Лучший кальян в Ереване. Мастер реально спрашивает, что вы любите, и собирает чашу под это.", name: "Арам Г." },
    },
    {
      en: { text: "Came at eight and stayed to closing. Service, seats and the terrace, nothing to fix.", name: "Marina P." },
      ru: { text: "Пришли в восемь и остались до закрытия. Сервис, посадка, терраса, менять нечего.", name: "Марина П." },
    },
    {
      en: { text: "Came for one bowl, ordered food, stayed until they closed. That says enough.", name: "Davit S." },
      ru: { text: "Пришли на одну чашу, заказали еду и остались до самого закрытия. Этим всё сказано.", name: "Давид С." },
    },
  ],
  "visit.hours": [
    { en: { day: "Monday", time: "12:00 to 00:00" }, ru: { day: "Понедельник", time: "12:00 - 00:00" } },
    { en: { day: "Tuesday", time: "12:00 to 00:00" }, ru: { day: "Вторник", time: "12:00 - 00:00" } },
    { en: { day: "Wednesday", time: "12:00 to 00:00" }, ru: { day: "Среда", time: "12:00 - 00:00" } },
    { en: { day: "Thursday", time: "12:00 to 00:00" }, ru: { day: "Четверг", time: "12:00 - 00:00" } },
    { en: { day: "Friday", time: "12:00 to 00:00" }, ru: { day: "Пятница", time: "12:00 - 00:00" } },
    { en: { day: "Saturday", time: "12:00 to 00:00" }, ru: { day: "Суббота", time: "12:00 - 00:00" } },
    { en: { day: "Sunday", time: "15:00 to 00:00" }, ru: { day: "Воскресенье", time: "15:00 - 00:00" } },
  ],
  "visit.rules": [
    {
      en: { label: "Age", text: "18+ only. ID may be requested at the door." },
      ru: { label: "Возраст", text: "Только 18+. На входе могут спросить документ." },
    },
    {
      en: { label: "Groups", text: "Tables of six or more by phone, with a deposit on weekends." },
      ru: { label: "Компании", text: "Столы от шести человек, по телефону, по выходным с депозитом." },
    },
    {
      en: { label: "Last order", text: "Shisha 30 minutes before closing, kitchen at 23:30." },
      ru: { label: "Последний заказ", text: "Кальян за 30 минут до закрытия, кухня, в 23:30." },
    },
  ],
  "visit.seatOptions": [
    { en: { text: "No preference" }, ru: { text: "Без предпочтений" } },
    { en: { text: "Sofa corner" }, ru: { text: "Диванный угол" } },
    { en: { text: "Terrace" }, ru: { text: "Терраса" } },
    { en: { text: "Near the bar" }, ru: { text: "У бара" } },
  ],
};

// Подсказки для пустых слотов — их видит только редактор.
const SLOT_PLACEHOLDERS: Record<string, string> = {
  "home.hero": "Фото зала",
  "home.about": "Фото кальяна на столе, крупно",
  "menu.hero": "Фото чаши и углей на баре",
  "visit.room": "Фото зала вечером",
};

const TEASER_PLACEHOLDERS = [
  "Фото, приготовление чаши",
  "Фото, коктейли на баре",
  "Фото, блюдо с гриля",
];

// ─────────────────────────────────────────────────────────────
//  Меню заведения
// ─────────────────────────────────────────────────────────────

type MenuItemSeed = {
  name: Pair;
  desc?: Pair;
  price: number;
  from?: boolean;
};

type MenuGroupSeed = {
  section: "shisha" | "kitchen";
  title: Pair;
  note?: Pair;
  items: MenuItemSeed[];
};

const MENU: MenuGroupSeed[] = [
  {
    section: "shisha",
    title: ["Classic bowls", "Классика"],
    note: ["Ceramic · 1 hour+", "Керамика · от 1 часа"],
    items: [
      {
        name: ["Double Apple", "Двойное яблоко"],
        desc: ["The one everybody knows. Anise-heavy, thick smoke.", "То самое. Анис, плотный дым."],
        price: 5000,
      },
      {
        name: ["Mint & Ice", "Мята и лёд"],
        desc: ["Cold, clean, no sugar. Good after food.", "Холодный, чистый, без сахара. Хорош после еды."],
        price: 5000,
      },
      {
        name: ["Grape Berry", "Виноград и ягоды"],
        desc: ["Dark grape with blackcurrant, medium strength.", "Тёмный виноград с чёрной смородиной, средняя крепость."],
        price: 5500,
      },
      {
        name: ["Peach Blossom", "Персиковый цвет"],
        desc: ["Soft peach, light floral finish.", "Мягкий персик, лёгкий цветочный финал."],
        price: 5500,
      },
    ],
  },
  {
    section: "shisha",
    title: ["Signature mixes", "Авторские миксы"],
    note: ["House recipes", "Наши рецепты"],
    items: [
      {
        name: ["The Capital", "The Capital"],
        desc: ["Our own: citrus, tonic, cold mint. Strong.", "Наш микс: цитрус, тоник, холодная мята. Крепкий."],
        price: 7000,
      },
      {
        name: ["Mashtots Mix", "Микс Маштоца"],
        desc: ["Fig, cardamom and cream on a fruit bowl.", "Инжир, кардамон и крем на фруктовой чаше."],
        price: 7500,
      },
      {
        name: ["Ararat Sour", "Арарат сауэр"],
        desc: ["Sour cherry, lime, hint of basil.", "Кислая черешня, лайм, немного базилика."],
        price: 7000,
      },
      {
        name: ["Black Samovar", "Чёрный самовар"],
        desc: ["Black tea, bergamot and honey tobacco.", "Чёрный чай, бергамот и медовый табак."],
        price: 7500,
      },
    ],
  },
  {
    section: "shisha",
    title: ["Fruit bowls", "Фруктовые чаши"],
    note: ["Cut to order", "Режем при вас"],
    items: [
      {
        name: ["Pineapple", "Ананас"],
        desc: ["Whole fruit bowl, full hour of cold smoke.", "Целый фрукт, час холодного дыма."],
        price: 9000,
      },
      {
        name: ["Grapefruit", "Грейпфрут"],
        desc: ["Bitter-citrus base, works with any mint mix.", "Горько-цитрусовая база, идёт с любой мятой."],
        price: 8500,
      },
      {
        name: ["Melon", "Дыня"],
        desc: ["Sweet and mild, the long-table choice.", "Сладкая и мягкая, выбор для большого стола."],
        price: 9000,
      },
    ],
  },
  {
    section: "shisha",
    title: ["Premium tobacco", "Премиум табак"],
    note: ["By request", "По запросу"],
    items: [
      {
        name: ["Dark leaf", "Тёмный лист"],
        desc: ["For guests who want it heavy. Ask the master.", "Для тех, кому нужно плотнее. Спросите мастера."],
        price: 9500,
      },
      {
        name: ["Rare single flavours", "Редкие моновкусы"],
        desc: ["Rotating shelf, whatever came in this month.", "Полка меняется, то, что пришло в этом месяце."],
        price: 9000,
        from: true,
      },
    ],
  },
  {
    section: "kitchen",
    title: ["Cocktails", "Коктейли"],
    items: [
      { name: ["Old Fashioned", "Old Fashioned"], price: 3500 },
      { name: ["Negroni", "Negroni"], price: 3500 },
      { name: ["Espresso Martini", "Espresso Martini"], price: 3800 },
      { name: ["Aperol Spritz", "Aperol Spritz"], price: 3200 },
      { name: ["Armenian brandy, 50ml", "Армянский коньяк, 50 мл"], price: 2500, from: true },
    ],
  },
  {
    section: "kitchen",
    title: ["Tea & soft", "Чай и безалкогольное"],
    items: [
      { name: ["Samovar tea, for the table", "Чай в самоваре, на компанию"], price: 4500 },
      { name: ["Mountain herb tea", "Горный травяной чай"], price: 1800 },
      { name: ["Fresh lemonade", "Домашний лимонад"], price: 1500 },
      { name: ["Espresso / Americano", "Эспрессо / американо"], price: 900 },
      { name: ["Still / sparkling water", "Вода без газа / с газом"], price: 700 },
    ],
  },
  {
    section: "kitchen",
    title: ["Food", "Кухня"],
    items: [
      { name: ["Cheese & dried fruit board", "Сырная доска с сухофруктами"], price: 5500 },
      { name: ["Grilled chicken skewers", "Куриные шашлычки"], price: 4200 },
      { name: ["Beef kebab plate", "Говяжий кебаб"], price: 5800 },
      { name: ["Hot cheese sticks", "Горячие сырные палочки"], price: 2800 },
      { name: ["Fries with herbs", "Картофель фри с зеленью"], price: 1900 },
    ],
  },
];

// ─────────────────────────────────────────────────────────────

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db.setting.upsert({
      where: { key },
      update: {}, // уже настроенное не трогаем
      create: { key, value },
    });
  }
}

async function seedNav() {
  if ((await db.navItem.count()) > 0) return;
  await db.navItem.createMany({
    data: NAV.map((item, i) => ({
      href: item.href,
      labelEn: item.label[0],
      labelRu: item.label[1],
      position: i,
    })),
  });
}

async function seedTexts() {
  for (const [scope, entries] of Object.entries(TEXTS)) {
    for (const [key, tuple] of Object.entries(entries)) {
      const [en, ru, kind] = tuple as [string, string, string | undefined];
      await db.text.upsert({
        where: { scope_key: { scope, key } },
        update: {}, // отредактированное в админке важнее сида
        create: { scope, key, en, ru, kind: kind ?? "line" },
      });
    }
  }
}

async function seedLists() {
  for (const [fullKey, def] of Object.entries(LISTS as Record<string, ListDef>)) {
    const block = await db.listBlock.upsert({
      where: { scope_key: { scope: def.scope, key: def.key } },
      update: {},
      create: { scope: def.scope, key: def.key },
    });

    const existing = await db.listEntry.count({ where: { blockId: block.id } });
    if (existing > 0) continue;

    const rows = LIST_DATA[fullKey] ?? [];
    for (const [i, row] of rows.entries()) {
      const entry = await db.listEntry.create({
        data: {
          blockId: block.id,
          position: i,
          en: JSON.stringify(row.en),
          ru: JSON.stringify(row.ru),
        },
      });

      // Карточкам-тизерам сразу заводим пустой слот под фото.
      if (def.image) {
        await db.imageSlot.create({
          data: {
            key: `${def.scope}.${def.key}.${entry.id}`,
            placeholder: TEASER_PLACEHOLDERS[i] ?? def.imagePlaceholder ?? "Фото",
          },
        });
      }
    }
  }
}

async function seedImageSlots() {
  for (const slot of IMAGE_SLOTS) {
    await db.imageSlot.upsert({
      where: { key: slot.key },
      update: {},
      create: {
        key: slot.key,
        placeholder: SLOT_PLACEHOLDERS[slot.key] ?? slot.placeholder,
      },
    });
  }
}

async function seedMenu() {
  if ((await db.menuGroup.count()) > 0) return;

  const counters: Record<string, number> = { shisha: 0, kitchen: 0 };

  for (const group of MENU) {
    const position = counters[group.section]++;
    const created = await db.menuGroup.create({
      data: {
        section: group.section,
        titleEn: group.title[0],
        titleRu: group.title[1],
        noteEn: group.note?.[0] ?? null,
        noteRu: group.note?.[1] ?? null,
        position,
      },
    });

    await db.menuItem.createMany({
      data: group.items.map((item, i) => ({
        groupId: created.id,
        nameEn: item.name[0],
        nameRu: item.name[1],
        descEn: item.desc?.[0] ?? null,
        descRu: item.desc?.[1] ?? null,
        priceAmount: item.price,
        priceFrom: item.from ?? false,
        position: i,
      })),
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@thecapital.am";
  const password = process.env.ADMIN_PASSWORD ?? "capital";

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  админ уже есть: ${email}`);
    return;
  }

  await db.user.create({
    data: {
      email,
      name: "Администратор",
      passwordHash: await bcrypt.hash(password, 10),
      role: "owner",
    },
  });
  console.log(`  создан админ: ${email} / ${password}`);
}

async function main() {
  console.log("Наполняю базу…");
  await seedSettings();
  await seedNav();
  await seedTexts();
  await seedLists();
  await seedImageSlots();
  await seedMenu();
  await seedAdmin();

  const counts = {
    тексты: await db.text.count(),
    "элементы списков": await db.listEntry.count(),
    "позиции меню": await db.menuItem.count(),
    "слоты картинок": await db.imageSlot.count(),
  };
  console.log("Готово:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
