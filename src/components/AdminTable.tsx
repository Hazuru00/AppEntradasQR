'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Monitor,
  Loader2,
  Trash2,
  Wrench,
  MessageCircle,
} from 'lucide-react';
import { Ticket, TicketStatus, DashboardStats } from '@/lib/types';
import { adminApproveTicketAction, adminRejectTicketAction } from '@/actions/tickets';
import { devDeleteTicketAction, devClearTicketsAction } from '@/actions/dev';
import { logoutAdminAction } from '@/actions/auth';
import { formatUSD, formatBs, formatDateTime } from '@/lib/utils';
import { EventConfig } from '@/config/event';

interface AdminTableProps {
  tickets: Ticket[];
  stats: DashboardStats;
  event: EventConfig;
}

// Convierte un teléfono venezolano local (ej. 0414-1112233) a formato wa.me (58xxxx)
function toWaNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return `58${digits.slice(1)}`;
  }
  if (digits.length < 7) return '';
  return digits.startsWith('58') ? digits : `58${digits}`;
}

function ticketWhatsappUrl(phone: string, ticket: Ticket, event: EventConfig): string {
  const num = toWaNumber(phone);
  if (!num || typeof window === 'undefined') return '';
  const message = encodeURIComponent(
    `Hola ${ticket.buyer_name}, aquí tienes el enlace de tu entrada para ${event.title}:\n${window.location.origin}/ticket/${ticket.id}`
  );
  return `https://wa.me/${num}?text=${message}`;
}

export function AdminTable({ tickets, stats, event }: AdminTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rejectingTicket, setRejectingTicket] = useState<Ticket | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Referencia bancaria no conciliada');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Borrado con contraseña dev
  const [deleteMode, setDeleteMode] = useState<{ kind: 'one'; ticket: Ticket } | { kind: 'all' } | null>(null);
  const [devPassword, setDevPassword] = useState('');
  const [deleteResult, setDeleteResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [isPending, startTransition] = useTransition();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleApprove = (ticketId: string) => {
    if (!confirm('¿Aprobar esta orden y activar el código QR para el comprador?')) return;

    setProcessingId(ticketId);
    startTransition(async () => {
      const res = await adminApproveTicketAction(ticketId);
      setProcessingId(null);
      if (!res.success) {
        alert(res.error || 'Error al aprobar la entrada');
      } else {
        router.refresh();
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectingTicket) return;

    setProcessingId(rejectingTicket.id);
    startTransition(async () => {
      const res = await adminRejectTicketAction(rejectingTicket.id, rejectionReason);
      setProcessingId(null);
      setRejectingTicket(null);
      if (!res.success) {
        alert(res.error || 'Error al rechazar');
      } else {
        router.refresh();
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
      router.push('/admin/login');
      router.refresh();
    });
  };

  const openDeleteModal = (mode: 'one' | 'all', ticket?: Ticket) => {
    setDevPassword('');
    setDeleteResult(null);
    setDeleteMode(mode === 'one' && ticket ? { kind: 'one', ticket } : { kind: 'all' });
  };

  const handleDeleteConfirm = () => {
    if (!deleteMode) return;

    setDeleting(true);
    setDeleteResult(null);

    const run = async () => {
      if (deleteMode.kind === 'one') {
        return devDeleteTicketAction(deleteMode.ticket.id, devPassword);
      }
      return devClearTicketsAction(devPassword);
    };

    run().then((res) => {
      setDeleting(false);
      if (!res.success) {
        setDeleteResult({ type: 'err', text: res.error || 'Error al borrar.' });
        return;
      }

      const backupPath = (res as { backupPath?: string }).backupPath;
      const count = (res as { count?: number }).count;
      const summary =
        deleteMode.kind === 'one'
          ? 'Ticket borrado.'
          : `Se borraron ${count ?? 'todos'} los tickets.`;

      setDeleteResult({
        type: 'ok',
        text: `${summary} Backup generado en ${backupPath ?? 'data/backups/'}`,
      });
      router.refresh();
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = statusFilter === 'ALL' || ticket.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      ticket.buyer_name.toLowerCase().includes(term) ||
      ticket.buyer_cedula.toLowerCase().includes(term) ||
      ticket.payment_ref.toLowerCase().includes(term) ||
      ticket.buyer_phone.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 font-mono">
      {/* VENTANA DEL PANEL ADMINISTRATIVO */}
      <div className="win98-box overflow-hidden">
        {/* Barra de Título Windows 98 */}
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span className="text-xs">ADMIN_CONSOLE.EXE - [Taquilla & Conciliación de Pagos]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        {/* Contenido de la Ventana */}
        <div className="p-5 sm:p-6 space-y-6 bg-[#1f2029]">
          {/* Barra superior de herramientas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#363847] pb-4">
            <div>
              <span className="text-xs text-[#8f92a8] uppercase block">
                CONTROL DE ACCESO &amp; AUDITORÍA BANCARIA
              </span>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                {event.title}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/scan"
                className="win98-btn win98-btn-primary text-xs py-2 px-3.5 flex items-center gap-2"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>ABRIR ESCÁNER QR</span>
              </Link>

              <button
                type="button"
                onClick={() => openDeleteModal('all')}
                className="win98-btn text-xs py-2 px-3 flex items-center gap-1.5 bg-[#8c2727] text-white border-t-[#c24646]"
                title="Borrar todos los tickets (con backup)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Borrar Todos</span>
              </button>

              <Link
                href="/admin/dev"
                className="win98-btn text-xs py-2 px-3 flex items-center gap-1.5 bg-[#262118] border-t-[#b5a642] text-[#b5a642]"
                title="Consola de desarrollo (corrección de datos)"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dev</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="win98-btn text-xs py-2 px-3 flex items-center gap-1.5"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>

          {/* TARJETAS KPI (ESTADÍSTICAS EN PANELES HUNDIDOS) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="win98-sunken p-3 space-y-1">
              <span className="text-[10px] text-[#8f92a8] uppercase block">PERSONAS TOTALES</span>
              <span className="text-xl font-bold text-white block">
                {stats.totalTicketsSold}
              </span>
              <span className="text-[10px] text-zinc-500 block">Entradas vendidas</span>
            </div>

            <div className="win98-sunken p-3 bg-[#262118] border border-[#b5a642] space-y-1">
              <span className="text-[10px] text-[#b5a642] uppercase font-bold block">POR VERIFICAR</span>
              <span className="text-xl font-bold text-[#b5a642] block">
                {stats.pendingCount}
              </span>
              <span className="text-[10px] text-[#8f92a8] block">Pagos en cola</span>
            </div>

            <div className="win98-sunken p-3 bg-[#122416] border border-[#6b8e23] space-y-1">
              <span className="text-[10px] text-[#86b53a] uppercase font-bold block">INGRESADOS</span>
              <span className="text-xl font-bold text-[#86b53a] block">
                {stats.usedCount}
              </span>
              <span className="text-[10px] text-[#8f92a8] block">Escaneados en puerta</span>
            </div>

            <div className="win98-sunken p-3 space-y-1">
              <span className="text-[10px] text-[#8f92a8] uppercase block">RECAUDACIÓN TOTAL</span>
              <span className="text-xl font-bold text-white block">
                {formatUSD(stats.totalAmountUSD)}
              </span>
              <span className="text-[10px] text-[#8f92a8] block">
                {formatBs(stats.totalAmountBs)}
              </span>
            </div>
          </div>

          {/* FILTROS Y BÚSQUEDA */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-stretch sm:items-center">
            {/* Pestañas estilo Windows 98 */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`win98-btn py-1 px-2.5 text-xs ${statusFilter === 'ALL' ? 'win98-btn-primary' : ''}`}
              >
                Todos ({tickets.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDIENTE')}
                className={`win98-btn py-1 px-2.5 text-xs ${statusFilter === 'PENDIENTE' ? 'bg-[#b5a642] text-black font-bold border-t-[#dfd06c]' : ''}`}
              >
                Pendientes ({stats.pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('APROBADO')}
                className={`win98-btn py-1 px-2.5 text-xs ${statusFilter === 'APROBADO' ? 'bg-[#6b8e23] text-white font-bold border-t-[#8eb738]' : ''}`}
              >
                Aprobados ({stats.approvedCount - stats.usedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('USADO')}
                className={`win98-btn py-1 px-2.5 text-xs ${statusFilter === 'USADO' ? 'win98-btn-primary' : ''}`}
              >
                Usados ({stats.usedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('RECHAZADO')}
                className={`win98-btn py-1 px-2.5 text-xs ${statusFilter === 'RECHAZADO' ? 'bg-[#8c2727] text-white font-bold' : ''}`}
              >
                Rechazados ({stats.rejectedCount})
              </button>
            </div>

            {/* Buscador */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#8f92a8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cédula, nombre o ref..."
                className="win98-sunken w-full pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          {/* TABLA DE AUDITORÍA */}
          <div className="win98-sunken overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e9e1d4]">
                <thead className="bg-[#181922] border-b border-[#363847] text-[#8f92a8] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Titular</th>
                    <th className="py-2.5 px-3">Cédula</th>
                    <th className="py-2.5 px-3">Ref. Pago Móvil</th>
                    <th className="py-2.5 px-3">Personas</th>
                    <th className="py-2.5 px-3">Monto</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262836]">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#8f92a8]">
                        [ No se encontraron registros con los filtros seleccionados ]
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const isProcessing = processingId === ticket.id;

                      return (
                        <tr key={ticket.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white block">{ticket.buyer_name}</span>
                            <span className="text-[10px] text-[#8f92a8]">{ticket.buyer_phone}</span>
                          </td>

                          <td className="py-2.5 px-3 text-white">
                            <button
                              type="button"
                              onClick={() => handleCopy(ticket.buyer_cedula, `ced_${ticket.id}`)}
                              className="hover:text-[#457b9d] flex items-center gap-1"
                            >
                              <span>{ticket.buyer_cedula}</span>
                              {copiedId === `ced_${ticket.id}` ? (
                                <Check className="w-3 h-3 text-[#6b8e23]" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-30 hover:opacity-100" />
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-[#121318] border border-[#2e3142] text-white font-bold">
                                {ticket.payment_ref}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(ticket.payment_ref, `ref_${ticket.id}`)}
                                className="p-0.5 text-[#8f92a8] hover:text-white"
                              >
                                {copiedId === `ref_${ticket.id}` ? (
                                  <Check className="w-3 h-3 text-[#6b8e23]" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-40 hover:opacity-100" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white">
                              {ticket.quantity} {ticket.quantity === 1 ? 'persona' : 'personas'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className="text-white font-bold block">{formatUSD(ticket.total_amount_usd)}</span>
                            <span className="text-[10px] text-[#8f92a8]">{formatBs(ticket.total_amount_bs)}</span>
                          </td>

                          <td className="py-2.5 px-3">
                            {ticket.status === 'PENDIENTE' && (
                              <span className="px-2 py-0.5 bg-[#262118] text-[#b5a642] border border-[#b5a642] text-[10px] font-bold">
                                PENDIENTE
                              </span>
                            )}
                            {ticket.status === 'APROBADO' && (
                              <span className="px-2 py-0.5 bg-[#122416] text-[#86b53a] border border-[#6b8e23] text-[10px] font-bold">
                                APROBADO
                              </span>
                            )}
                            {ticket.status === 'USADO' && (
                              <span className="px-2 py-0.5 bg-[#191a22] text-[#8f92a8] border border-[#3b3e52] text-[10px]">
                                USADO
                              </span>
                            )}
                            {ticket.status === 'RECHAZADO' && (
                              <span className="px-2 py-0.5 bg-[#2b1616] text-[#e05252] border border-[#8c2727] text-[10px]">
                                RECHAZADO
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Ver boleto */}
                              <Link
                                href={`/ticket/${ticket.id}`}
                                target="_blank"
                                className="win98-btn py-0.5 px-1.5 text-[10px]"
                                title="Ver boleto"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>

                              {/* Enviar enlace por WhatsApp */}
                              {ticket.buyer_phone && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = ticketWhatsappUrl(ticket.buyer_phone, ticket, event);
                                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                                  }}
                                  className="win98-btn py-0.5 px-1.5 text-[10px] bg-[#122416] border-t-[#6b8e23]"
                                  title="Enviar enlace por WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3 text-[#86b53a]" />
                                </button>
                              )}

                              {ticket.status === 'PENDIENTE' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleApprove(ticket.id)}
                                    className="win98-btn win98-btn-primary py-0.5 px-2 text-[10px] disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Aprobar'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setRejectingTicket(ticket);
                                      setRejectionReason('Referencia bancaria no encontrada');
                                    }}
                                    className="win98-btn py-0.5 px-2 text-[10px] text-[#e05252]"
                                  >
                                    Rechazar
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => openDeleteModal('one', ticket)}
                                    className="win98-btn py-0.5 px-2 text-[10px] text-[#8f92a8]"
                                    title="Borrar ticket (con backup)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Barra de estado inferior Windows 98 */}
        <div className="win98-statusbar font-mono">
          <span>Total órdenes: {tickets.length}</span>
          <span>Filtro activo: {statusFilter}</span>
          <span>Host: Local / Supabase</span>
        </div>
      </div>

      {/* MODAL DE RECHAZO WINDOWS 98 */}
      {rejectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="win98-box w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="win98-titlebar">
              <span className="text-xs">REJECT_PROMPT.EXE</span>
              <button
                type="button"
                onClick={() => setRejectingTicket(null)}
                className="win98-winbtn"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#1f2029] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase">Rechazar Orden de Pago</h3>
              <p className="text-xs text-[#8f92a8]">
                Orden de {rejectingTicket.buyer_name} ({rejectingTicket.buyer_cedula}) con ref {rejectingTicket.payment_ref}.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8f92a8] uppercase block">Motivo:</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingTicket(null)}
                  className="win98-btn py-1.5 px-3 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleRejectConfirm}
                  className="win98-btn py-1.5 px-3 text-xs bg-[#8c2727] text-white border-t-[#c24646]"
                >
                  Confirmar Rechazo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* MODAL DE BORRADO CON CONTRASEÑA DEV */}
      {deleteMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="win98-box w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="win98-titlebar">
              <span className="text-xs">DELETE_PROMPT.EXE</span>
              <button
                type="button"
                onClick={() => setDeleteMode(null)}
                className="win98-winbtn"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-[#1f2029] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e05252]" />
                {deleteMode.kind === 'one' ? 'Borrar Ticket' : 'Borrar TODOS los Tickets'}
              </h3>

              <p className="text-xs text-[#8f92a8]">
                {deleteMode.kind === 'one' ? (
                  <>
                    Se borrará la orden de <strong className="text-white">{deleteMode.ticket.buyer_name}</strong> (
                    {deleteMode.ticket.buyer_cedula}) con ref {deleteMode.ticket.payment_ref}. Esta acción hará un backup automático antes de destruir el registro.
                  </>
                ) : (
                  <>
                    Se borrarán <strong className="text-white">todos los tickets</strong> ({tickets.length}). Esta acción hará un backup automático y no se puede deshacer.
                  </>
                )}
              </p>

              <div className="space-y-1">
                <label className="text-[10px] text-[#8f92a8] uppercase block">Contraseña de desarrollo:</label>
                <input
                  type="password"
                  value={devPassword}
                  onChange={(e) => {
                    setDevPassword(e.target.value);
                    setDeleteResult(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteConfirm()}
                  placeholder="••••••••"
                  className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
                />
              </div>

              {deleteResult && (
                <div
                  className={`p-2.5 text-xs border flex items-center gap-2 ${
                    deleteResult.type === 'ok'
                      ? 'bg-[#122416] border-[#6b8e23] text-[#86b53a]'
                      : 'bg-[#3a1818] border-[#8c2727] text-[#e05252]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteResult.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteMode(null)}
                  className="win98-btn py-1.5 px-3 text-xs"
                >
                  Cerrar
                </button>
                {deleteResult?.type !== 'ok' && (
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDeleteConfirm}
                    className="win98-btn py-1.5 px-3 text-xs bg-[#8c2727] text-white border-t-[#c24646] disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Borrar con Backup'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
