// src/lib/db.ts
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from './supabase';
import { Ticket, TicketStatus, DashboardStats } from './types';

// Directorio de almacenamiento local como fallback (cuando Supabase no está configurado)
// LOCAL_DATA_DIR permite aislar datos en tests (apunta a un directorio temporal).
const LOCAL_DATA_DIR = process.env.LOCAL_DATA_DIR
  ? path.resolve(process.env.LOCAL_DATA_DIR)
  : path.join(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'tickets.json');
const LOCAL_BACKUP_DIR = path.join(LOCAL_DATA_DIR, 'backups');

function ensureLocalDataDir() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
    fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    // Sembrar con algunos datos de muestra iniciales para pruebas
    const initialTickets: Ticket[] = [
      {
        id: '11111111-2222-3333-4444-555555555555',
        token: 'sample-y2k-approved-token-001',
        buyer_name: 'Alejandro Morales',
        buyer_cedula: 'V-24.555.666',
        buyer_phone: '0414-1112233',
        payment_ref: '984512',
        quantity: 2,
        total_amount_usd: 30,
        total_amount_bs: 2265,
        ticket_type: 'general',
        ticket_tier_name: 'Entrada General',
        status: 'APROBADO',
        rejection_reason: null,
        approved_at: new Date(Date.now() - 3600000).toISOString(),
        used_at: null,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        token: 'sample-y2k-pending-token-002',
        buyer_name: 'Valeria Gómez',
        buyer_cedula: 'V-27.123.456',
        buyer_phone: '0424-9988776',
        payment_ref: '348712',
        quantity: 1,
        total_amount_usd: 25,
        total_amount_bs: 1887.50,
        ticket_type: 'vip_lounge',
        ticket_tier_name: 'Pase VIP Britney & Justin',
        status: 'PENDIENTE',
        rejection_reason: null,
        approved_at: null,
        used_at: null,
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      }
    ];
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(initialTickets, null, 2), 'utf-8');
  }
}

function readLocalTickets(): Ticket[] {
  ensureLocalDataDir();
  try {
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw) as Ticket[];
  } catch (error) {
    console.error('Error leyendo tickets locales:', error);
    return [];
  }
}

function writeLocalTickets(tickets: Ticket[]): void {
  ensureLocalDataDir();
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(tickets, null, 2), 'utf-8');
}

// ----------------------------------------------------------------------
// OPERACIONES DE BASE DE DATOS (CON SUPABASE O FALLBACK LOCAL)
// ----------------------------------------------------------------------

export async function getAllTickets(): Promise<Ticket[]> {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo tickets de Supabase, recurriendo a local:', error);
      return readLocalTickets();
    }
    return (data || []) as Ticket[];
  }

  return readLocalTickets();
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error consultando ticket por id en Supabase:', error);
      const local = readLocalTickets();
      return local.find((t) => t.id === id) || null;
    }
    return data as Ticket | null;
  }

  const local = readLocalTickets();
  return local.find((t) => t.id === id) || null;
}

export async function getTicketByToken(token: string): Promise<Ticket | null> {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      console.error('Error consultando ticket por token en Supabase:', error);
      const local = readLocalTickets();
      return local.find((t) => t.token === token) || null;
    }
    return data as Ticket | null;
  }

  const local = readLocalTickets();
  return local.find((t) => t.token === token) || null;
}

export async function createTicket(ticketData: Omit<Ticket, 'id' | 'token' | 'status' | 'created_at' | 'updated_at'>): Promise<Ticket> {
  const newId = crypto.randomUUID();
  const newToken = crypto.randomUUID();
  const now = new Date().toISOString();

  const newTicket: Ticket = {
    ...ticketData,
    id: newId,
    token: newToken,
    status: 'PENDIENTE',
    rejection_reason: null,
    approved_at: null,
    used_at: null,
    created_at: now,
    updated_at: now,
  };

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        id: newTicket.id,
        token: newTicket.token,
        buyer_name: newTicket.buyer_name,
        buyer_cedula: newTicket.buyer_cedula,
        buyer_phone: newTicket.buyer_phone,
        payment_ref: newTicket.payment_ref,
        quantity: newTicket.quantity,
        total_amount_usd: newTicket.total_amount_usd,
        total_amount_bs: newTicket.total_amount_bs,
        ticket_type: newTicket.ticket_type,
        ticket_tier_name: newTicket.ticket_tier_name,
        status: newTicket.status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error insertando en Supabase, guardando localmente:', error);
      const local = readLocalTickets();
      local.unshift(newTicket);
      writeLocalTickets(local);
      return newTicket;
    }

    return data as Ticket;
  }

  const local = readLocalTickets();
  local.unshift(newTicket);
  writeLocalTickets(local);
  return newTicket;
}

export async function updateTicketStatus(
  id: string,
  status: TicketStatus,
  extra?: { rejection_reason?: string | null; approved_at?: string | null; used_at?: string | null }
): Promise<Ticket | null> {
  const now = new Date().toISOString();

  if (supabaseAdmin) {
    const updatePayload: Record<string, unknown> = {
      status,
      updated_at: now,
    };
    if (extra?.rejection_reason !== undefined) updatePayload.rejection_reason = extra.rejection_reason;
    if (extra?.approved_at !== undefined) updatePayload.approved_at = extra.approved_at;
    if (extra?.used_at !== undefined) updatePayload.used_at = extra.used_at;

    const { data, error } = await supabaseAdmin
      .from('tickets')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as Ticket;
    }
  }

  const local = readLocalTickets();
  const index = local.findIndex((t) => t.id === id);
  if (index === -1) return null;

  local[index] = {
    ...local[index],
    status,
    updated_at: now,
    ...(extra?.rejection_reason !== undefined ? { rejection_reason: extra.rejection_reason } : {}),
    ...(extra?.approved_at !== undefined ? { approved_at: extra.approved_at } : {}),
    ...(extra?.used_at !== undefined ? { used_at: extra.used_at } : {}),
  };

  writeLocalTickets(local);
  return local[index];
}

export async function approveTicket(id: string): Promise<Ticket | null> {
  return updateTicketStatus(id, 'APROBADO', {
    approved_at: new Date().toISOString(),
    rejection_reason: null,
  });
}

export async function rejectTicket(id: string, reason: string): Promise<Ticket | null> {
  return updateTicketStatus(id, 'RECHAZADO', {
    rejection_reason: reason,
  });
}

// Actualiza campos arbitrarios de un ticket (usado por la consola dev)
export async function updateTicketFields(
  id: string,
  fields: Partial<Omit<Ticket, 'id' | 'token' | 'created_at' | 'updated_at'>>
): Promise<Ticket | null> {
  const now = new Date().toISOString();

  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .update({ ...fields, updated_at: now })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as Ticket;
    }
  }

  const local = readLocalTickets();
  const index = local.findIndex((t) => t.id === id);
  if (index === -1) return null;

  local[index] = {
    ...local[index],
    ...fields,
    updated_at: now,
  };

  writeLocalTickets(local);
  return local[index];
}

// Guarda un snapshot de tickets en data/backups/backup-<timestamp>.json
export function backupTickets(tickets: Ticket[]): string {
  ensureLocalDataDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(LOCAL_BACKUP_DIR, `backup-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2), 'utf-8');
  return filePath;
}

export async function validateAndUseTicket(token: string): Promise<{
  success: boolean;
  status: TicketStatus | 'NOT_FOUND';
  message: string;
  ticket?: Ticket;
}> {
  const ticket = await getTicketByToken(token);

  if (!ticket) {
    return {
      success: false,
      status: 'NOT_FOUND',
      message: 'Código QR no registrado en el sistema. Entrada no válida.',
    };
  }

  if (ticket.status === 'PENDIENTE') {
    return {
      success: false,
      status: 'PENDIENTE',
      message: 'Esta entrada aún tiene el pago PENDIENTE de verificación en taquilla.',
      ticket,
    };
  }

  if (ticket.status === 'RECHAZADO') {
    return {
      success: false,
      status: 'RECHAZADO',
      message: `Entrada RECHAZADA. Motivo: ${ticket.rejection_reason || 'Pago no conciliado'}`,
      ticket,
    };
  }

  if (ticket.status === 'USADO') {
    return {
      success: false,
      status: 'USADO',
      message: '¡ALERTA! Esta entrada YA FUE UTILIZADA previamente.',
      ticket,
    };
  }

  // Estado es APROBADO -> Marcar como USADO
  const usedAt = new Date().toISOString();
  const updatedTicket = await updateTicketStatus(ticket.id, 'USADO', { used_at: usedAt });

  return {
    success: true,
    status: 'APROBADO',
    message: 'ACCESO AUTORIZADO. ¡Bienvenido al evento!',
    ticket: updatedTicket || ticket,
  };
}

export async function deleteTicket(id: string): Promise<{ success: boolean; backupPath?: string }> {
  const target = await getTicketById(id);
  if (!target) return { success: false };

  if (supabaseAdmin) {
    const { error } = await supabaseAdmin.from('tickets').delete().eq('id', id);
    if (!error) {
      const backupPath = backupTickets([target]);
      return { success: true, backupPath };
    }
    console.error('Error borrando ticket en Supabase, intentando local:', error);
  }

  const local = readLocalTickets();
  const filtered = local.filter((t) => t.id !== id);
  if (filtered.length === local.length) return { success: false }; // No encontrado
  const backupPath = backupTickets([target]);
  writeLocalTickets(filtered);
  return { success: true, backupPath };
}

export async function deleteAllTickets(): Promise<{ count: number; backupPath?: string }> {
  const current = await getAllTickets();
  const count = current.length;

  if (count > 0) {
    const backupPath = backupTickets(current);
    if (supabaseAdmin) {
      await supabaseAdmin.from('tickets').delete().neq('id', ''); // Borrar todo
      return { count, backupPath };
    }
    writeLocalTickets([]);
    return { count, backupPath };
  }

  if (supabaseAdmin) {
    await supabaseAdmin.from('tickets').delete().neq('id', '');
  }
  writeLocalTickets([]);
  return { count: 0 };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const tickets = await getAllTickets();

  let pendingCount = 0;
  let approvedCount = 0;
  let usedCount = 0;
  let rejectedCount = 0;
  let totalTicketsSold = 0;
  let totalAmountUSD = 0;
  let totalAmountBs = 0;

  for (const t of tickets) {
    if (t.status === 'PENDIENTE') pendingCount++;
    if (t.status === 'APROBADO') approvedCount++;
    if (t.status === 'USADO') {
      usedCount++;
      approvedCount++; // Los usados fueron aprobados previamente
    }
    if (t.status === 'RECHAZADO') rejectedCount++;

    if (t.status === 'APROBADO' || t.status === 'USADO') {
      totalTicketsSold += t.quantity;
      totalAmountUSD += Number(t.total_amount_usd) || 0;
      totalAmountBs += Number(t.total_amount_bs) || 0;
    }
  }

  return {
    totalTicketsSold,
    pendingCount,
    approvedCount,
    usedCount,
    rejectedCount,
    totalAmountUSD,
    totalAmountBs,
  };
}
