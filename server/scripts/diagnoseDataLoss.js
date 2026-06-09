const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DATABASE DIAGNOSTIC START ---');

  try {
    // 1. Raw count (ignores Prisma filters)
    const rawCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "Client"`;
    console.log('Raw Client Count (SQL):', rawCount);

    // 2. Prisma count (respects soft-delete if implemented in db.js)
    const prismaCount = await prisma.client.count();
    console.log('Prisma Client Count (Filtered):', prismaCount);

    // 3. Check for records with deletedAt set
    const deletedCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "Client" WHERE "deletedAt" IS NOT NULL`;
    console.log('Clients marked as deleted:', deletedCount);

    // 4. Sample check
    const sample = await prisma.$queryRaw`SELECT id, razon_social, "documentType" FROM "Client" LIMIT 5`;
    console.log('Sample data (SQL):', sample);

    // 5. Check Contacts
    const contactCount = await prisma.$queryRaw`SELECT COUNT(*) FROM "ClientContact"`;
    console.log('Total ClientContacts:', contactCount);

    console.log('--- DIAGNOSTIC COMPLETE ---');
  } catch (error) {
    console.error('Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
