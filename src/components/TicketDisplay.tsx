'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import {
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Share2,
  Calendar,
  MapPin,
  ArrowLeft,
  Check,
  Phone,
  Monitor,
  Users,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Ticket } from '@/lib/types';
import { EventConfig } from '@/config/event';
import { formatDateTime } from '@/lib/utils';

interface TicketDisplayProps {
  ticket: Ticket;
  event: EventConfig;
  appUrl: string;
}

export function TicketDisplay({ ticket, event, appUrl }: TicketDisplayProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const validationUrl = `${appUrl}/validar/${ticket.token}`;

  useEffect(() => {
    if (ticket.status === 'APROBADO') {
      try {
        confetti({
          particleCount: 45,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#457b9d', '#6b8e23'],
        });
      } catch {}
    }
  }, [ticket.status]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        backgroundColor: '#14151b',
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `boleto-${ticket.buyer_name.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('No se pudo generar la imagen del boleto.');
    } finally {
      setIsDownloading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola, registré mi entrada para ${event.title}.\n• Nombre: ${ticket.buyer_name}\n• Cédula: ${ticket.buyer_cedula}\n• Ref: ${ticket.payment_ref}\n• Boletos: ${ticket.quantity} personas`
  );
  const whatsappUrl = `https://wa.me/${event.contact.whatsapp}?text=${whatsappMessage}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Botones superiores */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="win98-btn text-xs py-1 px-3 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al Inicio</span>
        </Link>

        <button
          type="button"
          onClick={handleRefresh}
          className="win98-btn text-xs py-1 px-3 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* VENTANA ESTILO WINDOWS 98 / Y2K */}
      <motion.div
        ref={ticketRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="win98-box rounded-none overflow-hidden"
      >
        {/* Barra de Título */}
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span className="font-mono text-xs">TICKET_VIEWER.EXE - [{ticket.buyer_name.toUpperCase()}]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        {/* Cuerpo de la Ventana */}
        <div className="p-5 sm:p-7 space-y-5 bg-[#1f2029] font-mono">
          {/* Cabecera del evento */}
          <div className="border-b border-[#363847] pb-4 space-y-1">
            <span className="text-xs text-[#8f92a8] uppercase block">
              BOLETO DIGITAL OFICIAL • {event.city}
            </span>
            <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
              {event.title}
            </h1>
            <p className="text-xs text-[#e9e1d4]/80">
              {event.date} • {event.time} @ {event.venue}
            </p>
          </div>

          {/* BANNER DE ESTADO */}
          {ticket.status === 'PENDIENTE' && (
            <div className="win98-sunken p-3.5 bg-[#262118] border border-[#b5a642] text-center space-y-1">
              <div className="inline-flex items-center gap-1 text-[#b5a642] font-bold text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>PAGO EN PROCESO DE VERIFICACIÓN</span>
              </div>
              <p className="text-xs text-white">
                Tu referencia <strong className="text-[#b5a642] font-bold">{ticket.payment_ref}</strong> está siendo conciliada por taquilla.
              </p>
              <p className="text-[11px] text-[#8f92a8]">
                Al ser aprobada, tu código QR de acceso se activará en esta ventana.
              </p>
            </div>
          )}

          {ticket.status === 'APROBADO' && (
            <div className="win98-sunken p-3.5 bg-[#122416] border border-[#6b8e23] text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-[#86b53a] font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡ENTRADA APROBADA Y ACTIVA!</span>
              </div>
              <p className="text-xs text-white">
                Presenta el código QR en la entrada del evento.
              </p>
            </div>
          )}

          {ticket.status === 'USADO' && (
            <div className="win98-sunken p-3 bg-[#1c1d24] border border-[#4a4d61] text-center space-y-1">
              <span className="text-xs font-bold text-white block">
                ENTRADA YA UTILIZADA EN PUERTA
              </span>
              <p className="text-[11px] text-[#8f92a8]">
                Ingreso validado el: {formatDateTime(ticket.used_at)}
              </p>
            </div>
          )}

          {ticket.status === 'RECHAZADO' && (
            <div className="win98-sunken p-3.5 bg-[#2b1616] border border-[#8c2727] text-center space-y-1">
              <div className="inline-flex items-center gap-1 text-[#e05252] font-bold text-xs">
                <XCircle className="w-3.5 h-3.5" />
                <span>PAGO RECHAZADO EN TAQUILLA</span>
              </div>
              <p className="text-xs text-white">
                Motivo: {ticket.rejection_reason || 'Referencia no localizada en banco'}
              </p>
            </div>
          )}

          {/* AVISO DE ADMISIÓN / PASE GRUPAL */}
          <div className="win98-sunken p-3 bg-[#121318] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#457b9d]" />
              <div>
                <span className="text-[10px] text-[#8f92a8] uppercase block">CAPACIDAD DEL BOLETO:</span>
                <span className="text-white font-bold text-sm">
                  {ticket.quantity === 1
                    ? '1 PERSONA (PASE INDIVIDUAL)'
                    : `${ticket.quantity} PERSONAS (PASE GRUPAL)`}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-[#8f92a8] px-2 py-1 bg-[#191a22] border border-[#2b2d3a]">
              {ticket.quantity === 1 ? '1 Invitado' : `${ticket.quantity} Invitados`}
            </span>
          </div>

          {ticket.quantity > 1 && (
            <p className="text-[11px] text-[#8f92a8] leading-tight">
              * Nota: Todos los {ticket.quantity} asistentes deben ingresar juntos con el titular ({ticket.buyer_name}) al presentar este código QR en portería.
            </p>
          )}

          {/* CÓDIGO QR O ESTADO */}
          <div className="win98-sunken p-5 flex flex-col items-center justify-center bg-[#0d0e12]">
            {ticket.status === 'APROBADO' ? (
              <div className="space-y-3 text-center">
                <div className="p-3 bg-white border-2 border-[#5a5d72] inline-block">
                  <QRCodeSVG
                    value={validationUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#8f92a8] uppercase block">TOKEN ÚNICO:</span>
                  <span className="text-xs font-mono text-[#457b9d] font-bold block select-all">
                    {ticket.token.slice(0, 18)}...
                  </span>
                </div>
              </div>
            ) : ticket.status === 'USADO' ? (
              <div className="py-4 text-center space-y-2 opacity-40">
                <div className="p-3 bg-zinc-700 inline-block">
                  <QRCodeSVG
                    value={validationUrl}
                    size={140}
                    level="L"
                    includeMargin={false}
                  />
                </div>
                <span className="text-xs text-white block font-bold">BOLETO VALIDADO</span>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-10 h-10 text-[#b5a642] mx-auto animate-pulse" />
                <span className="text-xs text-white block font-bold">
                  Código QR en proceso de emisión
                </span>
                <span className="text-[11px] text-[#8f92a8] block max-w-xs mx-auto">
                  La taquilla activará el QR tan pronto verifique la referencia bancaria.
                </span>
              </div>
            )}
          </div>

          {/* DATOS DEL COMPRADOR */}
          <div className="win98-sunken p-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#8f92a8] text-[10px] uppercase block">TITULAR:</span>
              <span className="text-white font-bold block truncate">{ticket.buyer_name}</span>
            </div>

            <div>
              <span className="text-[#8f92a8] text-[10px] uppercase block">CÉDULA:</span>
              <span className="text-white font-bold block">{ticket.buyer_cedula}</span>
            </div>

            <div>
              <span className="text-[#8f92a8] text-[10px] uppercase block">REF. BANCARIA:</span>
              <span className="text-white font-bold block">{ticket.payment_ref}</span>
            </div>

            <div>
              <span className="text-[#8f92a8] text-[10px] uppercase block">MONTO TOTAL:</span>
              <span className="text-white font-bold block">
                ${ticket.total_amount_usd} ({ticket.total_amount_bs?.toLocaleString('es-VE')} Bs)
              </span>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="space-y-2 pt-1">
            {ticket.status === 'APROBADO' && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className="win98-btn win98-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDownloading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Guardar Boleto Digital (PNG)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="win98-btn w-full flex items-center justify-center gap-2"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#6b8e23]" />
                  <span>¡ENLACE COPIADO AL PORTAPAPELES!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#8f92a8]" />
                  <span>Copiar Enlace Permanente del Boleto</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="win98-btn win98-btn-primary w-full flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contactar Soporte de Taquilla</span>
            </a>
          </div>
        </div>

        {/* Barra de estado inferior */}
        <div className="win98-statusbar font-mono">
          <span>Token ID: {ticket.id.slice(0, 8)}</span>
          <span>Admite: {ticket.quantity} pers.</span>
          <span>Seguridad: Verificado</span>
        </div>
      </motion.div>
    </div>
  );
}
