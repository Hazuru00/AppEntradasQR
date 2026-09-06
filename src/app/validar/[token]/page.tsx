import React from 'react';
import Link from 'next/link';
import { getTicketByToken } from '@/lib/db';
import { getActiveEvent } from '@/config/event';
import { checkIsAdmin } from '@/lib/auth';
import { validateTokenAction } from '@/actions/tickets';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ArrowLeft,
  Monitor,
  Users,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

interface ValidarPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ValidarPage({ params }: ValidarPageProps) {
  const { token } = await params;
  const ticket = await getTicketByToken(token);
  const event = getActiveEvent();
  const isAdmin = await checkIsAdmin();

  async function markAsUsedAction() {
    'use server';
    await validateTokenAction(token);
    revalidatePath(`/validar/${token}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#14151b] text-white font-mono">
      <Header event={event} />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 flex flex-col justify-center">
        <div className="mb-4">
          <Link
            href="/"
            className="win98-btn text-xs py-1 px-3 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Inicio</span>
          </Link>
        </div>

        <div className="win98-box overflow-hidden">
          <div className="win98-titlebar">
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-mono">VERIFICADOR_DE_BOLETO.EXE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="win98-winbtn">_</div>
              <div className="win98-winbtn">□</div>
              <div className="win98-winbtn">✕</div>
            </div>
          </div>

          <div className="p-6 bg-[#1f2029] space-y-5">
            {!ticket ? (
              <div className="win98-sunken p-6 bg-[#2b1616] border border-[#8c2727] text-center space-y-3">
                <XCircle className="w-12 h-12 text-[#e05252] mx-auto" />
                <h1 className="text-xl font-bold uppercase text-white">CÓDIGO NO VÁLIDO</h1>
                <p className="text-xs text-[#8f92a8]">
                  Este código QR no corresponde a ninguna entrada en el sistema.
                </p>
                <span className="text-[10px] text-zinc-500 block truncate font-mono">
                  Token: {token}
                </span>
              </div>
            ) : ticket.status === 'APROBADO' ? (
              <div className="win98-sunken p-6 bg-[#122416] border border-[#6b8e23] text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-[#86b53a] mx-auto animate-pulse" />
                <div className="space-y-1">
                  <span className="text-xs text-[#86b53a] uppercase font-bold tracking-wider block">
                    [ VERIFICACIÓN OFICIAL ]
                  </span>
                  <h1 className="text-2xl font-bold uppercase text-white">ENTRADA VÁLIDA</h1>
                </div>

                <div className="win98-sunken p-4 bg-[#0d160f] text-left space-y-2 text-xs">
                  <div>
                    <span className="text-[#86b53a] text-[10px] uppercase block">TITULAR:</span>
                    <span className="text-base font-bold text-white block">{ticket.buyer_name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e3b23]">
                    <div>
                      <span className="text-[#86b53a] text-[10px] uppercase block">CÉDULA:</span>
                      <span className="text-white font-bold block">{ticket.buyer_cedula}</span>
                    </div>
                    <div>
                      <span className="text-[#b5a642] text-[10px] uppercase block font-bold">CAPACIDAD:</span>
                      <span className="text-white font-bold block">
                        {ticket.quantity} {ticket.quantity === 1 ? 'Persona' : 'Personas'}
                      </span>
                    </div>
                  </div>
                </div>

                {isAdmin ? (
                  <form action={markAsUsedAction}>
                    <button
                      type="submit"
                      className="win98-btn win98-btn-primary w-full py-3 text-xs font-bold uppercase"
                    >
                      [ Registrar Ingreso (Marcar como Usado) ]
                    </button>
                  </form>
                ) : (
                  <p className="text-[11px] text-[#8f92a8]">
                    Muestra esta pantalla al personal de seguridad en la puerta.
                  </p>
                )}
              </div>
            ) : ticket.status === 'USADO' ? (
              <div className="win98-sunken p-6 bg-[#2b1616] border border-[#8c2727] text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-[#e05252] mx-auto" />
                <h1 className="text-xl font-bold uppercase text-white">ENTRADA YA UTILIZADA</h1>
                <p className="text-xs text-[#e9e1d4]">
                  Este boleto ya fue validado para el ingreso de: <strong className="text-white">{ticket.buyer_name}</strong>.
                </p>
                <p className="text-[11px] text-[#8f92a8]">
                  Hora de ingreso registrado: {formatDateTime(ticket.used_at)}
                </p>
              </div>
            ) : (
              <div className="win98-sunken p-6 bg-[#262118] border border-[#b5a642] text-center space-y-3">
                <Clock className="w-12 h-12 text-[#b5a642] mx-auto" />
                <h1 className="text-xl font-bold uppercase text-white">PAGO EN VERIFICACIÓN</h1>
                <p className="text-xs text-[#8f92a8]">
                  El reporte de Pago Móvil aún no ha sido aprobado en taquilla.
                </p>
              </div>
            )}
          </div>

          <div className="win98-statusbar">
            <span>Sistema: Validación QR</span>
            <span>Seguridad: Verificado</span>
          </div>
        </div>
      </main>

      <Footer event={event} />
    </div>
  );
}
