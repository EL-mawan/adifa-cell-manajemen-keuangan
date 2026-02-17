import { db as prisma } from '../src/lib/db';
import bcrypt from 'bcryptjs';

// const prisma = new PrismaClient(); // Removed conflicting initialization

async function main() {
  console.log('🌱 Starting seed...');

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@adifacell.com' },
    update: {},
    create: {
      email: 'admin@adifacell.com',
      name: 'Admin Adifa Cell',
      password: adminPassword,
      role: 'ADMIN',
      balance: 10000000,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  /*
  // Create Cashier User
  const cashierPassword = await bcrypt.hash('kasir123', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'kasir@adifacell.com' },
    update: {},
    create: {
      email: 'kasir@adifacell.com',
      name: 'Kasir Adifa Cell',
      password: cashierPassword,
      role: 'KASIR',
      balance: 5000000,
      isActive: true,
    },
  });
  console.log('✅ Cashier user created:', cashier.email);
  */

  // Create Suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { code: 'DOKU' },
    update: {},
    create: {
      name: 'DOKU',
      code: 'DOKU',
      contact: 'support@doku.com',
      address: 'Jakarta, Indonesia',
      isActive: true,
    },
  });
  console.log('✅ Supplier created:', supplier1.name);

  const supplier2 = await prisma.supplier.upsert({
    where: { code: 'DIGIFLAZZ' },
    update: {},
    create: {
      name: 'Digiflazz',
      code: 'DIGIFLAZZ',
      contact: 'cs@digiflazz.com',
      address: 'Jakarta, Indonesia',
      isActive: true,
    },
  });
  console.log('✅ Supplier created:', supplier2.name);

  // Create Products - Pulsa
  const pulsaProducts = [
    { code: 'TSEL5', name: 'Telkomsel 5.000', category: 'PULSA', price: 5500, basePrice: 5200, fee: 100 },
    { code: 'TSEL10', name: 'Telkomsel 10.000', category: 'PULSA', price: 10500, basePrice: 10000, fee: 150 },
    { code: 'TSEL20', name: 'Telkomsel 20.000', category: 'PULSA', price: 20500, basePrice: 19800, fee: 200 },
    { code: 'TSEL50', name: 'Telkomsel 50.000', category: 'PULSA', price: 50500, basePrice: 49500, fee: 250 },
    { code: 'TSEL100', name: 'Telkomsel 100.000', category: 'PULSA', price: 100500, basePrice: 99000, fee: 500 },
    { code: 'ISAT5', name: 'Indosat 5.000', category: 'PULSA', price: 5500, basePrice: 5200, fee: 100 },
    { code: 'ISAT10', name: 'Indosat 10.000', category: 'PULSA', price: 10500, basePrice: 10000, fee: 150 },
    { code: 'XL5', name: 'XL 5.000', category: 'PULSA', price: 5500, basePrice: 5200, fee: 100 },
    { code: 'XL10', name: 'XL 10.000', category: 'PULSA', price: 10500, basePrice: 10000, fee: 150 },
  ];

  for (const product of pulsaProducts) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: {
        code: product.code,
        name: product.name,
        category: product.category as any,
        supplierId: supplier1.id,
        basePrice: product.basePrice,
        sellingPrice: product.price,
        fee: product.fee,
        profit: product.price - product.basePrice,
        isActive: true,
        minBalance: 10000,
      },
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create Products - PLN Token
  const plnProducts = [
    { code: 'PLN20', name: 'PLN Token 20.000', category: 'PLN_TOKEN', price: 22000, basePrice: 21500, fee: 300 },
    { code: 'PLN50', name: 'PLN Token 50.000', category: 'PLN_TOKEN', price: 52000, basePrice: 51000, fee: 500 },
    { code: 'PLN100', name: 'PLN Token 100.000', category: 'PLN_TOKEN', price: 102000, basePrice: 100500, fee: 800 },
  ];

  for (const product of plnProducts) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: {
        code: product.code,
        name: product.name,
        category: product.category as any,
        supplierId: supplier2.id,
        basePrice: product.basePrice,
        sellingPrice: product.price,
        fee: product.fee,
        profit: product.price - product.basePrice,
        isActive: true,
        minBalance: 20000,
      },
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create System Settings
  await prisma.systemSetting.upsert({
    where: { key: 'MIN_BALANCE_ALERT' },
    update: {},
    create: {
      key: 'MIN_BALANCE_ALERT',
      value: '1000000',
      description: 'Minimum saldo untuk notifikasi alert',
    },
  });
  console.log('✅ System settings created');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📋 Login credentials:');
  console.log('   Admin: admin@adifacell.com / admin123');
  console.log('   Kasir: kasir@adifacell.com / kasir123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
