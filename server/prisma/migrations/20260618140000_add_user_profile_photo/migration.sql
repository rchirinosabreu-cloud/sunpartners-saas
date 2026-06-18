-- Add the optional user profile photo expected by the generated Prisma client.
-- IF NOT EXISTS keeps deployment safe if the column was added manually.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "fotoPerfilUrl" TEXT;
