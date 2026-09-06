// src/lib/dev.ts
// Credencial y validación para operaciones de desarrollo (consola dev / borrado).

const DEV_PURGE_PASSWORD = process.env.DEV_PURGE_PASSWORD || '';

export function checkDevPassword(password: string): boolean {
  if (!DEV_PURGE_PASSWORD || DEV_PURGE_PASSWORD.trim() === '') return false;
  return password === DEV_PURGE_PASSWORD;
}

export { DEV_PURGE_PASSWORD };