'use server';

import { cookies, headers } from 'next/headers';
import { ADMIN_COOKIE_NAME, ADMIN_PASSWORD, generateSessionToken } from '@/lib/auth';
import { limitKey } from '@/lib/rateLimit';

export async function loginAdminAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  let ip = 'unknown';
  try {
    ip = (await headers())?.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  } catch {}
  if (!limitKey(`login:${ip}`, 5, 60000)) {
    return { success: false, error: 'Demasiados intentos de acceso. Espera un momento antes de reintentar.' };
  }

  const password = formData.get('password') as string;

  if (!password) {
    return { success: false, error: 'Por favor ingresa la contraseña de administrador' };
  }

  if (password.trim() !== ADMIN_PASSWORD.trim()) {
    return { success: false, error: 'Contraseña de administrador incorrecta' };
  }

  const cookieStore = await cookies();
  const token = generateSessionToken(ADMIN_PASSWORD);

  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días de sesión
    path: '/',
  });

  return { success: true };
}

export async function logoutAdminAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return { success: true };
}
