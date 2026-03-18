const bcrypt = require('bcrypt');
const prisma = require('./db');

const bootstrapAdmin = async () => {
  const adminEmail = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_USER o ADMIN_PASSWORD no configurados. Saltando creación de admin.');
    return;
  }

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nombre: 'Administrador Inicial',
        role: 'ADMIN',
      },
    });
    console.log(`[Sunpartners] Admin creado: ${adminEmail}`);
  } else {
    console.log(`[Sunpartners] Se han encontrado ${userCount} usuarios. Saltando creación de admin inicial.`);
  }
};

module.exports = bootstrapAdmin;
