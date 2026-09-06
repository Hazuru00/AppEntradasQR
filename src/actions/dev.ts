'use server';

import { revalidatePath } from 'next/cache';
import { checkIsAdmin } from '@/lib/auth';
import { checkDevPassword } from '@/lib/dev';
import { getActiveEvent } from '@/config/event';
import {
  getTicketById,
  updateTicketFields,
  deleteTicket,
  deleteAllTickets,
} from '@/lib/db';
import { writeAuditLog } from '@/lib/audit';
import { sanitizeReference, formatCedula } from '@/lib/utils';
import { TicketStatus } from '@/lib/types';

type DevResult = { success: boolean; error?: string } & Record<string, unknown>;

// Valida sesión admin + contraseña dev. Retorna true o un error.
async function authorize(devPassword: string): Promise<DevResult | true> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado. Inicia sesión como administrador.' };
  }
  if (!checkDevPassword(devPassword)) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }
  return true;
}

// Desbloquea la consola dev si la credencial es correcta.
export async function devUnlockAction(devPassword: string): Promise<DevResult> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    return { success: false, error: 'Acceso no autorizado. Inicia sesión como administrador.' };
  }
  if (!checkDevPassword(devPassword)) {
    return { success: false, error: 'Contraseña de desarrollo incorrecta.' };
  }
  return { success: true };
}

const EMPTY_REASON = null;

export async function devUpdateTicketAction(
  ticketId: string,
  devPassword: string,
  data: Record<string, string>
): Promise<DevResult> {
  const auth = await authorize(devPassword);
  if (auth !== true) return auth;

  const ticket = await getTicketById(ticketId);
  if (!ticket) return { success: false, error: 'Ticket no encontrado.' };

  const event = getActiveEvent();
  const unitUSD = event.singleTicket.priceUSD;
  const unitBs = event.singleTicket.priceBs;

  const quantity = Math.max(1, Math.min(20, parseInt(data.quantity || String(ticket.quantity), 10)));
  const status = (data.status || ticket.status) as TicketStatus;
  const buyerName = (data.buyerName || ticket.buyer_name).trim();
  const buyerCedula = formatCedula((data.buyerCedula || ticket.buyer_cedula).trim());
  const buyerPhone = (data.buyerPhone || ticket.buyer_phone).trim();
  const paymentRef = sanitizeReference((data.paymentRef || ticket.payment_ref).trim());

  if (buyerName.length < 3) return { success: false, error: 'Nombre inválido (mínimo 3 caracteres).' };
  if (buyerCedula.length < 5) return { success: false, error: 'Cédula inválida.' };
  if (buyerPhone.length < 8) return { success: false, error: 'Teléfono inválido.' };
  if (paymentRef.length < 4) return { success: false, error: 'Referencia inválida.' };

  const totalUSD = unitUSD * quantity;
  const totalBs = unitBs * quantity;

  const updated = await updateTicketFields(ticketId, {
    buyer_name: buyerName,
    buyer_cedula: buyerCedula,
    buyer_phone: buyerPhone,
    payment_ref: paymentRef,
    quantity,
    total_amount_usd: totalUSD,
    total_amount_bs: totalBs,
    status,
  });

  if (!updated) return { success: false, error: 'No se pudo actualizar el ticket.' };

  writeAuditLog({
    action: 'UPDATE_TICKET',
    ticketId,
    details: JSON.stringify({ status }),
  });

  revalidatePath('/admin/dev');
  revalidatePath('/admin');
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

// Des-rechazar: vuelve un RECHAZADO a APROBADO (o a PENDIENTE).
export async function devUnrejectAction(
  ticketId: string,
  devPassword: string,
  toApproved: boolean
): Promise<DevResult> {
  const auth = await authorize(devPassword);
  if (auth !== true) return auth;

  const ticket = await getTicketById(ticketId);
  if (!ticket) return { success: false, error: 'Ticket no encontrado.' };

  const status: TicketStatus = toApproved ? 'APROBADO' : 'PENDIENTE';
  const updated = await updateTicketFields(ticketId, {
    status,
    rejection_reason: EMPTY_REASON,
    approved_at: toApproved ? new Date().toISOString() : null,
  });

  if (!updated) return { success: false, error: 'No se pudo actualizar el ticket.' };

  writeAuditLog({
    action: toApproved ? 'APPROVE' : 'UNREJECT',
    ticketId,
    details: toApproved ? 'des-rechazado a APROBADO' : 'des-rechazado a PENDIENTE',
  });

  revalidatePath('/admin/dev');
  revalidatePath('/admin');
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

// Revertir un ticket USADO de vuelta a APROBADO (ingreso marcado por error).
export async function devRevertUsedAction(
  ticketId: string,
  devPassword: string
): Promise<DevResult> {
  const auth = await authorize(devPassword);
  if (auth !== true) return auth;

  const ticket = await getTicketById(ticketId);
  if (!ticket) return { success: false, error: 'Ticket no encontrado.' };

  if (ticket.status !== 'USADO') {
    return { success: false, error: 'Solo se puede revertir un ticket en estado USADO.' };
  }

  const updated = await updateTicketFields(ticketId, {
    status: 'APROBADO',
    used_at: null,
    approved_at: ticket.approved_at || new Date().toISOString(),
    rejection_reason: ticket.rejection_reason,
  });

  if (!updated) return { success: false, error: 'No se pudo actualizar el ticket.' };

  writeAuditLog({ action: 'REVERT_USED', ticketId, details: 'USADO -> APROBADO' });

  revalidatePath('/admin/dev');
  revalidatePath('/admin');
  revalidatePath(`/ticket/${ticketId}`);
  return { success: true };
}

export async function devDeleteTicketAction(
  ticketId: string,
  devPassword: string
): Promise<DevResult> {
  const auth = await authorize(devPassword);
  if (auth !== true) return auth;

  const result = await deleteTicket(ticketId);
  if (!result.success) return { success: false, error: 'Ticket no encontrado o ya fue eliminado.' };

  writeAuditLog({ action: 'DELETE_TICKET', ticketId, details: result.backupPath || '' });

  revalidatePath('/admin/dev');
  revalidatePath('/admin');
  return { success: true, backupPath: result.backupPath };
}

export async function devClearTicketsAction(devPassword: string): Promise<DevResult> {
  const auth = await authorize(devPassword);
  if (auth !== true) return auth;

  const result = await deleteAllTickets();

  writeAuditLog({ action: 'CLEAR_TICKETS', details: `${result.count} tickets, backup: ${result.backupPath || 'none'}` });

  revalidatePath('/admin/dev');
  revalidatePath('/admin');
  return { success: true, deleted: result.count, backupPath: result.backupPath };
}