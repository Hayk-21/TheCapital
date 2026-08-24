import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";

const COOKIE_NAME = "capital_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // две недели

export type Session = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET не задан или слишком короткий — проверьте .env",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.userId || !payload.email) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "editor"),
    };
  } catch {
    return null;
  }
}

/** Логин по паролю. Возвращает сессию или null, если пара не подошла. */
export async function signIn(
  email: string,
  password: string,
): Promise<Session | null> {
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) {
    // Считаем хеш вхолостую, чтобы по времени ответа нельзя было
    // отличить «нет такого пользователя» от «неверный пароль».
    await bcrypt.compare(password, "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid");
    return null;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const session: Session = {
    userId: user.id,
    email: user.email,
    name: user.name ?? user.email,
    role: user.role,
  };
  await createSession(session);
  return session;
}

/** Бросает, если запрос пришёл не от залогиненного админа. Для server actions. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Нужно войти в админку");
  return session;
}
