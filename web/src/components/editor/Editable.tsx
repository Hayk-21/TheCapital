"use client";

import {
  createElement,
  useRef,
  type CSSProperties,
  type ElementType,
  type FormEvent,
  type KeyboardEvent,
} from "react";

/**
 * Кусок текста, который в режиме редактирования правится прямо на странице.
 *
 * Вне режима редактирования это обычный тег — никакого лишнего DOM и никаких
 * обработчиков, публичная страница не платит за редактор.
 *
 * Внутри режима содержимое отдаётся через dangerouslySetInnerHTML, а «есть
 * несохранённые правки» держится в ref и проставляется data-атрибутом руками.
 * Любой setState во время набора заставил бы React перерисовать contentEditable
 * и сбросить курсор — а вместе с ним и то, что человек печатает.
 */

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function Editable({
  as = "span",
  value,
  editing,
  multiline = false,
  placeholder,
  onSave,
  style,
  className,
  ...rest
}: {
  as?: ElementType;
  value: string;
  editing: boolean;
  multiline?: boolean;
  placeholder?: string;
  onSave: (next: string) => void;
  style?: CSSProperties;
  className?: string;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const dirty = useRef(false);

  if (!editing) {
    return createElement(
      as,
      {
        style: multiline ? { whiteSpace: "pre-wrap", ...style } : style,
        className,
        ...rest,
      },
      value,
    );
  }

  const read = () =>
    (ref.current?.textContent ?? "").replace(/ /g, " ");

  const commit = () => {
    const el = ref.current;
    if (!el) return;

    dirty.current = false;
    delete el.dataset.dirty;

    const next = read();
    if (next === value) {
      el.textContent = value; // откатываем возможные пустые узлы
      return;
    }
    onSave(next);
  };

  const onInput = (e: FormEvent<HTMLElement>) => {
    dirty.current = true;
    const el = e.currentTarget;
    el.dataset.dirty = "true";
    if (read()) delete el.dataset.empty;
    else el.dataset.empty = "true";
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (ref.current) {
        ref.current.textContent = value;
        dirty.current = false;
        delete ref.current.dataset.dirty;
      }
      ref.current?.blur();
      return;
    }
    // Однострочные поля закрываем по Enter, многострочные — по Ctrl/Cmd+Enter.
    if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return createElement(as, {
    ref,
    contentEditable: "plaintext-only",
    suppressContentEditableWarning: true,
    spellCheck: false,
    "data-editable": "true",
    "data-empty": value ? undefined : "true",
    "data-placeholder": placeholder ?? "пусто",
    onInput,
    onBlur: commit,
    onKeyDown,
    style: { whiteSpace: multiline ? "pre-wrap" : undefined, ...style },
    className,
    ...rest,
    dangerouslySetInnerHTML: { __html: escapeHtml(value) },
  });
}
