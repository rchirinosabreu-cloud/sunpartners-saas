const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateMissingContacts() {
  console.log('[Migration] Checking for clients without contacts...');

  const clients = await prisma.client.findMany({
    where: {
      contacts: { none: {} },
      deletedAt: null
    }
  });

  if (clients.length === 0) {
    console.log('[Migration] No clients found requiring contact population.');
    return;
  }

  console.log(`[Migration] Found ${clients.length} clients to migrate.`);

  for (const client of clients) {
    if (client.responsable || client.email || client.telefono) {
      try {
        await prisma.clientContact.create({
          data: {
            clientId: client.id,
            name: client.responsable || 'Contacto Principal',
            email: client.email,
            phone: client.telefono,
            isPrimary: true,
            isActive: true,
            role: 'Migración Auto'
          }
        });
        console.log(`[Migration] Created contact for: ${client.razon_social}`);
      } catch (err) {
        console.error(`[Migration] Error migrating ${client.razon_social}:`, err.message);
      }
    }
  }

  console.log('[Migration] Contact population finished.');
}

module.exports = migrateMissingContacts;
if (require.main === module) {
  migrateMissingContacts()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
}
