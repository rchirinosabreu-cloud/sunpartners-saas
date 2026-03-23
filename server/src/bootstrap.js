const bcrypt = require('bcrypt');
const prisma = require('./db');

const bootstrapAdmin = async () => {
  const adminEmail = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_USER o ADMIN_PASSWORD no configurados. Saltando creación de admin.');
    return;
  }

  // Clean up all users to match new schema (Roles/Departments)
  try {
    const count = await prisma.user.count({ where: { deletedAt: null } });
    if (count > 0) {
      console.log(`[Sunpartners] Limpiando ${count} usuarios existentes...`);
      // We use the raw prisma client to avoid soft delete filter during deletion
      const rawPrisma = require('./db');
      await rawPrisma.user.deleteMany({});
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        nombre: 'Administrador Sunpartners',
        role: 'ADMIN',
        department: 'DIRECCION'
      },
    });
    console.log(`[Sunpartners] Admin creado con nuevo esquema: ${adminEmail}`);
  } catch (err) {
    console.error(`[Sunpartners] Error en bootstrap: ${err.message}`);
  }
};

module.exports = bootstrapAdmin;
