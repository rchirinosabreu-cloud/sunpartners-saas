import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../src/db', () => {
  const mockClient = {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    softDelete: vi.fn(),
  };
  return {
    default: {
      client: mockClient,
      $extends: vi.fn().mockReturnThis()
    },
    client: mockClient
  };
});

// Import the mocked prisma and controller
import prisma from '../src/db';
import clientController from '../src/controllers/clientController';

describe('Client Controller - Duplicate Logic', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  it('checkDuplicates should exclude current client ID when provided', async () => {
    req.query = { nit_id: '900.123.456-1', excludeId: 'current-id-123' };

    prisma.client.findFirst.mockResolvedValue(null);

    await clientController.checkDuplicates(req, res);

    expect(prisma.client.findFirst).toHaveBeenCalled();
    const calls = prisma.client.findFirst.mock.calls;
    const nitCall = calls.find(c => c[0].where && c[0].where.nit_id === '900.123.456-1');

    expect(nitCall).toBeDefined();
    expect(nitCall[0].where.id).toEqual({ not: 'current-id-123' });
    expect(res.json).toHaveBeenCalledWith({ nitExists: false, emailExists: false });
  });

  it('update should exclude current client ID in duplicate checks', async () => {
    req.params = { id: 'client-id-456' };
    req.body = { nit_id: '900.888.777-1', email: 'test@test.com' };

    prisma.client.findFirst.mockResolvedValue(null);
    prisma.client.update.mockResolvedValue({ id: 'client-id-456', ...req.body });

    await clientController.update(req, res);

    expect(prisma.client.findFirst).toHaveBeenCalled();
    const calls = prisma.client.findFirst.mock.calls;
    const nitCall = calls.find(c => c[0].where && c[0].where.nit_id === '900.888.777-1');

    expect(nitCall).toBeDefined();
    expect(nitCall[0].where.id).toEqual({ not: 'client-id-456' });
    expect(prisma.client.update).toHaveBeenCalled();
  });
});
