const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Starting hybrid migration of compositions...');
  const compositions = await prisma.composition.findMany({
    where: {
      warehouseItemId: { not: null },
      componentCatalogItemId: null
    }
  });

  console.log(`Found ${compositions.length} legacy compositions to process.`);

  let migratedCount = 0;
  for (const comp of compositions) {
    // Find the commercial item that points to this warehouse item
    const commercialItem = await prisma.inventory_Commercial.findFirst({
      where: { bodegaId: comp.warehouseItemId }
    });

    if (commercialItem) {
      await prisma.composition.update({
        where: { id: comp.id },
        data: {
          componentCatalogItemId: commercialItem.id
          // We keep warehouseItemId for safety as "Legacy" link,
          // but the system will now prioritize componentCatalogItemId
        }
      });
      migratedCount++;
    }
  }

  console.log(`Migration complete. Paired ${migratedCount} compositions with catalog items.`);
  await prisma.$disconnect();
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
