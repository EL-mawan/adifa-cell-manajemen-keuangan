import { PrismaClient } from '@prisma/client'
import * as adapterModule from '@prisma/adapter-libsql'

// Extract PrismaLibSQL from the module in a way that handles both ESM and CJS bundling
const PrismaLibSQL = (adapterModule as any).PrismaLibSQL || (adapterModule as any).default?.PrismaLibSQL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fallback for when the adapter might not be needed (e.g., during build time if not pre-rendering)
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let adapter: any = null;

if (typeof PrismaLibSQL === 'function' && tursoUrl) {
  adapter = new PrismaLibSQL({
    url: tursoUrl,
    authToken: tursoToken,
  })
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db