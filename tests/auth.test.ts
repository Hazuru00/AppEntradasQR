import { describe, it, expect } from 'vitest';
import { generateSessionToken } from '@/lib/auth';

describe('Backend Auth: Generación de Tokens de Sesión', () => {
  it('debe generar tokens consistentes para la misma contraseña', () => {
    const token1 = generateSessionToken('admin');
    const token2 = generateSessionToken('admin');
    expect(token1).toBe(token2);
    expect(token1.startsWith('admin_auth_')).toBe(true);
    expect(token1.endsWith('_valid')).toBe(true);
  });

  it('debe generar tokens diferentes para contraseñas diferentes', () => {
    const token1 = generateSessionToken('admin');
    const token2 = generateSessionToken('wrongpassword');
    expect(token1).not.toBe(token2);
  });
});
