// src/lib/auth.ts
import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Token seguro simple generado a partir de la contraseña
function generateSessionToken(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    hash = (hash << 5) - hash + pass.charCodeAt(i);
    hash |= 0;
  }
  return `admin_auth_${Math.abs(hash).toString(16)}_valid`;
}

export async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!session?.value) return false;
  return session.value === generateSessionToken(ADMIN_PASSWORD);
}

export { ADMIN_COOKIE_NAME, ADMIN_PASSWORD, generateSessionToken };
