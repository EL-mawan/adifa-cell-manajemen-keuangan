import { PrismaClient } from '@prisma/client'
import * as adapterModule from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let adapter: any = null;

// Robust discovery of the PrismaLibSQL constructor
const constructorCandidate = (adapterModule as any).PrismaLibSQL || 
                             (adapterModule as any).default?.PrismaLibSQL || 
                             (adapterModule as any).default;

if (typeof constructorCandidate === 'function' && tursoUrl) {
  adapter = new constructorCandidate({
    url: tursoUrl,
    authToken: tursoToken,
  })
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(adapter ? { adapter } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db