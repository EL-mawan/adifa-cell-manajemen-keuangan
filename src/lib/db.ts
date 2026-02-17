import { PrismaClient } from '@prisma/client'
import * as adapterModule from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Fallback for when the adapter might not be needed (e.g., during build time if not pre-rendering)
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

console.log('--- DB Initialization Debug ---');
console.log('TURSO_DATABASE_URL present:', !!tursoUrl);
console.log('TURSO_AUTH_TOKEN present:', !!tursoToken);
console.log('Adapter Module keys:', Object.keys(adapterModule));

// Find the constructor more reliably (handles ESM, CJS, and various bundlers)
let constructorCandidate: any = (adapterModule as any).PrismaLibSQL;
if (!constructorCandidate && (adapterModule as any).default) {
  constructorCandidate = (adapterModule as any).default.PrismaLibSQL || (adapterModule as any).default;
}
// Handle nested exports if any
if (constructorCandidate && constructorCandidate.PrismaLibSQL) {
  constructorCandidate = constructorCandidate.PrismaLibSQL;
}

const PrismaLibSQL = constructorCandidate;
console.log('PrismaLibSQL found:', typeof PrismaLibSQL === 'function');

let adapter: any = null;

if (typeof PrismaLibSQL === 'function' && tursoUrl) {
  try {
    console.log('Attempting to create LibSQL adapter...');
    adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: tursoToken,
    })
    console.log('LibSQL adapter created successfully');
  } catch (err: any) {
    console.error('CRITICAL: Failed to create LibSQL adapter:', err.message);
  }
} else {
  const reason = !tursoUrl ? 'TURSO_DATABASE_URL is missing' : 'PrismaLibSQL constructor not found';
  console.log(`Using fallback provider because: ${reason}`);
}
console.log('-------------------------------');

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    (adapter 
      ? { adapter, log: ['query'] } 
      : { log: ['query'] }) as any
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db