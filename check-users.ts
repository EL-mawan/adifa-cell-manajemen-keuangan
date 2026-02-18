import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const tursoUrl = "libsql://adifa-cell-el-mawan.turso.io"
const tursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3NzEzNjkxMDEsImlkIjoiMDRlNjZmYjctNmFmMi00ZTgwLWI4YzgtZDhlMDk1ZGVhOWIxIiwicmlkIjoiNGNkNmJhYjYtMzBkMi00MTVhLWIxZWYtNzlhMDQ2ZTJmZjYyIn0.3AQT9sC2gM9NsPVEjHqCsB9FDqGrlZQaVkYp8Cp5hcpBV37AqPlwMJuJP_LdaeFJhCgSS0W-CUFWbkiotYLUDQ"

const libsql = createClient({
  url: tursoUrl,
  authToken: tursoToken,
});
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      role: true
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
