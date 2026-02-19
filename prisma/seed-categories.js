const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'PULSA', icon: 'Smartphone' },
    { name: 'PAKET_DATA', icon: 'Smartphone' },
    { name: 'PLN_TOKEN', icon: 'Zap' },
    { name: 'PLN_NONTOKEN', icon: 'Zap' },
    { name: 'PDAM', icon: 'FileText' },
    { name: 'BPJS', icon: 'FileText' },
    { name: 'E_WALLET', icon: 'Wallet' },
    { name: 'PULSA_TRANSFER', icon: 'Smartphone' },
    { name: 'VOUCHER_GAME', icon: 'FileText' },
  ];

  console.log('Seeding categories...');

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        icon: cat.icon,
        isActive: true,
      },
    });
  }

  console.log('Categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
