const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const client = await prisma.client.upsert({
    where: { nit: '800.123.456-1' },
    update: {},
    create: {
      empresa: 'LUXURY BTL TEST',
      nit: '800.123.456-1',
      contactoPrincipal: 'Jules AI',
      direccion: 'Av. Siempre Viva 742',
      ciudad: 'Bogotá',
      telefono: '3001234567',
      email: 'jules@luxurybtl.com'
    }
  });

  const invBodega = await prisma.inventory_Bodega.create({
    data: {
      nombre: 'Pantalla LED P2.5 High Density',
      claseA: 100,
      claseB: 50,
      claseC: 10,
      bodega: 'PRINCIPAL',
      seccion: 'CUARTO_1',
      vlrUnitario: 5000000,
      estado: 'ACTIVO'
    }
  });

  // Since sync is on, Inventory_Commercial might have been created already if I used the app,
  // but here I am using Prisma directly.
  const invComm = await prisma.inventory_Commercial.create({
    data: {
      nombre_comercial: 'Pantalla LED Pro Cinema 4K - 500 nits',
      claseA: 100,
      claseB: 50,
      claseC: 10,
      valor_alquiler: 250000,
      estado: 'ACTIVO',
      bodegaId: invBodega.id
    }
  });

  const secureHash = 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4';

  const quote = await prisma.quotation.create({
    data: {
      clientId: client.id,
      nombre_evento: 'Lanzamiento Ferrari SF90',
      tipo_evento: 'Lanzamiento de Marca',
      ubicacion: 'Club El Nogal, Bogotá',
      montaje_inicio: new Date('2026-06-01T08:00:00Z'),
      montaje_fin: new Date('2026-06-01T18:00:00Z'),
      evento_inicio: new Date('2026-06-02T19:00:00Z'),
      evento_fin: new Date('2026-06-03T02:00:00Z'),
      desmontaje_inicio: new Date('2026-06-03T08:00:00Z'),
      desmontaje_fin: new Date('2026-06-03T14:00:00Z'),
      estado: 'ENVIADA',
      secureHash: secureHash,
      items: {
        create: {
          inventoryId: invComm.id,
          cantidad: 10,
          dias: 2,
          precio_pactado: 250000,
          precio_dia_adicional: 150000,
          clase_asignada: 'A'
        }
      },
      services: {
        create: {
          tipo: 'Personal',
          descripcion: 'Técnicos Visuales Certificados',
          cantidad: 2,
          dias: 3,
          precio_pactado: 120000,
          precio_dia_adicional: 80000
        }
      }
    }
  });

  console.log(`Hash generado: ${secureHash}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
