const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to restore clients marked as deleted...');

  try {
    const result = await prisma.$executeRaw`UPDATE "Client" SET "deletedAt" = NULL, "deletedJustification" = NULL WHERE "deletedAt" IS NOT NULL;`;
    console.log(`Restored ${result} records in Client table.`);

    const contacts = await prisma.$executeRaw`UPDATE "ClientContact" SET "deletedAt" = NULL, "isActive" = true WHERE "deletedAt" IS NOT NULL;`;
    console.log(`Restored ${contacts} records in ClientContact table.`);

    console.log('Restoration attempt complete.');
  } catch (error) {
    console.error('Error during restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
