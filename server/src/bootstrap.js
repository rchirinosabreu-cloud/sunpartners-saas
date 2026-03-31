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
  const FIXED_PASSWORD = "SunBTL2026_Premium";
  try {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    const hashedPassword = await bcrypt.hash(FIXED_PASSWORD, 10);

    if (existing) {
        // Force update the password to the new one
        await prisma.user.update({
          where: { email: adminEmail },
          data: { password: hashedPassword }
        });
        console.log(`[Sunpartners] Admin password updated successfully.`);
        return;
    }

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

    // Clean up "SIN EMPRESA" clients to avoid validation noise
    const cleanResult = await prisma.client.deleteMany({
      where: {
        OR: [
          { razon_social: { equals: 'SIN EMPRESA', mode: 'insensitive' } },
          { razon_social: { equals: 'Sin Empresa', mode: 'insensitive' } }
        ]
      }
    });
    if (cleanResult.count > 0) {
      console.log(`[Sunpartners] Se eliminaron ${cleanResult.count} registros legacy del directorio.`);
    }

  } catch (err) {
    console.error(`[Sunpartners] Error en bootstrap: ${err.message}`);
  }
};

module.exports = bootstrapAdmin;
