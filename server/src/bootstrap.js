const bcrypt = require('bcrypt');
const prisma = require('./db');

const migrateMissingContacts = require('../scripts/populateMissingContacts');
const { isLegacyDataCleanupEnabled } = require('./utils/bootstrapPolicy');

const bootstrapAdmin = async () => {
  const legacyDataCleanupEnabled = isLegacyDataCleanupEnabled();

  // v70.0: Comprehensive raw SQL cleanup for DocumentType before any model queries
  try {
     // Ensure mandatory Enum values exist in native Postgres
     await prisma.$executeRaw`ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'CC';`;
     await prisma.$executeRaw`ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'OTHER';`;

     if (legacyDataCleanupEnabled) {
       // Sane data mapping (raw SQL to bypass Prisma model validation)
       await prisma.$executeRaw`UPDATE "Client" SET "documentType" = 'OTHER' WHERE "documentType" NOT IN ('NIT', 'CC', 'OTHER');`;
       console.log(`[Sunpartners] Legacy DocumentType sanitization completed.`);
     }
  } catch (e) {
     console.warn(`[Sunpartners] Warning: Could not run raw SQL cleanup: ${e.message}`);
  }

  if (legacyDataCleanupEnabled) {
    console.warn('[Sunpartners] RUN_LEGACY_DATA_CLEANUP=true: running opt-in legacy data repairs.');
    // v60.5: Explicit legacy migration for contacts
    await migrateMissingContacts();
  } else {
    console.log('[Sunpartners] Legacy data cleanup disabled (safe default).');
  }

  const adminEmail = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_USER o ADMIN_PASSWORD no configurados. Saltando creación de admin.');
    return;
  }

  // Clean up all users to match new schema (Roles/Departments)
  try {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (existing) {
        console.log(`[Sunpartners] Admin (${adminEmail}) already exists. Skipping bootstrap to prevent credential overwrite.`);
        return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
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

    if (legacyDataCleanupEnabled) {
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
