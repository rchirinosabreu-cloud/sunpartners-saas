const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting data cleanup: Converting EIN to OTHER...');

  try {
    // 1. Update Client table
    const result = await prisma.$executeRaw`UPDATE "Client" SET "documentType" = 'OTHER' WHERE "documentType" = 'EIN';`;
    console.log(`Updated ${result} records in Client table.`);

    console.log('Cleanup completed successfully.');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
