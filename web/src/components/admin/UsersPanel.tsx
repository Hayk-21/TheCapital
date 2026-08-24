"use client";

import { useActionState, useTransition } from "react";
import {
  changePasswordAction,
  createUserAction,
  deleteUserAction,
  type UserFormState,
} from "@/lib/admin-actions";

export type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  lastLoginAt: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  owner: "владелец",
  admin: "администратор",
  editor: "редактор",
};

export function UsersPanel({
  users,
  currentUserId,
  currentRole,
}: {
  users: UserRow[];
  currentUserId: string;
  currentRole: string;
}) {
  const [createState, createAction, creating] = useActionState<UserFormState, FormData>(
    createUserAction,
    {},
  );
  const [passwordState, passwordAction, changing] = useActionState<UserFormState, FormData>(
    changePasswordAction,
    {},
  );
  const [pending, startTransition] = useTransition();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="adm-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Почта</th>
              <th>Роль</th>
              <th>Последний вход</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ opacity: pending ? 0.6 : 1 }}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{ROLE_LABEL[user.role] ?? user.role}</td>
                <td className="adm-hint">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "не заходил"}
                </td>
                <td>
                  {currentRole === "owner" && user.id !== currentUserId && (
                    <button
                      type="button"
                      className="adm-btn"
                      data-variant="ghost"
                      onClick={() => {
                        if (confirm(`Убрать доступ для ${user.email}?`))
                          startTransition(async () => {
                            await deleteUserAction(user.id);
                          });
                      }}
                    >
                      Убрать
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="adm-grid">
        <form action={createAction} className="adm-card">
          <span className="adm-label">Добавить редактора</span>
          <div>
            <label className="adm-label" htmlFor="new-name">
              Имя
            </label>
            <input id="new-name" name="name" className="adm-input" />
          </div>
          <div>
            <label className="adm-label" htmlFor="new-email">
              Почта
            </label>
            <input id="new-email" name="email" type="email" className="adm-input" required />
          </div>
          <div>
            <label className="adm-label" htmlFor="new-password">
              Пароль
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              className="adm-input"
              minLength={8}
              required
            />
            <div className="adm-hint" style={{ marginTop: 4 }}>
              Минимум 8 символов. Передайте человеку лично.
            </div>
          </div>
          {createState.error && <div className="adm-error">{createState.error}</div>}
          {createState.ok && <div className="adm-ok">{createState.ok}</div>}
          <button type="submit" className="adm-btn" disabled={creating}>
            {creating ? "Добавляю…" : "Добавить"}
          </button>
        </form>

        <form action={passwordAction} className="adm-card">
          <span className="adm-label">Сменить свой пароль</span>
          <div>
            <label className="adm-label" htmlFor="cur-password">
              Текущий пароль
            </label>
            <input
              id="cur-password"
              name="current"
              type="password"
              className="adm-input"
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label className="adm-label" htmlFor="next-password">
              Новый пароль
            </label>
            <input
              id="next-password"
              name="next"
              type="password"
              className="adm-input"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          {passwordState.error && <div className="adm-error">{passwordState.error}</div>}
          {passwordState.ok && <div className="adm-ok">{passwordState.ok}</div>}
          <button type="submit" className="adm-btn" disabled={changing}>
            {changing ? "Меняю…" : "Сменить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
