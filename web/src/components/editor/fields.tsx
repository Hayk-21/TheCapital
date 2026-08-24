"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useContent } from "./ContentProvider";
import { Editable } from "./Editable";
import {
  addEntry,
  deleteEntry,
  moveEntry,
  saveEntryField,
  saveSetting,
  saveText,
} from "@/lib/actions";
import type { ListEntryView } from "@/lib/view";

type Common = {
  as?: ElementType;
  style?: CSSProperties;
  className?: string;
  multiline?: boolean;
};

/** Текст страницы по ключу. scope="common" — для шапки и подвала. */
export function Txt({
  k,
  scope,
  ...rest
}: { k: string; scope?: string } & Common & Record<string, unknown>) {
  const { content, lang, editing, scope: pageScope, save } = useContent();
  const target = scope ?? pageScope;
  const source = target === "common" ? content.common : content.texts;
  const value = source[k]?.[lang] ?? "";

  return (
    <Editable
      value={value}
      editing={editing}
      placeholder={k}
      onSave={(next) => save(() => saveText(target, k, lang, next))}
      {...rest}
    />
  );
}

/** Поле внутри элемента повторяющегося блока. */
export function EntryTxt({
  entry,
  field,
  ...rest
}: { entry: ListEntryView; field: string } & Common & Record<string, unknown>) {
  const { lang, editing, save } = useContent();
  const value = entry[lang]?.[field] ?? "";

  return (
    <Editable
      value={value}
      editing={editing}
      placeholder={field}
      onSave={(next) => save(() => saveEntryField(entry.id, lang, field, next))}
      {...rest}
    />
  );
}

/** Настройка сайта — телефон, адрес для карты и т.п. Одна на оба языка. */
export function SettingTxt({
  k,
  ...rest
}: { k: string } & Common & Record<string, unknown>) {
  const { content, editing, save } = useContent();
  const value = content.settings[k] ?? "";

  return (
    <Editable
      value={value}
      editing={editing}
      placeholder={k}
      onSave={(next) => save(() => saveSetting(k, next))}
      {...rest}
    />
  );
}

/**
 * Повторяющийся блок. Рендер элемента задаёт вызывающая сторона, поэтому
 * вёрстка остаётся точно такой, какой была в исходном макете.
 */
export function Repeat({
  listKey,
  children,
}: {
  listKey: string;
  children: (entry: ListEntryView, index: number) => ReactNode;
}) {
  const { content, editing } = useContent();
  const entries = content.lists[listKey] ?? [];
  const visible = editing ? entries : entries.filter((e) => e.visible);
  return <>{visible.map((entry, i) => children(entry, i))}</>;
}

/** Кнопки элемента списка: порядок и удаление. Живут поверх самого элемента. */
export function EntryTools({ entry }: { entry: ListEntryView }) {
  const { editing, save } = useContent();
  if (!editing) return null;

  return (
    <div className="cap-block-tools">
      <button
        type="button"
        className="cap-tool-btn"
        title="Выше"
        onClick={() => save(() => moveEntry(entry.id, "up"))}
      >
        ↑
      </button>
      <button
        type="button"
        className="cap-tool-btn"
        title="Ниже"
        onClick={() => save(() => moveEntry(entry.id, "down"))}
      >
        ↓
      </button>
      <button
        type="button"
        className="cap-tool-btn"
        data-danger="true"
        title="Удалить"
        onClick={() => {
          if (confirm("Удалить этот элемент?")) save(() => deleteEntry(entry.id));
        }}
      >
        ✕
      </button>
    </div>
  );
}

/** Кнопка «добавить» под списком. */
export function AddEntry({
  listKey,
  label = "+ добавить",
  style,
}: {
  listKey: string;
  label?: string;
  style?: CSSProperties;
}) {
  const { editing, scope, save } = useContent();
  if (!editing) return null;

  return (
    <button
      type="button"
      className="cap-tool-btn"
      style={{ alignSelf: "start", padding: "10px 14px", ...style }}
      onClick={() => save(() => addEntry(scope, listKey))}
    >
      {label}
    </button>
  );
}
