const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING STATUS MIGRATION ---');
  try {
    const result = await prisma.quotation.updateMany({
      where: { estado: 'FINALIZADA' },
      data: { estado: 'APROBADA' }
    });
    console.log(`Successfully migrated ${result.count} quotations from FINALIZADA to APROBADA.`);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
  console.log('--- MIGRATION FINISHED ---');
}

main();
