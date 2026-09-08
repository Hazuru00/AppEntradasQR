'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, CheckCircle2, BadgeDollarSign } from 'lucide-react';
import { PaymentNotification, getNewTicketsAction } from '@/actions/notifications';
import { formatUSD, formatDateTime } from '@/lib/utils';

const SEEN_KEY = 'admin_payments_last_seen';
const POLL_MS = 12000;

function loadSeen(): string {
  try {
    return window.localStorage.getItem(SEEN_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveSeen(iso: string): void {
  try {
    window.localStorage.setItem(SEEN_KEY, iso);
  } catch {}
}

// Sonido corto estilo "pago recibido" (Web Audio, sin archivos).
let audioCtx: AudioContext | null = null;
function primeAudio(): void {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  } catch {}
}

function playBeep(): void {
  try {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [880, 1174.66].forEach((freq, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + i * 0.14);
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.12);
      osc.connect(gain).connect(audioCtx!.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.13);
    });
  } catch {}
}

export function AdminNotifications() {
  const [items, setItems] = useState<PaymentNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>(() =>
    typeof Notification === 'undefined' ? 'denied' : Notification.permission
  );
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onGesture = () => primeAudio();
    window.addEventListener('pointerdown', onGesture);
    window.addEventListener('keydown', onGesture);
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, []);

  const handleNew = useCallback((found: PaymentNotification[]) => {
    if (found.length === 0) return;
    const fresh = found.filter((t) => !seenIdsRef.current.has(t.id));
    if (fresh.length === 0) return;

    seenIdsRef.current = new Set([...seenIdsRef.current, ...fresh.map((t) => t.id)]);
    setItems((prev) => {
      const byId = new Map([...fresh, ...prev].map((t) => [t.id, t]));
      const merged = [...byId.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return merged.slice(0, 20);
    });

    const newest = fresh.reduce((a, b) =>
      new Date(a.created_at).getTime() > new Date(b.created_at).getTime() ? a : b
    );
    saveSeen(newest.created_at);
    playBeep();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try {
        new Notification('💰 ¡Pago recibido!', {
          body: `${newest.buyer_name} · Ref ${newest.payment_ref} · ${formatUSD(newest.total_amount_usd)}`,
          tag: newest.id,
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (loadSeen() === '') saveSeen(new Date().toISOString());

    let alive = true;
    let timer: number;
    const poll = async () => {
      try {
        const res = await getNewTicketsAction(loadSeen());
        if (alive && res.success) handleNew(res.tickets);
      } catch {}
      if (alive) timer = window.setTimeout(poll, POLL_MS);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        window.clearTimeout(timer);
        poll();
      }
    };
    poll();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [handleNew]);

  const markAsRead = () => {
    setItems([]);
    seenIdsRef.current = new Set();
    saveSeen(new Date().toISOString());
  };

  const requestPermission = () => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((p) => setPerm(p));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`win98-btn text-xs py-2 px-3 flex items-center gap-1.5 relative ${
          items.length > 0 ? 'win98-btn-primary' : ''
        }`}
        title="Notificaciones de pagos"
      >
        {items.length > 0 ? (
          <BellRing className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Bell className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Pagos</span>
        {items.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e05252] border border-[#8c2727] text-white text-[10px] font-bold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-2 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 win98-box overflow-hidden shadow-2xl">
          <div className="win98-titlebar">
            <span className="text-xs">NOTIFICADOR DE PAGOS - [EN VIVO]</span>
            <div className="flex items-center gap-1">
              <div className="win98-winbtn">_</div>
              <div className="win98-winbtn">✕</div>
            </div>
          </div>

          <div className="bg-[#1f2029]">
            {perm !== 'granted' && (
              <div className="p-2 border-b border-[#363847] flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#8f92a8]">
                  Activa alertas del navegador (suenan aún con el panel en otra pestaña)
                </span>
                <button
                  type="button"
                  onClick={requestPermission}
                  className="win98-btn text-[10px] py-1 px-2"
                >
                  Activar
                </button>
              </div>
            )}

            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8f92a8] space-y-1">
                <BadgeDollarSign className="w-6 h-6 mx-auto text-[#6b8e23]" />
                <span>Sin pagos nuevos por ahora.</span>
                <span className="block text-[10px]">
                  Avísame cuando aparezca una compra (cada 12s).
                </span>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-[#262836]">
                {items.map((t) => (
                  <div key={t.id} className="px-3 py-2 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white font-bold truncate">{t.buyer_name}</span>
                      <span className="text-[10px] text-[#86b53a] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {formatUSD(t.total_amount_usd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-[#8f92a8]">
                      <span className="truncate">Ref {t.payment_ref} · {t.quantity} boleto(s)</span>
                      <span className="whitespace-nowrap">{formatDateTime(t.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="p-2 border-t border-[#363847]">
                <button
                  type="button"
                  onClick={markAsRead}
                  className="win98-btn w-full text-xs py-1.5 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marcar como leído
                </button>
              </div>
            )}
          </div>

          <div className="win98-statusbar">
            <span>Sonando: Sí</span>
            <span>Cadencia 12s</span>
          </div>
        </div>
      )}
    </div>
  );
}