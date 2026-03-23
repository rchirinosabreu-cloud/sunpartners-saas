const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../../inventario.xlsx');

  let workbook;
  try {
    workbook = xlsx.readFile(filePath);
  } catch (error) {
    console.error(`Error reading excel file at ${filePath}. Falling back to default data for development...`);
    // Prepare dummy data if file is missing in sandbox
    const dummyData = [
      {
        NOMBRE: 'CABLE ENCARTONADO 3X10',
        CLASE: 'A',
        BODEGA: 'ALMACEN PRICIPAL',
        'SECCIÓN': 'CABLES',
        ESTADO: '24/6',
        'EXISTENCIA TOTAL': 30,
        'VLR. UNITARIO': 15000,
        OBSERVACIONES: 'Importado de prueba'
      }
    ];
    await seedData(dummyData);
    return;
  }

  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  console.log(`Found ${data.length} items to import.`);
  await seedData(data);
}

async function seedData(data) {
  // Clear existing inventory
  await prisma.inventoryItem.deleteMany({});
  console.log('Cleared existing inventory items.');

  for (const row of data) {
    try {
      const claseValue = row['CLASE'] === 'CLASE_A' || row['CLASE'] === 'A' ? 'CLASE_A' : 'CLASE_B';
      const existenciaTotal = parseInt(row['EXISTENCIA TOTAL']) || 0;

      let disponibles = existenciaTotal;
      let enReparacion = 0;

      if (row['ESTADO'] && typeof row['ESTADO'] === 'string' && row['ESTADO'].includes('/')) {
        const parts = row['ESTADO'].split('/');
        disponibles = parseInt(parts[0]) || 0;
        enReparacion = parseInt(parts[1]) || 0;
      } else if (typeof row['ESTADO'] === 'number') {
        disponibles = row['ESTADO'];
        enReparacion = existenciaTotal - disponibles;
      }

      await prisma.inventoryItem.create({
        data: {
          nombre: row['NOMBRE'] || 'Sin nombre',
          clase: claseValue,
          bodega: row['BODEGA'] || 'Principal',
          seccion: row['SECCIÓN'] || 'N/A',
          existenciaTotal: existenciaTotal,
          vlrUnitario: parseFloat(row['VLR. UNITARIO']) || 0,
          disponibles: disponibles,
          enReparacion: enReparacion,
          observaciones: row['OBSERVACIONES'] || ''
        }
      });
    } catch (err) {
      console.error(`Error importing row: ${JSON.stringify(row)}. Error: ${err.message}`);
    }
  }
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
