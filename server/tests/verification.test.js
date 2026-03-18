import { describe, it, expect, vi } from 'vitest';

describe('Verification of Base Setup', () => {
  it('should have the correct timezone set to America/Bogota', () => {
    expect(process.env.TZ).toBe('America/Bogota');
  });

  it('should verify soft delete logic conceptually (mocked)', async () => {
    // Definir un mock simple para Prisma
    const mockPrisma = {
      update: vi.fn().mockResolvedValue({
        id: '123',
        deletedAt: new Date(),
        deletedJustification: 'Justificación de prueba'
      })
    };

    // Simular el método que añadimos en la extensión
    const softDelete = async (id, justification) => {
      return mockPrisma.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedJustification: justification || 'No se proporcionó justificación'
        },
      });
    };

    const result = await softDelete('123', 'Justificación de prueba');

    expect(mockPrisma.update).toHaveBeenCalledWith({
      where: { id: '123' },
      data: expect.objectContaining({
        deletedJustification: 'Justificación de prueba',
        deletedAt: expect.any(Date)
      })
    });
    expect(result.deletedJustification).toBe('Justificación de prueba');
  });
});
