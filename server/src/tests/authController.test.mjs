import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const findFirst = vi.fn();
const compare = vi.fn();
const require = createRequire(import.meta.url);

require.cache[require.resolve('../db')] = {
  exports: {
    user: {
      findFirst,
    },
  },
};

require.cache[require.resolve('bcrypt')] = { exports: { compare } };
require.cache[require.resolve('jsonwebtoken')] = {
  exports: { sign: vi.fn(() => 'signed-token') },
};

const { login } = require('../controllers/authController');

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
  };

  response.status.mockReturnValue(response);
  return response;
};

describe('authController.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('only selects the fields required to authenticate a user', async () => {
    findFirst.mockResolvedValue(null);
    const response = createResponse();

    await login(
      { body: { identifier: 'usuario', password: 'incorrecta' } },
      response,
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: 'usuario' },
          { email: 'usuario' },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        password: true,
        nombre: true,
        role: true,
      },
    });
  });

  it('returns 401 instead of 500 when the password is incorrect', async () => {
    findFirst.mockResolvedValue({
      id: 'user-id',
      username: 'usuario',
      email: 'usuario@example.com',
      password: 'hashed-password',
      nombre: 'Usuario',
      role: 'EDITOR',
    });
    compare.mockResolvedValue(false);
    const response = createResponse();

    await login(
      { body: { identifier: 'usuario', password: 'incorrecta' } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.json).toHaveBeenCalledWith({ message: 'Credenciales inválidas' });
    expect(response.status).not.toHaveBeenCalledWith(500);
  });
});
