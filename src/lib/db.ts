import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let adapter: any = null;

if (tursoUrl) {
  const libsql = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });
  adapter = new PrismaLibSQL(libsql);
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(adapter ? { adapter } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db