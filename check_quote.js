const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quote = await prisma.quotation.findUnique({
    where: { secureHash: 'ed9a0b7120068f52b348e00579c5665fd5a653245f2dd13a1e13f7ab0baf06f4' },
    include: { client: true }
  });
  console.log(JSON.stringify(quote, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
