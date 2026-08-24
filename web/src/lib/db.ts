import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// В dev Next.js перезагружает модули на каждое изменение — без глобального
// кэша получили бы новое соединение с базой на каждый hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Не задан DATABASE_URL");

  // Neon за пулером: соединения короткие, поэтому пул держим небольшой.
  const adapter = new PrismaPg({ connectionString, max: 5 });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
