"use client";

import { useState } from "react";
import { useContent } from "@/components/editor/ContentProvider";
import { AddEntry, EntryTools, EntryTxt, Repeat, SettingTxt, Txt } from "@/components/editor/fields";
import { Slot } from "@/components/editor/Slot";
import { createBooking } from "@/lib/actions";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  FIELD_LABEL,
  GHOST_BTN,
  INPUT,
  OUTLINE_BTN,
  PAGE,
  PAGE_KICKER,
  PAGE_TITLE,
  RIDGED,
  SECTION_TITLE,
  mapEmbedUrl,
  mapLinkUrl,
} from "./styles";

export function VisitView() {
  const { content, lang, editing } = useContent();
  const mapQuery = content.settings.mapQuery ?? "Yerevan";

  return (
    <div style={PAGE}>
      <Header />

      {/* ── Шапка страницы ───────────────────────────────────── */}
      <section
        style={{
          padding: "72px 40px 48px",
          borderBottom: "2px solid #3b332c",
          display: "flex",
          flexDirection: "column",
          gap: 18,
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
            maxWidth: "56ch",
            margin: 0,
            color: "#a89f96",
            textWrap: "pretty",
          }}
        />
      </section>

      {/* ── Часы и адрес ─────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div
          style={{
            padding: "56px 40px",
            borderRight: "2px solid #3b332c",
            display: "flex",
            flexDirection: "column",
            gap: 22,
            ...RIDGED,
          }}
        >
          <Txt
            k="hoursTitle"
            as="h2"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, margin: 0 }}
          />
          <div className="cap-reveal" style={{ display: "flex", flexDirection: "column" }}>
            <Repeat listKey="hours">
              {(entry) => (
                <div
                  key={entry.id}
                  className="cap-editable-block"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 20,
                    padding: "13px 0",
                    borderBottom: "1px solid #332c26",
                    fontSize: 16,
                  }}
                >
                  <EntryTools entry={entry} />
                  <EntryTxt entry={entry} field="day" />
                  <EntryTxt entry={entry} field="time" style={{ fontWeight: 700 }} />
                </div>
              )}
            </Repeat>
            <AddEntry listKey="hours" label="+ день" style={{ marginTop: 12 }} />
          </div>
          <Txt k="hoursNote" as="p" style={{ fontSize: 14, color: "#a89f96", margin: 0 }} />
        </div>

        <div style={{ padding: "56px 40px", display: "flex", flexDirection: "column", gap: 22 }}>
          <Txt
            k="addressTitle"
            as="h2"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 26, margin: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 20,
              lineHeight: 1.45,
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
            }}
          >
            <Txt k="addressLine1" scope="common" as="span" style={{ display: "block" }} />
            <Txt k="addressLine2" scope="common" as="span" style={{ display: "block" }} />
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 16 }}>
            <a
              href={`tel:${content.settings.phoneHref ?? ""}`}
              onClick={(e) => editing && e.preventDefault()}
            >
              <SettingTxt k="phone" />
            </a>
            {(editing || content.settings.whatsapp) && (
              <a
                href={content.settings.whatsapp || "#"}
                onClick={(e) => editing && e.preventDefault()}
              >
                WhatsApp · <SettingTxt k="phone" />
              </a>
            )}
            {(editing || content.settings.email) && (
              <a
                href={`mailto:${content.settings.email ?? ""}`}
                onClick={(e) => editing && e.preventDefault()}
              >
                <SettingTxt k="email" />
              </a>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
            <a
              href={mapLinkUrl(mapQuery)}
              className="btn cap-outline-btn"
              style={OUTLINE_BTN}
              onClick={(e) => editing && e.preventDefault()}
            >
              <Txt k="ctaMap" />
            </a>
            {(editing || content.settings.instagram) && (
              <a
                href={content.settings.instagram || "#"}
                className="btn cap-ghost-btn"
                style={GHOST_BTN}
                onClick={(e) => editing && e.preventDefault()}
              >
                Instagram
              </a>
            )}
            {(editing || content.settings.telegram) && (
              <a
                href={content.settings.telegram || "#"}
                className="btn cap-ghost-btn"
                style={GHOST_BTN}
                onClick={(e) => editing && e.preventDefault()}
              >
                Telegram
              </a>
            )}
          </div>

          <div
            style={{
              position: "relative",
              height: 300,
              border: "2px solid #3b332c",
              marginTop: 8,
              background: "#17130f",
            }}
          >
            <iframe
              src={mapEmbedUrl(mapQuery)}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                display: "block",
                filter: "grayscale(0.35) contrast(1.05)",
              }}
              loading="lazy"
              title="The Capital on Google Maps"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ── Бронь ────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div style={{ padding: "64px 40px", borderRight: "2px solid #3b332c" }}>
          <Txt k="bookTitle" as="h2" style={{ ...SECTION_TITLE, margin: "0 0 10px" }} />
          <Txt
            k="bookBody"
            as="p"
            multiline
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#a89f96",
              margin: "0 0 32px",
              maxWidth: "48ch",
            }}
          />
          <BookingForm />
        </div>

        <div className="grayscale" style={{ position: "relative", minHeight: 480 }}>
          <Slot image={content.images["visit.room"] ?? null} />
        </div>
      </section>

      {/* ── Правила ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "56px 40px",
          background: "#100d0b",
          color: "#f4f1ee",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 0,
          borderBottom: "2px solid var(--color-accent)",
        }}
      >
        <Repeat listKey="rules">
          {(entry) => (
            <div
              key={entry.id}
              className="cap-reveal cap-editable-block"
              style={{
                padding: "0 28px",
                borderRight: "2px solid #4a4038",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <EntryTools entry={entry} />
              <EntryTxt
                entry={entry}
                field="label"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                }}
              />
              <EntryTxt
                entry={entry}
                field="text"
                multiline
                style={{ fontSize: 16, lineHeight: 1.55, color: "#b9b0a7" }}
              />
            </div>
          )}
        </Repeat>
        {editing && (
          <div style={{ padding: "0 28px" }}>
            <AddEntry listKey="rules" label="+ правило" />
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────

function BookingForm() {
  const { content, lang, editing } = useContent();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const seatOptions = (content.lists.seatOptions ?? []).filter((e) => e.visible);

  // В режиме правки показываем и форму, и блок «заявка отправлена»,
  // чтобы можно было отредактировать текст подтверждения.
  if (state === "sent" && !editing) {
    return (
      <div
        style={{
          border: "2px solid var(--color-accent)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <Txt
          k="sentTitle"
          style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}
        />
        <Txt
          k="sentBody"
          multiline
          style={{ fontSize: 15, lineHeight: 1.6, color: "#a89f96" }}
        />
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editing) return;

    const data = new FormData(event.currentTarget);
    setState("sending");
    try {
      await createBooking({
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        date: String(data.get("date") ?? ""),
        time: String(data.get("time") ?? ""),
        guests: String(data.get("guests") ?? ""),
        seating: String(data.get("seating") ?? ""),
        note: String(data.get("note") ?? ""),
        lang,
      });
      setState("sent");
    } catch (err) {
      console.error(err);
      setState("error");
    }
  };

  const field = (name: string, labelKey: string, type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Txt k={labelKey} as="label" style={FIELD_LABEL} htmlFor={`cap-${name}`} />
      <input
        id={`cap-${name}`}
        name={name}
        type={type}
        className="cap-input"
        style={INPUT}
        disabled={editing}
        {...extra}
      />
    </div>
  );

  return (
    <>
      {editing && (
        <div
          style={{
            border: "2px solid var(--color-accent)",
            padding: 20,
            marginBottom: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <span style={{ ...FIELD_LABEL, color: "#ec3013" }}>
            Экран после отправки заявки
          </span>
          <Txt
            k="sentTitle"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 22 }}
          />
          <Txt k="sentBody" multiline style={{ fontSize: 15, lineHeight: 1.6, color: "#a89f96" }} />
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="cap-reveal"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 20,
          maxWidth: 620,
        }}
      >
        {field("name", "fName", "text", { required: true })}
        {field("phone", "fPhone", "tel", { required: true })}
        {field("date", "fDate", "date")}
        {field("time", "fTime", "time")}
        {field("guests", "fGuests", "number", { min: 1, max: 20 })}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Txt k="fSeat" as="label" style={FIELD_LABEL} htmlFor="cap-seating" />
          <select
            id="cap-seating"
            name="seating"
            className="cap-input"
            style={INPUT}
            disabled={editing}
          >
            {seatOptions.map((entry) => {
              const label = entry[lang]?.text ?? "";
              return (
                <option key={entry.id} value={label}>
                  {label}
                </option>
              );
            })}
          </select>
          {editing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 }}>
              <Repeat listKey="seatOptions">
                {(entry) => (
                  <div
                    key={entry.id}
                    className="cap-editable-block"
                    style={{ display: "flex", gap: 8, alignItems: "center", paddingRight: 90 }}
                  >
                    <EntryTools entry={entry} />
                    <EntryTxt entry={entry} field="text" style={{ fontSize: 13 }} />
                  </div>
                )}
              </Repeat>
              <AddEntry listKey="seatOptions" label="+ вариант" />
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Txt k="fNote" as="label" style={FIELD_LABEL} htmlFor="cap-note" />
          <input id="cap-note" name="note" type="text" className="cap-input" style={INPUT} disabled={editing} />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ gridColumn: "1 / -1", justifySelf: "start" }}
          disabled={state === "sending" || editing}
        >
          <Txt k="fSubmit" />
        </button>

        {state === "error" && (
          <Txt
            k="fError"
            style={{ gridColumn: "1 / -1", color: "#ec3013", fontSize: 14 }}
          />
        )}
      </form>
    </>
  );
}
