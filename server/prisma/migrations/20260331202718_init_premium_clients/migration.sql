-- AlterTable
ALTER TABLE "Client" RENAME COLUMN "nombre" TO "razon_social";
ALTER TABLE "Client" RENAME COLUMN "identificacion" TO "nit_id";
ALTER TABLE "Client" RENAME COLUMN "cargo" TO "responsable";
ALTER TABLE "Client" ADD COLUMN "observaciones" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_nit_id_key" ON "Client"("nit_id");
