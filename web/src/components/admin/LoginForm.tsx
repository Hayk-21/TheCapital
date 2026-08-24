"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/admin-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="adm-login">
      <form action={action} className="adm-login-box">
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontSize: 18,
            }}
          >
            The Capital
          </div>
          <div className="adm-hint" style={{ marginTop: 4 }}>
            Панель управления сайтом
          </div>
        </div>

        <div>
          <label className="adm-label" htmlFor="email">
            Почта
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="adm-input"
            autoComplete="username"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="adm-label" htmlFor="password">
            Пароль
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="adm-input"
            autoComplete="current-password"
            required
          />
        </div>

        {state.error && <div className="adm-error">{state.error}</div>}

        <button type="submit" className="adm-btn" disabled={pending}>
          {pending ? "Вхожу…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
