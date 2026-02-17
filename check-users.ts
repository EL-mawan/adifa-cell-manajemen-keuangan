import { db } from './src/lib/db';

async function checkUsers() {
  const users = await db.user.findMany();
  console.log('Total users:', users.length);
  users.forEach(u => console.log(`- ${u.name} (${u.email}) [${u.role}]`));
  process.exit();
}

checkUsers();
