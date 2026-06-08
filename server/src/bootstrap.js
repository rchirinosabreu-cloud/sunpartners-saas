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
          data: {
            username: 'admin',
            password: hashedPassword,
            department: 'DIRECCION_COMERCIAL'
          }
        });
        console.log(`[Sunpartners] Admin updated successfully.`);
        return;
    }

    await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        nombre: 'Administrador Sunpartners',
        role: 'ADMIN',
        department: 'DIRECCION_COMERCIAL'
      },
    });
    console.log(`[Sunpartners] Admin creado con nuevo esquema: ${adminEmail}`);

    // Clean up "SIN EMPRESA" clients to avoid validation noise
    const cleanResult = await prisma.client.updateMany({
      where: {
        OR: [
          { razon_social: { equals: 'SIN EMPRESA', mode: 'insensitive' } },
          { razon_social: { equals: 'Sin Empresa', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      data: {
        deletedAt: new Date(),
        deletedJustification: 'Limpieza de registros de migración fallida'
      }
    });
    if (cleanResult.count > 0) {
      console.log(`[Sunpartners] Se eliminaron ${cleanResult.count} registros legacy del directorio.`);
    }

    // Migration of legacy RejectionType values
    const legacyRejections = await prisma.quotation.count({
      where: {
        rejectionType: { in: ['PRECIO', 'CAMBIO_PLAN', 'OTRO'] }
      }
    });

    if (legacyRejections > 0) {
      console.log(`[Sunpartners] Migrando ${legacyRejections} motivos de rechazo antiguos...`);
      await prisma.quotation.updateMany({
        where: { rejectionType: { in: ['PRECIO', 'OTRO'] } },
        data: { rejectionType: 'OTROS' }
      });
      await prisma.quotation.updateMany({
        where: { rejectionType: 'CAMBIO_PLAN' },
        data: { rejectionType: 'PRODUCTOS' }
      });
      console.log(`[Sunpartners] Migración de motivos completada.`);
    }

    // Default Motivational Quote
    const quoteKey = 'global_motivational_quote';
    const existingQuote = await prisma.globalSetting.findUnique({ where: { key: quoteKey } });
    if (!existingQuote) {
      await prisma.globalSetting.create({
        data: {
          key: quoteKey,
          value: '¡A darle con toda!'
        }
      });
      console.log(`[Sunpartners] Frase motivacional por defecto creada.`);
    }

  } catch (err) {
    console.error(`[Sunpartners] Error en bootstrap: ${err.message}`);
  }
};

module.exports = bootstrapAdmin;
