const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Client to ClientContact...');

  // 1. Get all clients with legacy contact info
  const clients = await prisma.client.findMany({
    include: { quotations: true }
  });

  for (const client of clients) {
    if (client.responsable || client.email || client.telefono) {
      console.log(`Processing client: ${client.razon_social}`);

      // 2. Create the primary contact
      const contact = await prisma.clientContact.create({
        data: {
          clientId: client.id,
          name: client.responsable || 'Contacto Principal',
          email: client.email,
          phone: client.telefono,
          isPrimary: true,
          isActive: true
        }
      });

      // 3. Update existing quotations for this client
      if (client.quotations.length > 0) {
        console.log(`Updating ${client.quotations.length} quotations for ${client.razon_social}`);
        await prisma.quotation.updateMany({
          where: { clientId: client.id },
          data: {
            clientContactId: contact.id,
            contactName: contact.name,
            contactEmail: contact.email,
            contactPhone: contact.phone
          }
        });
      }
    }
  }

  console.log('Migration completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
