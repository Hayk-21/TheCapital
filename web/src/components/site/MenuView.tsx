"use client";

import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import { Editable } from "@/components/editor/Editable";
import { Txt } from "@/components/editor/fields";
import { Slot } from "@/components/editor/Slot";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { PAGE, PAGE_KICKER, PAGE_TITLE, RIDGED, SECTION_TITLE } from "./styles";
import {
  addMenuGroup,
  addMenuItem,
  deleteMenuGroup,
  deleteMenuItem,
  moveMenuGroup,
  moveMenuItem,
  saveMenuGroup,
  saveMenuItem,
} from "@/lib/actions";
import { NewsSection } from "@/components/shop/NewsSection";
import { formatPrice, type MenuGroupView } from "@/lib/view";
import type { NewsItem } from "@/lib/news";

export function MenuView({ groups, news = [] }: { groups: MenuGroupView[]; news?: NewsItem[] }) {
  const { content, lang, editing } = useContent();
  const shisha = groups.filter((g) => g.section === "shisha");
  const kitchen = groups.filter((g) => g.section === "kitchen");

  return (
    <div style={PAGE}>
      <Header />

      {/* ── Шапка страницы ───────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div
          style={{
            padding: "72px 40px 56px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <Txt k="pageKicker" style={PAGE_KICKER} />
          <Txt k="pageTitle" as="h1" style={PAGE_TITLE} />
          <Txt
            k="pageBody"
            as="p"
            multiline
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: "52ch",
              margin: 0,
              color: "#a89f96",
              textWrap: "pretty",
            }}
          />
        </div>
        <div
          className="grayscale"
          style={{ position: "relative", minHeight: 520, borderLeft: "2px solid #3b332c" }}
        >
          <Slot image={content.images["menu.hero"] ?? null} />
        </div>
      </section>

      {/* Новинки магазина: гость кафе тоже должен видеть, что привезли. */}
      <NewsSection news={news} />

      {/* ── Кальяны ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "64px 40px",
          borderBottom: "2px solid #3b332c",
          ...RIDGED,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 56,
          }}
        >
          {shisha.map((group) => (
            <MenuGroupBlock key={group.id} group={group} withDescriptions />
          ))}
          {editing && <AddGroupButton section="shisha" label="+ категория кальянов" />}
        </div>
      </section>

      {/* ── Плакат ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "56px 40px",
          background: "#ec3013",
          color: "#fff",
          borderBottom: "2px solid #100d0b",
          display: "flex",
          gap: 40,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <Txt
          k="posterText"
          as="p"
          multiline
          className="cap-reveal"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "clamp(26px, 2.6vw, 34px)",
            lineHeight: 1.08,
            margin: 0,
            maxWidth: "24ch",
            letterSpacing: "-0.01em",
          }}
        />
        <Link
          href={`/${lang}/visit`}
          className="btn cap-poster-btn"
          style={{ background: "#100d0b", color: "#fff", marginLeft: "auto" }}
        >
          <Txt k="ctaBook" />
        </Link>
      </section>

      {/* ── Бар и кухня ──────────────────────────────────────── */}
      <section style={{ padding: "64px 40px", borderBottom: "2px solid #3b332c" }}>
        <Txt k="kitchenTitle" as="h2" style={{ ...SECTION_TITLE, margin: "0 0 32px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
          }}
        >
          {kitchen.map((group) => (
            <MenuGroupBlock key={group.id} group={group} />
          ))}
          {editing && <AddGroupButton section="kitchen" label="+ категория бара" />}
        </div>
        <Txt
          k="priceNote"
          as="p"
          multiline
          style={{ fontSize: 13, color: "#a89f96", margin: "32px 0 0" }}
        />
      </section>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function AddGroupButton({ section, label }: { section: string; label: string }) {
  const { save } = useContent();
  return (
    <button
      type="button"
      className="cap-tool-btn"
      style={{ padding: "14px 18px", alignSelf: "start" }}
      onClick={() => save(() => addMenuGroup(section))}
    >
      {label}
    </button>
  );
}

function MenuGroupBlock({
  group,
  withDescriptions = false,
}: {
  group: MenuGroupView;
  withDescriptions?: boolean;
}) {
  const { lang, editing, save } = useContent();

  const titleField = lang === "ru" ? "titleRu" : "titleEn";
  const noteField = lang === "ru" ? "noteRu" : "noteEn";

  return (
    <div
      className="cap-reveal cap-editable-block"
      style={{ display: "flex", flexDirection: "column", gap: withDescriptions ? 18 : 16 }}
    >
      {editing && (
        <div className="cap-block-tools">
          <button
            type="button"
            className="cap-tool-btn"
            title="Выше"
            onClick={() => save(() => moveMenuGroup(group.id, "up"))}
          >
            ↑
          </button>
          <button
            type="button"
            className="cap-tool-btn"
            title="Ниже"
            onClick={() => save(() => moveMenuGroup(group.id, "down"))}
          >
            ↓
          </button>
          <button
            type="button"
            className="cap-tool-btn"
            data-danger="true"
            title="Удалить категорию со всеми позициями"
            onClick={() => {
              if (confirm(`Удалить категорию «${group.title[lang]}» вместе с позициями?`))
                save(() => deleteMenuGroup(group.id));
            }}
          >
            ✕
          </button>
        </div>
      )}

      {withDescriptions ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            borderBottom: "2px solid #f4f1ee",
            paddingBottom: 12,
          }}
        >
          <Editable
            as="h2"
            value={group.title[lang]}
            editing={editing}
            placeholder="категория"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 28, margin: 0 }}
            onSave={(next) => save(() => saveMenuGroup(group.id, { [titleField]: next }))}
          />
          <Editable
            value={group.note[lang]}
            editing={editing}
            placeholder="примечание"
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#ec3013",
              marginLeft: "auto",
            }}
            onSave={(next) => save(() => saveMenuGroup(group.id, { [noteField]: next }))}
          />
        </div>
      ) : (
        <Editable
          as="h3"
          value={group.title[lang]}
          editing={editing}
          placeholder="категория"
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 22,
            margin: 0,
            borderBottom: "2px solid #f4f1ee",
            paddingBottom: 10,
          }}
          onSave={(next) => save(() => saveMenuGroup(group.id, { [titleField]: next }))}
        />
      )}

      {group.items.map((item) => (
        <MenuItemRow
          key={item.id}
          item={item}
          withDescription={withDescriptions}
        />
      ))}

      {editing && (
        <button
          type="button"
          className="cap-tool-btn"
          style={{ alignSelf: "start" }}
          onClick={() => save(() => addMenuItem(group.id))}
        >
          + позиция
        </button>
      )}
    </div>
  );
}

function MenuItemRow({
  item,
  withDescription,
}: {
  item: MenuGroupView["items"][number];
  withDescription: boolean;
}) {
  const { lang, editing, save } = useContent();

  const nameField = lang === "ru" ? "nameRu" : "nameEn";
  const descField = lang === "ru" ? "descRu" : "descEn";
  const price = formatPrice(item.priceAmount, item.priceFrom, lang);

  const tools = editing && (
    <div className="cap-block-tools">
      <button
        type="button"
        className="cap-tool-btn"
        title="Выше"
        onClick={() => save(() => moveMenuItem(item.id, "up"))}
      >
        ↑
      </button>
      <button
        type="button"
        className="cap-tool-btn"
        title="Ниже"
        onClick={() => save(() => moveMenuItem(item.id, "down"))}
      >
        ↓
      </button>
      <button
        type="button"
        className="cap-tool-btn"
        title={item.priceFrom ? "Убрать «от»" : "Цена «от»"}
        onClick={() => save(() => saveMenuItem(item.id, { priceFrom: !item.priceFrom }))}
      >
        от
      </button>
      <button
        type="button"
        className="cap-tool-btn"
        data-danger="true"
        title="Удалить позицию"
        onClick={() => {
          if (confirm(`Удалить «${item.name[lang]}»?`)) save(() => deleteMenuItem(item.id));
        }}
      >
        ✕
      </button>
    </div>
  );

  // Цена правится как чистое число — символ драма и разделители дорисовываются
  // при выводе, чтобы формат не разъезжался между языками.
  const priceNode = (
    <Editable
      value={editing ? String(item.priceAmount ?? "") : price}
      editing={editing}
      placeholder="цена"
      inputMode="numeric"
      style={{
        fontFamily: "var(--font-heading)",
        fontWeight: 700,
        fontSize: withDescription ? 17 : 15,
        marginLeft: "auto",
        whiteSpace: "nowrap",
      }}
      onSave={(next) => {
        const digits = next.replace(/[^\d]/g, "");
        save(() =>
          saveMenuItem(item.id, { priceAmount: digits ? Number.parseInt(digits, 10) : null }),
        );
      }}
    />
  );

  if (!withDescription) {
    return (
      <div
        className="cap-editable-block"
        style={{
          display: "flex",
          gap: 16,
          alignItems: "baseline",
          paddingBottom: 10,
          borderBottom: "1px solid #332c26",
        }}
      >
        {tools}
        <Editable
          value={item.name[lang]}
          editing={editing}
          placeholder="название"
          style={{ fontSize: 15 }}
          onSave={(next) => save(() => saveMenuItem(item.id, { [nameField]: next }))}
        />
        {priceNode}
      </div>
    );
  }

  return (
    <div
      className="cap-editable-block"
      style={{
        display: "flex",
        gap: 20,
        alignItems: "baseline",
        paddingBottom: 14,
        borderBottom: "1px solid #332c26",
      }}
    >
      {tools}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <Editable
          value={item.name[lang]}
          editing={editing}
          placeholder="название"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 17 }}
          onSave={(next) => save(() => saveMenuItem(item.id, { [nameField]: next }))}
        />
        <Editable
          value={item.desc[lang]}
          editing={editing}
          multiline
          placeholder="описание"
          style={{ fontSize: 14, lineHeight: 1.5, color: "#a89f96" }}
          onSave={(next) => save(() => saveMenuItem(item.id, { [descField]: next }))}
        />
      </div>
      {priceNode}
    </div>
  );
}
