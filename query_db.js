const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quotes = await prisma.quotation.findMany({
    select: { id: true, secureHash: true }
  });
  console.log(JSON.stringify(quotes));
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
