const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sunpartners.com';
  const password = 'admin_password_123';
  const nombre = 'Administrador Sunpartners';
  const role = 'ADMIN';

  console.log(`Verificando usuario: ${email}...`);

  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('El usuario ya existe en la base de datos.');
    return;
  }

  console.log('Generando hash de contraseña...');
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log('Insertando usuario administrador...');
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nombre,
      role
    }
  });

  console.log('Usuario creado exitosamente:', user.id);
}

main()
  .catch((e) => {
    console.error('Error al insertar el usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
