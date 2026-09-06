// src/lib/utils.ts

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatBs(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' Bs';
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('es-VE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function sanitizeReference(ref: string): string {
  // Remueve espacios y caracteres innecesarios
  return ref.trim().replace(/[^a-zA-Z0-9]/g, '');
}

export function formatCedula(cedula: string): string {
  const clean = cedula.trim().toUpperCase();
  if (clean.startsWith('V-') || clean.startsWith('E-') || clean.startsWith('J-')) {
    return clean;
  }
  return `V-${clean}`;
}
