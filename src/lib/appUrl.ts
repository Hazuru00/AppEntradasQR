// src/lib/appUrl.ts
// Detecta el dominio de la app automáticamente desde los headers del request.
// Solo se puede llamar desde Server Components / Route Handlers.
// NEXT_PUBLIC_APP_URL, si está definido, tiene prioridad (override manual).

import { headers } from 'next/headers';

export async function getAppUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const host =
      h.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      h.get('host')?.trim();
    if (host) return `${proto || 'http'}://${host}`;
  } catch {
    // headers() solo está disponible en el servidor; si falla seguimos con los fallbacks.
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, '')}`;

  return 'http://localhost:3000';
}