const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@sunpartners.co' }
  });

  if (!admin) {
    console.error('Admin user not found');
    process.exit(1);
  }

  const isValid = await bcrypt.compare('SunBTL2026_Premium', admin.password);
  console.log(`Password is valid: ${isValid}`);
  process.exit(isValid ? 0 : 1);
}

main().catch(console.error);
