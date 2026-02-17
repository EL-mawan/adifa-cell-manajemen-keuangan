import { db } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const email = 'admin@adifacell.com';
  const password = 'admin'; // Testing common default password

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User found:', user.email);
    const isValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValid);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

testLogin();
