import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ensureSchemaCompatibility = require('../schemaCompatibility');

describe('ensureSchemaCompatibility', () => {
  it('adds the optional profile-photo column without requiring migration history', async () => {
    const executeRawUnsafe = vi.fn().mockResolvedValue(0);

    await ensureSchemaCompatibility({ $executeRawUnsafe: executeRawUnsafe });

    expect(executeRawUnsafe).toHaveBeenCalledWith(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fotoPerfilUrl" TEXT;',
    );
  });
});
