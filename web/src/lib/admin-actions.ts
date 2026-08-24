"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { destroySession, requireSession, signIn } from "./auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите почту и пароль" };
  }

  const session = await signIn(email, password);
  if (!session) {
    return { error: "Неверная почта или пароль" };
  }

  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

// ─────────────────────────────────────────────────────────────
//  Пользователи
// ─────────────────────────────────────────────────────────────

export type UserFormState = { error?: string; ok?: string };

export async function createUserAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireSession();
  if (session.role !== "owner" && session.role !== "admin") {
    return { error: "Недостаточно прав" };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email.includes("@")) return { error: "Нужна корректная почта" };
  if (password.length < 8) return { error: "Пароль минимум 8 символов" };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Такой пользователь уже есть" };

  await db.user.create({
    data: {
      email,
      name: name || email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "editor",
    },
  });

  revalidatePath("/admin/settings");
  return { ok: `Добавлен ${email}` };
}

export async function changePasswordAction(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const session = await requireSession();

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");

  if (next.length < 8) return { error: "Новый пароль минимум 8 символов" };

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "Пользователь не найден" };

  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { error: "Текущий пароль неверный" };
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });

  return { ok: "Пароль обновлён" };
}

export async function deleteUserAction(id: string) {
  const session = await requireSession();
  if (session.role !== "owner") throw new Error("Удалять может только владелец");
  if (session.userId === id) throw new Error("Нельзя удалить себя");

  await db.user.delete({ where: { id } });
  revalidatePath("/admin/settings");
}

// ─────────────────────────────────────────────────────────────
//  Медиа
// ─────────────────────────────────────────────────────────────

export async function deleteMedia(id: string) {
  await requireSession();
  // Слоты, которые ссылались на файл, обнулятся сами (onDelete: SetNull).
  await db.media.delete({ where: { id } });
  revalidatePath("/admin/media");
  revalidatePath("/", "layout");
}
