import { db } from './src/lib/db.js';

async function testConnection() {
  try {
    console.log('Testing connection to Turso...');
    const users = await db.user.findMany({ take: 1 });
    console.log('Connection successful!');
    console.log('Result:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Connection failed!');
    console.error(error);
  } finally {
    process.exit();
  }
}

testConnection();
