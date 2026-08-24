"use client";

import Link from "next/link";
import { useContent } from "@/components/editor/ContentProvider";
import { AddEntry, EntryTools, EntryTxt, Repeat, Txt } from "@/components/editor/fields";
import { Slot } from "@/components/editor/Slot";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  GHOST_BTN,
  KICKER,
  OUTLINE_BTN,
  PAGE,
  RIDGED,
  SECTION_TITLE,
  mapEmbedUrl,
} from "./styles";

export function HomeView() {
  const { content, lang, editing } = useContent();
  const l = (path: string) => `/${lang}${path}`;

  return (
    <div style={PAGE}>
      <Header />

      {/* ── Первый экран ─────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          ...RIDGED,
          color: "#f4f1ee",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div
          style={{
            padding: "88px 40px 64px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-20%",
              pointerEvents: "none",
              background:
                "radial-gradient(closest-side, rgba(236,48,19,0.16), rgba(236,48,19,0) 70%)",
              animation: "capDrift 22s ease-in-out infinite alternate",
            }}
          />
          <Txt
            k="heroKicker"
            style={{
              fontSize: 12,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
              animationDelay: "0.05s",
            }}
          />
          <Txt
            k="heroTitle"
            as="h1"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "clamp(44px, 5.4vw, 76px)",
              lineHeight: 0.94,
              letterSpacing: "-0.02em",
              margin: 0,
              textWrap: "pretty",
              animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
              animationDelay: "0.16s",
            }}
          />
          <Txt
            k="heroBody"
            as="p"
            multiline
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              maxWidth: "46ch",
              margin: 0,
              color: "#b9b0a7",
              textWrap: "pretty",
              animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
              animationDelay: "0.28s",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              paddingTop: 8,
              animation: "capUp .9s cubic-bezier(.2,.75,.25,1) both",
              animationDelay: "0.4s",
            }}
          >
            <Link href={l("/visit")} className="btn btn-primary">
              <Txt k="ctaBook" />
            </Link>
            <Link href={l("/menu")} className="btn cap-outline-btn" style={OUTLINE_BTN}>
              <Txt k="ctaMenu" />
            </Link>
          </div>
        </div>

        <div
          className="grayscale"
          style={{
            position: "relative",
            minHeight: 520,
            borderLeft: "2px solid var(--color-accent)",
          }}
        >
          <Slot image={content.images["home.hero"] ?? null} />
        </div>
      </section>

      {/* ── Цифры ────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <Repeat listKey="facts">
          {(entry) => (
            <div
              key={entry.id}
              className="cap-reveal cap-editable-block"
              style={{
                padding: "26px 28px",
                borderRight: "2px solid #3b332c",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <EntryTools entry={entry} />
              <EntryTxt
                entry={entry}
                field="value"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: 26,
                }}
              />
              <EntryTxt
                entry={entry}
                field="label"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "#a89f96",
                }}
              />
            </div>
          )}
        </Repeat>
        {editing && (
          <div style={{ padding: "26px 28px", borderRight: "2px solid #3b332c" }}>
            <AddEntry listKey="facts" label="+ цифра" />
          </div>
        )}
      </div>

      {/* ── О нас ────────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 0,
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div
          className="cap-reveal"
          style={{
            padding: "72px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 22,
            borderRight: "2px solid #3b332c",
            background: "#1f1a16",
          }}
        >
          <Txt k="aboutKicker" style={KICKER} />
          <Txt
            k="aboutTitle"
            as="h2"
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "clamp(30px, 3.2vw, 44px)",
              lineHeight: 1.02,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          />
          <Txt
            k="aboutP1"
            as="p"
            multiline
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "50ch",
              textWrap: "pretty",
            }}
          />
          <Txt
            k="aboutP2"
            as="p"
            multiline
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: "50ch",
              color: "#a89f96",
              textWrap: "pretty",
            }}
          />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 6, alignItems: "center" }}>
            <Repeat listKey="aboutTags">
              {(entry) => (
                <span
                  key={entry.id}
                  className="tag cap-editable-block"
                  style={{
                    border: "1px solid #4a4038",
                    background: "transparent",
                    color: "#b9b0a7",
                    paddingTop: editing ? 12 : undefined,
                  }}
                >
                  <EntryTools entry={entry} />
                  <EntryTxt entry={entry} field="text" />
                </span>
              )}
            </Repeat>
            <AddEntry listKey="aboutTags" label="+ тег" style={{ padding: "4px 10px" }} />
          </div>
        </div>

        <div className="grayscale" style={{ position: "relative", minHeight: 440 }}>
          <Slot image={content.images["home.about"] ?? null} />
        </div>
      </section>

      {/* ── Что у нас есть ───────────────────────────────────── */}
      <section style={{ padding: "72px 40px", borderBottom: "2px solid #3b332c" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 36,
          }}
        >
          <Txt k="menuTitle" as="h2" style={SECTION_TITLE} />
          <Link href={l("/menu")} className="btn cap-ghost-btn" style={GHOST_BTN}>
            <Txt k="menuLink" />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          <Repeat listKey="teasers">
            {(entry) => (
              <article
                key={entry.id}
                className="cap-card cap-reveal cap-editable-block"
                style={{
                  border: "2px solid #3b332c",
                  backgroundColor: "#241f1b",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px), linear-gradient(160deg, #2c241d 0%, #201a16 100%)",
                  display: "flex",
                  flexDirection: "column",
                  transition:
                    "transform .45s cubic-bezier(.2,.75,.25,1), border-color .3s ease",
                }}
              >
                <EntryTools entry={entry} />
                <div
                  className="grayscale"
                  style={{ position: "relative", height: 290, borderBottom: "2px solid #3b332c" }}
                >
                  <Slot image={entry.image} />
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                  <EntryTxt
                    entry={entry}
                    field="kicker"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "#ec3013",
                    }}
                  />
                  <EntryTxt
                    entry={entry}
                    field="title"
                    as="h3"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 700,
                      fontSize: 24,
                      margin: 0,
                    }}
                  />
                  <EntryTxt
                    entry={entry}
                    field="body"
                    as="p"
                    multiline
                    style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "#a89f96" }}
                  />
                </div>
              </article>
            )}
          </Repeat>

          {editing && (
            <div style={{ display: "grid", placeItems: "center", border: "2px dashed #3b332c", minHeight: 200 }}>
              <AddEntry listKey="teasers" label="+ карточка" />
            </div>
          )}
        </div>
      </section>

      {/* ── Отзывы ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "72px 40px",
          background: "#100d0b",
          color: "#f4f1ee",
          borderBottom: "2px solid var(--color-accent)",
        }}
      >
        <Txt k="revTitle" as="h2" style={{ ...SECTION_TITLE, margin: "0 0 36px" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 0,
            borderTop: "2px solid #4a4038",
          }}
        >
          <Repeat listKey="reviews">
            {(entry) => (
              <blockquote
                key={entry.id}
                className="cap-reveal cap-editable-block"
                style={{
                  margin: 0,
                  padding: "32px 28px",
                  borderRight: "2px solid #4a4038",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <EntryTools entry={entry} />
                <span style={{ color: "var(--color-accent)", letterSpacing: "0.3em", fontSize: 13 }}>
                  ★★★★★
                </span>
                <EntryTxt
                  entry={entry}
                  field="text"
                  as="p"
                  multiline
                  style={{ margin: 0, fontSize: 18, lineHeight: 1.5, textWrap: "pretty" }}
                />
                <EntryTxt
                  entry={entry}
                  field="name"
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#8e857c",
                    marginTop: "auto",
                  }}
                />
              </blockquote>
            )}
          </Repeat>
          {editing && (
            <div style={{ padding: "32px 28px", borderRight: "2px solid #4a4038" }}>
              <AddEntry listKey="reviews" label="+ отзыв" />
            </div>
          )}
        </div>
      </section>

      {/* ── Как найти ────────────────────────────────────────── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          borderBottom: "2px solid #3b332c",
        }}
      >
        <div
          className="cap-reveal"
          style={{
            padding: "72px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 24,
            borderRight: "2px solid #3b332c",
          }}
        >
          <Txt k="locKicker" style={KICKER} />
          <Txt k="addressLine1" scope="common" as="h2" style={SECTION_TITLE} />
          <Txt
            k="addressLine2"
            scope="common"
            as="p"
            style={{ margin: 0, fontSize: 17, lineHeight: 1.6 }}
          />

          <div
            style={{
              borderTop: "2px solid #3b332c",
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              maxWidth: 420,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 15 }}>
              <Txt k="hoursWeek" />
              <Txt k="hoursWeekTime" style={{ fontWeight: 700 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 15 }}>
              <Txt k="hoursSun" />
              <Txt k="hoursSunTime" style={{ fontWeight: 700 }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", paddingTop: 8 }}>
            <Link href={l("/visit")} className="btn btn-primary">
              <Txt k="ctaBook" />
            </Link>
            <a
              href={`tel:${content.settings.phoneHref ?? ""}`}
              className="btn cap-outline-btn"
              style={OUTLINE_BTN}
              onClick={(e) => editing && e.preventDefault()}
            >
              <Txt k="ctaCall" />
            </a>
          </div>
        </div>

        <div style={{ position: "relative", minHeight: 400, background: "#17130f" }}>
          <iframe
            src={mapEmbedUrl(content.settings.mapQuery ?? "Yerevan")}
            style={{
              position: "absolute",
              inset: 0,
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
      </section>

      <Footer />
    </div>
  );
}
