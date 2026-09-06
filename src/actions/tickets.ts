'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import { getActiveEvent } from '@/config/event';
import {
  createTicket,
  approveTicket,
  rejectTicket,
  validateAndUseTicket,
  getTicketById,
  deleteTicket,
  deleteAllTickets,
} from '@/lib/db';
import { sanitizeReference, formatCedula } from '@/lib/utils';
import { TicketStatus } from '@/lib/types';
import { checkDevPassword } from '@/lib/dev';
import { limitKey } from '@/lib/rateLimit';
import { headers } from 'next/headers';

async function clientIp(): Promise<string> {
  // Best-effort: leer IP remota. En server actions hay request disponible.
  try {
    const h = await headers();
    return h.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function createTicketAction(formData: FormData): Promise<{
  success: boolean;
  ticketId?: string;
  error?: string;
}> {
  try {
    const ip = await clientIp();
    if (!limitKey(`create-ticket:${ip}`, Number(process.env.RATE_LIMIT_TICKET_MAX || 5), 60000)) {
      return { success: false, error: 'Demasiados intentos. Espera unos segundos e intenta de nuevo.' };
    }

    const buyerName = (formData.get('buyerName') as string || '').trim();
    const buyerCedula = formatCedula((formData.get('buyerCedula') as string || '').trim());
    const buyerPhone = (formData.get('buyerPhone') as string || '').trim();
    const paymentRef = sanitizeReference((formData.get('paymentRef') as string || '').trim());
    const quantity = parseInt((formData.get('quantity') as string || '1'), 10);
    const ticketTypeId = (formData.get('ticketTypeId') as string || 'general').trim();

    if (!buyerName || buyerName.length < 3) {
      return { success: false, error: 'Por favor ingresa tu nombre completo (mínimo 3 caracteres)' };
    }
    if (!buyerCedula || buyerCedula.length < 5) {
      return { success: false, error: 'Por favor ingresa un número de cédula válido' };
    }
    if (!buyerPhone || buyerPhone.length < 8) {
      return { success: false, error: 'Por favor ingresa un número de teléfono / WhatsApp válido' };
    }
    if (!paymentRef || paymentRef.length < 4) {
      return { success: false, error: 'Por favor ingresa el número de referencia del Pago Móvil (mínimo 4 dígitos)' };
    }
    if (isNaN(quantity) || quantity < 1 || quantity > 20) {
      return { success: false, error: 'La cantidad de entradas debe ser entre 1 y 20' };
    }

    const event = getActiveEvent();
    let priceUSD = event.singleTicket.priceUSD;
    let priceBs = event.singleTicket.priceBs;
    let tierName = event.singleTicket.name;
    let tierId = 'general';

    if (event.hasMultipleTiers && event.tiers?.length) {
      const selectedTier = event.tiers.find((t) => t.id === ticketTypeId) || event.tiers[0];
      priceUSD = selectedTier.priceUSD;
      priceBs = selectedTier.priceBs;
      tierName = selectedTier.name;
      tierId = selectedTier.id;
    }

    const totalUSD = priceUSD * quantity;
    const totalBs = priceBs * quantity;

    const newTicket = await createTicket({
      buyer_name: buyerName,
      buyer_cedula: buyerCedula,
      buyer_phone: buyerPhone,
      payment_ref: paymentRef,
      quantity,
      total_amount_usd: totalUSD,
      total_amount_bs: totalBs,
      ticket_type: tierId,
      ticket_tier_name: tierName,
      rejection_reason: null,
      approved_at: null,
      used_at: null,
    });

    return {
      success: true,
      ticketId: newTicket.id,
    };
  } catch (error) {
    console.error('Error creando entrada:', error);
    return {
      success: false,
      error: 'Ocurrió un error inesperado al procesar tu solicitud. Por favor intenta de nuevo.',
    };
  }
}

export async function adminApproveTicketAction(ticketId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado. Inicia sesión como administrador.' };
  }

  const updated = await approveTicket(ticketId);
  if (!updated) {
    return { success: false, error: 'No se encontró la entrada o no se pudo actualizar.' };
  }

  revalidatePath('/admin');
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

export async function adminRejectTicketAction(
  ticketId: string,
  reason: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado. Inicia sesión como administrador.' };
  }

  const updated = await rejectTicket(ticketId, reason || 'Referencia bancaria no conciliada');
  if (!updated) {
    return { success: false, error: 'No se encontró la entrada o no se pudo actualizar.' };
  }

  revalidatePath('/admin');
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

export async function validateTokenAction(token: string): Promise<{
  success: boolean;
  status: TicketStatus | 'NOT_FOUND';
  message: string;
  ticket?: {
    id: string;
    token: string;
    buyerName: string;
    buyerCedula: string;
    buyerPhone: string;
    quantity: number;
    ticketType: string;
    ticketTierName?: string;
    status: TicketStatus;
    usedAt?: string | null;
    approvedAt?: string | null;
  };
}> {
  try {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return {
        success: false,
        status: 'NOT_FOUND',
        message: 'Código de token vacío.',
      };
    }

    const result = await validateAndUseTicket(cleanToken);

    if (result.ticket) {
      revalidatePath(`/ticket/${result.ticket.id}`);
      revalidatePath('/admin');

      return {
        success: result.success,
        status: result.status,
        message: result.message,
        ticket: {
          id: result.ticket.id,
          token: result.ticket.token,
          buyerName: result.ticket.buyer_name,
          buyerCedula: result.ticket.buyer_cedula,
          buyerPhone: result.ticket.buyer_phone,
          quantity: result.ticket.quantity,
          ticketType: result.ticket.ticket_type,
          ticketTierName: result.ticket.ticket_tier_name,
          status: result.ticket.status,
          usedAt: result.ticket.used_at,
          approvedAt: result.ticket.approved_at,
        },
      };
    }

    return {
      success: false,
      status: result.status,
      message: result.message,
    };
  } catch (error) {
    console.error('Error validando token:', error);
    return {
      success: false,
      status: 'NOT_FOUND',
      message: 'Error al procesar la validación en el servidor.',
    };
  }
}

// ---------------------------------------------------------------------------
// DEV-ONLY: Borrado de tickets (protegido por DEV_PURGE_PASSWORD)
// ---------------------------------------------------------------------------

export async function deleteTicketAction(
  ticketId: string,
  devPassword: string
): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado.' };
  }
  if (!checkDevPassword(devPassword)) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }

  const result = await deleteTicket(ticketId);
  if (!result.success) {
    return { success: false, error: 'Ticket no encontrado o ya fue eliminado.' };
  }

  revalidatePath('/admin');
  return { success: true, backupPath: result.backupPath };
}

export async function deleteAllTicketsAction(
  devPassword: string
): Promise<{ success: boolean; deleted?: number; backupPath?: string; error?: string }> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado.' };
  }
  if (!checkDevPassword(devPassword)) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }

  const result = await deleteAllTickets();
  revalidatePath('/admin');
  return { success: true, deleted: result.count, backupPath: result.backupPath };
}
