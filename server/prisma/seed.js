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
    // Dummy data fallback
    const dummyData = [
      {
        NOMBRE: 'CABLE ENCARTONADO 3X10',
        CLASE: 'A-B',
        BODEGA: 'PRINCIPAL',
        'SECCIÓN': 'CUARTO_1',
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
      const existenciaTotal = parseInt(row['EXISTENCIA TOTAL']) || 0;
      let claseA = 0;
      let claseB = 0;
      let claseC = 0;

      const label = (row['CLASE'] || '').toUpperCase();

      if (label === 'A') {
        claseA = existenciaTotal;
      } else if (label === 'B') {
        claseB = existenciaTotal;
      } else if (label === 'C') {
        claseC = existenciaTotal;
      } else if (label === 'A-B') {
        claseA = Math.ceil(existenciaTotal / 2);
        claseB = existenciaTotal - claseA;
      } else if (label === 'B-C') {
        claseB = Math.ceil(existenciaTotal / 2);
        claseC = existenciaTotal - claseB;
      } else if (label === 'A-C') {
        claseA = Math.ceil(existenciaTotal / 2);
        claseC = existenciaTotal - claseA;
      } else {
        // Default to A if unknown
        claseA = existenciaTotal;
      }

      await prisma.inventoryItem.create({
        data: {
          nombre: row['NOMBRE'] || 'Sin nombre',
          claseA,
          claseB,
          claseC,
          bodega: row['BODEGA'] || 'PRINCIPAL',
          seccion: row['SECCIÓN'] || 'SALA',
          vlrUnitario: parseFloat(row['VLR. UNITARIO']) || 0,
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
