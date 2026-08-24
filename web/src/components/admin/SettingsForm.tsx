"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/lib/actions";
import { SETTINGS } from "@/lib/content-schema";

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [draft, setDraft] = useState(values);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const changed = SETTINGS.filter((s) => (draft[s.key] ?? "") !== (values[s.key] ?? ""));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      for (const setting of changed) {
        await saveSetting(setting.key, draft[setting.key] ?? "");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form onSubmit={submit} className="adm-card">
      <div className="adm-grid">
        {SETTINGS.map((setting) => (
          <div key={setting.key}>
            <label className="adm-label" htmlFor={`set-${setting.key}`}>
              {setting.label}
            </label>
            <input
              id={`set-${setting.key}`}
              className="adm-input"
              value={draft[setting.key] ?? ""}
              onChange={(e) => setDraft({ ...draft, [setting.key]: e.target.value })}
            />
            {setting.hint && (
              <div className="adm-hint" style={{ marginTop: 4 }}>
                {setting.hint}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <button type="submit" className="adm-btn" disabled={pending || changed.length === 0}>
          {pending ? "Сохраняю…" : "Сохранить"}
        </button>
        {saved && <span className="adm-ok">Сохранено</span>}
        {changed.length > 0 && !pending && (
          <span className="adm-hint">Изменено полей: {changed.length}</span>
        )}
      </div>
    </form>
  );
}
