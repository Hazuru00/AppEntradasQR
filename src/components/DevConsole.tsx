'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Lock,
  ArrowLeft,
  Search,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Save,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Music2,
  Upload,
  ListX,
} from 'lucide-react';
import { Ticket, TicketStatus } from '@/lib/types';
import { EventConfig } from '@/config/event';
import {
  devUnlockAction,
  devUpdateTicketAction,
  devUnrejectAction,
  devRevertUsedAction,
  devDeleteTicketAction,
  devClearTicketsAction,
} from '@/actions/dev';
import {
  devUploadTrackAction,
  devDeleteTrackAction,
  getMusicPlaylistAction,
} from '@/actions/music';
import { MusicTrack } from '@/lib/music';
import { formatUSD, formatBs, formatDateTime } from '@/lib/utils';

interface DevConsoleProps {
  tickets: Ticket[];
  event: EventConfig;
}

const STATUS_OPTIONS: TicketStatus[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'USADO'];

export function DevConsole({ tickets, event }: DevConsoleProps) {
  const [devPassword, setDevPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<{ id: string; action: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const tryUnlock = async () => {
    if (!devPassword.trim()) {
      setAttemptError('Ingresa la contraseña de desarrollo.');
      return;
    }
    setUnlocking(true);
    setAttemptError(null);
    const res = await devUnlockAction(devPassword.trim());
    setUnlocking(false);
    if (res.success) {
      setUnlocked(true);
    } else {
      setAttemptError(res.error || 'Contraseña incorrecta.');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      t.buyer_name.toLowerCase().includes(term) ||
      t.buyer_cedula.toLowerCase().includes(term) ||
      t.payment_ref.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term)
    );
  });

  const openEdit = (t: Ticket) => {
    if (editingId === t.id) {
      setEditingId(null);
      return;
    }
    setEditingId(t.id);
    setForm({
      buyerName: t.buyer_name,
      buyerCedula: t.buyer_cedula,
      buyerPhone: t.buyer_phone,
      paymentRef: t.payment_ref,
      quantity: String(t.quantity),
      status: t.status,
    });
  };

  const runAction = async (id: string, action: string, fn: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy({ id, action });
    setMessage(null);
    const res = await fn();
    setBusy(null);

    if (!res.success) {
      setMessage({ type: 'err', text: res.error || 'Error al ejecutar la acción.' });
      return;
    }
    setMessage({ type: 'ok', text: 'Acción ejecutada correctamente.' });
    setEditingId(null);
  };

  const handleSave = (ticketId: string) => {
    runAction(ticketId, 'save', () => devUpdateTicketAction(ticketId, devPassword, form));
  };

  const handleUnreject = (t: Ticket, toApproved: boolean) => {
    runAction(t.id, 'unreject', () => devUnrejectAction(t.id, devPassword, toApproved));
  };

  const handleRevertUsed = (t: Ticket) => {
    runAction(t.id, 'revert', () => devRevertUsedAction(t.id, devPassword));
  };

  const handleDelete = (t: Ticket) => {
    if (!window.confirm(`¿Borrar el ticket de ${t.buyer_name}? Se hará un backup automático.`)) return;
    runAction(t.id, 'delete', () => devDeleteTicketAction(t.id, devPassword));
  };

  const handleClearAll = () => {
    if (!window.confirm('¿Borrar TODOS los tickets? Se hará un backup automático y no se puede deshacer.')) return;
    runAction('all', 'clear', () => devClearTicketsAction(devPassword));
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#14151b] text-white px-4 py-6 max-w-xl mx-auto space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#363847] pb-3">
          <Link href="/admin" className="win98-btn text-xs py-1 px-3 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Panel</span>
          </Link>
        </div>

        <div className="win98-box overflow-hidden">
          <div className="win98-titlebar">
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-white" />
              <span className="text-xs">DEV_LOCK.EXE - [Acceso restringido]</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="win98-winbtn">_</div>
              <div className="win98-winbtn">□</div>
              <div className="win98-winbtn">✕</div>
            </div>
          </div>

          <div className="p-6 bg-[#1f2029] space-y-5">
            <div className="border-b border-[#363847] pb-3 space-y-1 text-center">
              <Lock className="w-8 h-8 text-[#b5a642] mx-auto" />
              <h1 className="text-base font-bold text-white uppercase">Consola de Desarrollo</h1>
              <p className="text-xs text-[#8f92a8]">
                Herramientas de soporte técnico. Ingresa la credencial de desarrollo para continuar.
              </p>
            </div>

            {attemptError && (
              <div className="p-2.5 bg-[#3a1818] border border-[#8c2727] text-white text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e05252] shrink-0" />
                <span>{attemptError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-[#8f92a8] uppercase block">Contraseña de desarrollo:</label>
              <input
                type="password"
                value={devPassword}
                onChange={(e) => {
                  setDevPassword(e.target.value);
                  setAttemptError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
                placeholder="••••••••"
                className="win98-sunken w-full p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={tryUnlock}
              disabled={unlocking}
              className="win98-btn win98-btn-primary w-full py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {unlocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>[ Desbloquear Consola ]</span>
            </button>
          </div>

          <div className="win98-statusbar">
            <span>Zona: Dev Tools</span>
            <span>Nivel: Máximo</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5 font-mono">
      <div className="win98-box overflow-hidden">
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span className="text-xs">DEV_CONSOLE.EXE - [Soporte & Resolución]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5 bg-[#1f2029]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#363847] pb-4">
            <div>
              <span className="text-xs text-[#b5a642] uppercase block">
                *** AREA DE DESARROLLADOR — MANEJO CON CUIDADO ***
              </span>
              <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
                {event.title} — Consola Dev
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin" className="win98-btn text-xs py-2 px-3 flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setClearConfirm(true)}
                className="win98-btn text-xs py-2 px-3 flex items-center gap-1.5 bg-[#8c2727] text-white border-t-[#c24646]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar TODOS</span>
              </button>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 text-xs flex items-center gap-2 border ${
                message.type === 'ok'
                  ? 'bg-[#122416] border-[#6b8e23] text-[#86b53a]'
                  : 'bg-[#3a1818] border-[#8c2727] text-[#e05252]'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-[#8f92a8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cédula, ref o ID..."
                className="win98-sunken w-full pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>
            <span className="text-xs text-[#8f92a8]">
              {filteredTickets.length} de {tickets.length} tickets
            </span>
          </div>

          <div className="win98-sunken overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#e9e1d4]">
                <thead className="bg-[#181922] border-b border-[#363847] text-[#8f92a8] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Titular</th>
                    <th className="py-2.5 px-3">Cédula</th>
                    <th className="py-2.5 px-3">Ref</th>
                    <th className="py-2.5 px-3">Pers.</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Creado</th>
                    <th className="py-2.5 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262836]">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-[#8f92a8]">
                        [ Sin resultados ]
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <React.Fragment key={t.id}>
                        <tr className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-2 px-3">
                            <span className="font-bold text-white block">{t.buyer_name}</span>
                            <span className="text-[10px] text-[#8f92a8]">
                              {formatUSD(t.total_amount_usd)} / {formatBs(t.total_amount_bs)}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-white">{t.buyer_cedula}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 bg-[#121318] border border-[#2e3142]">{t.payment_ref}</span>
                          </td>
                          <td className="py-2 px-3 font-bold text-white">{t.quantity}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold border ${
                                t.status === 'APROBADO'
                                  ? 'bg-[#122416] text-[#86b53a] border-[#6b8e23]'
                                  : t.status === 'PENDIENTE'
                                  ? 'bg-[#262118] text-[#b5a642] border-[#b5a642]'
                                  : t.status === 'USADO'
                                  ? 'bg-[#191a22] text-[#8f92a8] border-[#3b3e52]'
                                  : 'bg-[#2b1616] text-[#e05252] border-[#8c2727]'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-[#8f92a8]">{formatDateTime(t.created_at)}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className="win98-btn py-0.5 px-2 text-[10px]"
                              title={editingId === t.id ? 'Cerrar' : 'Editar / Corregir'}
                            >
                              {editingId === t.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {editingId === t.id && (
                          <tr className="bg-[#14151b]">
                            <td colSpan={7} className="p-4">
                              <DevEditPanel
                                ticket={t}
                                form={form}
                                setForm={setForm}
                                busy={busy}
                                onSave={() => handleSave(t.id)}
                                onUnrejectPending={() => handleUnreject(t, false)}
                                onUnrejectApproved={() => handleUnreject(t, true)}
                                onRevertUsed={() => handleRevertUsed(t)}
                                onDelete={() => handleDelete(t)}
                              />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* REPRODUCTOR / PLAYLIST (MÚSICA DEL EVENTO) */}
          <div className="border-t border-[#363847] pt-4">
            <MusicAdmin devPassword={devPassword} />
          </div>

          <div className="text-[11px] text-[#8f92a8] border-t border-[#363847] pt-3 space-y-0.5">
            <span className="text-[#b5a642] block">Opciones de estado para des-rechazar:</span>
            <span className="block">• RECHAZADO → PENDIENTE: vuelve a la cola de verificación</span>
            <span className="block">• RECHAZADO → APROBADO: activa el QR directamente</span>
            <span className="block">• USADO → APROBADO: anula un ingreso marcado por error (se limpia used_at)</span>
            <span className="block">• El borrado (individual o total) siempre genera un backup en data/backups/</span>
          </div>
        </div>

        <div className="win98-statusbar">
          <span>Dev Tools: activo</span>
          <span>{tickets.length} ticket(s)</span>
          <span>Backups: automáticos</span>
        </div>
      </div>

      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="win98-box w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="win98-titlebar">
              <span className="text-xs">WARNING.EXE - [Borrado total]</span>
              <button type="button" onClick={() => setClearConfirm(false)} className="win98-winbtn">✕</button>
            </div>
            <div className="p-5 bg-[#1f2029] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e05252]" />
                ¿Borrar TODOS los tickets?
              </h3>
              <p className="text-xs text-[#8f92a8]">
                Se borrarán todos los registros de la base de datos (<strong className="text-white">{tickets.length} tickets</strong>). Se generará un backup automático antes de destruir los datos.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setClearConfirm(false)} className="win98-btn py-1.5 px-3 text-xs">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy?.id === 'all'}
                  onClick={() => {
                    setClearConfirm(false);
                    handleClearAll();
                  }}
                  className="win98-btn py-1.5 px-3 text-xs bg-[#8c2727] text-white border-t-[#c24646] disabled:opacity-50"
                >
                  {busy?.id === 'all' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sí, borrar todo con backup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DevEditPanelProps {
  ticket: Ticket;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  busy: { id: string; action: string } | null;
  onSave: () => void;
  onUnrejectPending: () => void;
  onUnrejectApproved: () => void;
  onRevertUsed: () => void;
  onDelete: () => void;
}

function DevEditPanel({
  ticket,
  form,
  setForm,
  busy,
  onSave,
  onUnrejectPending,
  onUnrejectApproved,
  onRevertUsed,
  onDelete,
}: DevEditPanelProps) {
  const set = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
  const isBusy = busy?.id === ticket.id;

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-[#8f92a8] uppercase block">EDITOR DE TICKET — ID: {ticket.id}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        <Field label="Nombre y Apellido" value={form.buyerName} onChange={(v) => set('buyerName', v)} />
        <Field label="Cédula" value={form.buyerCedula} onChange={(v) => set('buyerCedula', v)} />
        <Field label="WhatsApp" value={form.buyerPhone} onChange={(v) => set('buyerPhone', v)} />
        <Field label="Ref. Pago Móvil" value={form.paymentRef} onChange={(v) => set('paymentRef', v)} />
        <Field
          label="Cantidad de personas"
          value={form.quantity}
          onChange={(v) => set('quantity', v.replace(/[^0-9]/g, ''))}
        />

        <div className="space-y-1">
          <label className="text-[10px] text-[#8f92a8] uppercase block">Estado</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
            className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-[11px] text-[#8f92a8]">
        Montos se recalculan automáticamente al guardar (precio × cantidad).
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-[#363847]">
        <button
          type="button"
          disabled={isBusy}
          onClick={onSave}
          className="win98-btn win98-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy?.action === 'save' && isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Guardar cambios
        </button>

        {ticket.status === 'RECHAZADO' && (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={onUnrejectPending}
              className="win98-btn py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Des-rechazar → PENDIENTE
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onUnrejectApproved}
              className="win98-btn py-1.5 px-3 text-xs flex items-center gap-1.5 bg-[#6b8e23] text-white border-t-[#8eb738] disabled:opacity-50"
            >
              <CheckCircle2 className="w-3 h-3" />
              Des-rechazar → APROBADO
            </button>
          </>
        )}

        {ticket.status === 'USADO' && (
          <button
            type="button"
            disabled={isBusy}
            onClick={onRevertUsed}
            className="win98-btn py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            Revertir USADO → APROBADO
          </button>
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={onDelete}
          className="win98-btn py-1.5 px-3 text-xs flex items-center gap-1.5 bg-[#8c2727] text-white border-t-[#c24646] disabled:opacity-50"
        >
          {busy?.action === 'delete' && isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          Borrar ticket (con backup)
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-[#8f92a8] uppercase block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección "Músika" de la consola dev: sube, lista y borra la playlist del evento.
// ---------------------------------------------------------------------------

function MusicAdmin({ devPassword }: { devPassword: string }) {
  const [tracks, setTracks] = useState<MusicTrack[] | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = () => {
    getMusicPlaylistAction().then((res) => setTracks(res.tracks));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleUpload = () => {
    if (!title.trim()) {
      setMsg({ type: 'err', text: 'Indica el título de la canción.' });
      return;
    }
    if (!audioFile) {
      setMsg({ type: 'err', text: 'Selecciona el archivo de audio.' });
      return;
    }

    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set('devPassword', devPassword);
    fd.set('title', title.trim());
    fd.set('artist', artist.trim());
    fd.set('audio', audioFile);
    if (coverFile) fd.set('cover', coverFile);

    devUploadTrackAction(fd).then((res) => {
      setBusy(false);
      setMsg(res.success ? { type: 'ok', text: 'Canción subida. Ya suena en la web.' } : { type: 'err', text: res.error || 'Error al subir.' });
      if (res.success) {
        setTitle('');
        setArtist('');
        setAudioFile(null);
        setCoverFile(null);
        refresh();
      }
    });
  };

  const handleDelete = (slug: string) => {
    setBusy(true);
    setMsg(null);
    devDeleteTrackAction(slug, devPassword).then((res) => {
      setBusy(false);
      setConfirmDelete(null);
      setMsg(res.success ? { type: 'ok', text: 'Canción borrada del bucket.' } : { type: 'err', text: res.error || 'Error al borrar.' });
      refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-4 h-4 text-[#b5a642]" />
          <h3 className="text-sm font-bold text-white uppercase">Músika del Evento (Playlist)</h3>
        </div>
        <span className="text-[10px] text-[#8f92a8]">Bucket Supabase: music</span>
      </div>

      {msg && (
        <div
          className={`p-2.5 text-xs border flex items-center gap-2 ${
            msg.type === 'ok'
              ? 'bg-[#122416] border-[#6b8e23] text-[#86b53a]'
              : 'bg-[#3a1818] border-[#8c2727] text-[#e05252]'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lista de canciones */}
        <div className="win98-sunken overflow-hidden">
          <div className="p-2 bg-[#181922] text-[10px] text-[#8f92a8] uppercase">Canciones subidas</div>
          <div className="max-h-64 overflow-y-auto divide-y divide-[#262836]">
            {tracks === null ? (
              <div className="p-4 text-center text-xs text-[#8f92a8]">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                [ Cargando... ]
              </div>
            ) : tracks.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8f92a8]">
                [ No hay canciones aún — súbelas a la derecha ]
              </div>
            ) : (
              tracks.map((t) => (
                <div key={t.id} className="p-2.5 flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-[#121318] border border-[#2e3142] shrink-0 overflow-hidden">
                    {t.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.coverUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music2 className="w-4 h-4 text-[#8f92a8] m-auto mt-3" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-white truncate">{t.title}</span>
                    <span className="block text-[10px] text-[#8f92a8]">
                      {t.id}.mp3 · {(t.size / 1048576).toFixed(1)} MB
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDelete(t.id)}
                    className="win98-btn py-0.5 px-2 text-[10px] bg-[#8c2727] text-white border-t-[#c24646] disabled:opacity-50"
                    title="Borrar del bucket"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Formulario de subida */}
        <div className="win98-sunken p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] text-[#8f92a8] uppercase block">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: La Copa de la Vida"
                className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-[#8f92a8] uppercase block">Artista (opcional)</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ej: Ricky Martin"
                className="win98-sunken w-full p-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#8f92a8] uppercase block">Archivo de audio (MP3, máx 25 MB) *</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              className="text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-none file:border file:border-[#5a5d72] file:bg-[#181922] file:text-white file:text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-[#8f92a8] uppercase block">Portada / foto de la canción (JPG o PNG, máx 5 MB)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-none file:border file:border-[#5a5d72] file:bg-[#181922] file:text-white file:text-xs"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={handleUpload}
              className="win98-btn win98-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Subir canción (reemplaza si existe)
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="win98-box w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="win98-titlebar">
              <span className="text-xs">DELETE.EXE - [Borrar canción]</span>
              <button type="button" onClick={() => setConfirmDelete(null)} className="win98-winbtn">✕</button>
            </div>
            <div className="p-5 bg-[#1f2029] space-y-4">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <ListX className="w-4 h-4 text-[#e05252]" />
                ¿Borrar esta canción del bucket?
              </h3>
              <p className="text-xs text-[#8f92a8]">
                Se eliminará <strong className="text-white">{confirmDelete}.mp3</strong> y su portada de Supabase Storage. Dejará de sonar en la web.
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDelete(null)} className="win98-btn py-1.5 px-3 text-xs">
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(confirmDelete)}
                  className="win98-btn py-1.5 px-3 text-xs bg-[#8c2727] text-white border-t-[#c24646] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Borrar definitivamente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}