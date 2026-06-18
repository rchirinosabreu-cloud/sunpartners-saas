const PROFILE_PHOTO_COLUMN_SQL =
  'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fotoPerfilUrl" TEXT;';

const ensureSchemaCompatibility = async (prisma) => {
  await prisma.$executeRawUnsafe(PROFILE_PHOTO_COLUMN_SQL);
  console.log('[Sunpartners] Database compatibility checks completed.');
};

module.exports = ensureSchemaCompatibility;
