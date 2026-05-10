-- Migration: Migrate FINALIZADA to APROBADA
UPDATE "Quotation" SET "estado" = 'APROBADA' WHERE "estado" = 'FINALIZADA';
