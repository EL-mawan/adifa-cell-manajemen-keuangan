import { db } from './src/lib/db';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  const email = 'admin@adifacell.com';
  const newPassword = 'admin'; // Password baru yang mudah diingat

  console.log(`Menyiapkan reset password untuk: ${email}`);
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const user = await db.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        isActive: true // Memastikan akun aktif
      }
    });

    console.log('--- HASIL RESET ---');
    console.log(`User ID   : ${user.id}`);
    console.log(`Nama      : ${user.name}`);
    console.log(`Email     : ${user.email}`);
    console.log(`Password  : ${newPassword}`);
    console.log('-------------------');
    console.log('Berhasil! Password telah diubah di database Turso.');
    
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('Error: User admin tidak ditemukan di database.');
    } else {
      console.error('Error saat reset password:', error.message);
    }
  } finally {
    process.exit();
  }
}

resetAdminPassword();
