import { describe, it, expect } from 'vitest';
import {
  createTicket,
  deleteTicket,
  deleteAllTickets,
  updateTicketFields,
  getAllTickets,
} from '@/lib/db';

describe('Backend DB: Borrado con Backup y Corrección de Datos (Dev)', () => {
  async function makeTicket(buyerName: string, ref: string) {
    return createTicket({
      buyer_name: buyerName,
      buyer_cedula: 'V-10.000.001',
      buyer_phone: '0414-0000001',
      payment_ref: ref,
      quantity: 1,
      total_amount_usd: 15,
      total_amount_bs: 1200,
      ticket_type: 'general',
      ticket_tier_name: 'Entrada General',
      rejection_reason: null,
      approved_at: null,
      used_at: null,
    });
  }

  it('deleteTicket elimina un ticket y genera backup', async () => {
    const t = await makeTicket('Persona Uno', '111111');
    expect(await getAllTickets()).toHaveLength(3); // 2 semilla + 1 creada

    const res = await deleteTicket(t.id);
    expect(res.success).toBe(true);
    expect(res.backupPath).toBeDefined();
    expect(res.backupPath).toContain('backups');

    const tickets = await getAllTickets();
    expect(tickets).toHaveLength(2);
    expect(tickets.some((x) => x.id === t.id)).toBe(false);
  });

  it('deleteTicket retorna success=false si el ticket no existe', async () => {
    const res = await deleteTicket('no-existe');
    expect(res.success).toBe(false);
    expect(res.backupPath).toBeUndefined();
  });

  it('deleteAllTickets vacía la tabla y genera backup del snapshot', async () => {
    await makeTicket('Persona Dos', '222222');
    const before = await getAllTickets();
    expect(before.length).toBeGreaterThan(0);

    const res = await deleteAllTickets();
    expect(res.count).toBe(before.length);
    expect(res.backupPath).toBeDefined();
    expect(await getAllTickets()).toHaveLength(0);
  });

  it('updateTicketFields corrige datos y timestamps sin tocar id/token', async () => {
    const t = await makeTicket('Nombre Errado', '333333');
    const updated = await updateTicketFields(t.id, {
      buyer_name: 'Nombre Corregido',
      payment_ref: '333334',
      quantity: 3,
    });

    expect(updated).not.toBeNull();
    expect(updated?.id).toBe(t.id);
    expect(updated?.token).toBe(t.token);
    expect(updated?.buyer_name).toBe('Nombre Corregido');
    expect(updated?.payment_ref).toBe('333334');
    expect(updated?.quantity).toBe(3);
    expect(updated && updated.updated_at >= t.updated_at).toBe(true);

    const fetched = (await getAllTickets()).find((x) => x.id === t.id);
    expect(fetched?.buyer_name).toBe('Nombre Corregido');
  });

  it('updateTicketFields retorna null para un id inexistente', async () => {
    const res = await updateTicketFields('no-existe', { buyer_name: 'X' });
    expect(res).toBeNull();
  });
});