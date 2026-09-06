import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTicket,
  getTicketById,
  getTicketByToken,
  getAllTickets,
  approveTicket,
  rejectTicket,
  validateAndUseTicket,
  getDashboardStats,
} from '@/lib/db';

describe('Backend Database & Ticket Workflow: Ciclo de Vida Completo', () => {
  let createdTicketId: string;
  let createdToken: string;

  it('1. Debe crear una entrada en estado PENDIENTE con UUID y Token únicos', async () => {
    const ticket = await createTicket({
      buyer_name: 'Daniela Mendoza',
      buyer_cedula: 'V-28.999.111',
      buyer_phone: '0414-5556677',
      payment_ref: '445566',
      quantity: 5, // Caso de 5 entradas (Pase grupal)
      total_amount_usd: 15,
      total_amount_bs: 15000,
      ticket_type: 'general',
      ticket_tier_name: 'Entrada General',
      rejection_reason: null,
      approved_at: null,
      used_at: null,
    });

    expect(ticket.id).toBeDefined();
    expect(ticket.token).toBeDefined();
    expect(ticket.status).toBe('PENDIENTE');
    expect(ticket.quantity).toBe(5);
    expect(ticket.total_amount_usd).toBe(15);
    expect(ticket.total_amount_bs).toBe(15000);

    createdTicketId = ticket.id;
    createdToken = ticket.token;
  });

  it('2. Debe poder recuperar la entrada por su ID y por su Token único', async () => {
    const byId = await getTicketById(createdTicketId);
    expect(byId).not.toBeNull();
    expect(byId?.buyer_name).toBe('Daniela Mendoza');

    const byToken = await getTicketByToken(createdToken);
    expect(byToken).not.toBeNull();
    expect(byToken?.id).toBe(createdTicketId);
  });

  it('3. El escáner debe RECHAZAR el ingreso si la entrada sigue PENDIENTE', async () => {
    const scanResult = await validateAndUseTicket(createdToken);
    expect(scanResult.success).toBe(false);
    expect(scanResult.status).toBe('PENDIENTE');
    expect(scanResult.message).toContain('PENDIENTE');
  });

  it('4. El administrador debe poder APROBAR la entrada en taquilla', async () => {
    const approved = await approveTicket(createdTicketId);
    expect(approved).not.toBeNull();
    expect(approved?.status).toBe('APROBADO');
    expect(approved?.approved_at).toBeDefined();
  });

  it('5. Al escanear una entrada APROBADA, debe AUTORIZAR el acceso y cambiar su estado a USADO', async () => {
    const scanResult = await validateAndUseTicket(createdToken);

    expect(scanResult.success).toBe(true);
    expect(scanResult.status).toBe('APROBADO');
    expect(scanResult.ticket?.status).toBe('USADO');
    expect(scanResult.ticket?.used_at).toBeDefined();
    // Verifica que se respete la cantidad del pase grupal (5 personas)
    expect(scanResult.ticket?.quantity).toBe(5);
  });

  it('6. PROTECCIÓN ANTI-REINGRESO: Un segundo escaneo de la misma entrada debe DENEGAR el acceso', async () => {
    const secondScan = await validateAndUseTicket(createdToken);

    expect(secondScan.success).toBe(false);
    expect(secondScan.status).toBe('USADO');
    expect(secondScan.message).toContain('YA FUE UTILIZADA');
  });

  it('7. Debe manejar el RECHAZO de un pago con motivo explícito', async () => {
    const badTicket = await createTicket({
      buyer_name: 'Usuario Prueba Falsa',
      buyer_cedula: 'V-11.222.333',
      buyer_phone: '0412-0000000',
      payment_ref: '000000',
      quantity: 1,
      total_amount_usd: 3,
      total_amount_bs: 3000,
      ticket_type: 'general',
      ticket_tier_name: 'Entrada General',
      rejection_reason: null,
      approved_at: null,
      used_at: null,
    });

    const rejected = await rejectTicket(badTicket.id, 'Referencia no encontrada en banco');
    expect(rejected?.status).toBe('RECHAZADO');
    expect(rejected?.rejection_reason).toBe('Referencia no encontrada en banco');

    // Al escanear una entrada rechazada
    const scanRejected = await validateAndUseTicket(badTicket.token);
    expect(scanRejected.success).toBe(false);
    expect(scanRejected.status).toBe('RECHAZADO');
  });

  it('8. Al escanear un token inexistente debe retornar NOT_FOUND', async () => {
    const notFoundScan = await validateAndUseTicket('token-inexistente-12345');
    expect(notFoundScan.success).toBe(false);
    expect(notFoundScan.status).toBe('NOT_FOUND');
  });

  it('9. getDashboardStats debe calcular métricas coherentes', async () => {
    const stats = await getDashboardStats();
    expect(stats.totalTicketsSold).toBeGreaterThanOrEqual(5);
    expect(stats.usedCount).toBeGreaterThanOrEqual(1);
  });
});
