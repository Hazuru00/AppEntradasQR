'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  CreditCard,
  Copy,
  Check,
  Minus,
  Plus,
  Loader2,
  Users,
  AlertCircle,
  FileText,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { EventConfig } from '@/config/event';
import { createTicketAction } from '@/actions/tickets';

interface TicketPurchaseFormProps {
  event: EventConfig;
}

export function TicketPurchaseForm({ event }: TicketPurchaseFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [buyerName, setBuyerName] = useState<string>('');
  const [cedulaPrefix, setCedulaPrefix] = useState<'V' | 'E'>('V');
  const [cedulaNumber, setCedulaNumber] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const unitUSD = event.singleTicket.priceUSD; // $3
  const unitBs = event.singleTicket.priceBs;   // 3000 Bs

  const totalUSD = unitUSD * quantity;
  const totalBs = unitBs * quantity;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const fullCedula = `${cedulaPrefix}-${cedulaNumber.trim()}`;

    if (!buyerName.trim() || buyerName.trim().length < 3) {
      setErrorMessage('Error: Ingresa el nombre y apellido del titular.');
      return;
    }
    if (!cedulaNumber.trim() || cedulaNumber.trim().length < 5) {
      setErrorMessage('Error: Ingresa un número de cédula válido.');
      return;
    }
    if (!buyerPhone.trim() || buyerPhone.trim().length < 8) {
      setErrorMessage('Error: Ingresa tu número de WhatsApp de contacto.');
      return;
    }
    if (!paymentRef.trim() || paymentRef.trim().length < 4) {
      setErrorMessage('Error: Ingresa el número de referencia del Pago Móvil.');
      return;
    }

    const formData = new FormData();
    formData.append('buyerName', buyerName.trim());
    formData.append('buyerCedula', fullCedula);
    formData.append('buyerPhone', buyerPhone.trim());
    formData.append('paymentRef', paymentRef.trim());
    formData.append('quantity', quantity.toString());
    formData.append('ticketTypeId', 'general');

    startTransition(async () => {
      const res = await createTicketAction(formData);
      if (res.success && res.ticketId) {
        router.push(`/ticket/${res.ticketId}`);
      } else {
        setErrorMessage(res.error || 'Ocurrió un error al procesar el registro.');
      }
    });
  };

  return (
    <div id="taquilla" className="scroll-mt-20 max-w-3xl mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="win98-box rounded-none overflow-hidden"
      >
        {/* Barra de título de la ventana */}
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span className="font-mono text-xs">TAQUILLA_CHECKOUT.EXE - [Registro de Pago]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-5 sm:p-7 space-y-6 bg-[#1f2029]">
          {/* Selector de Cantidad */}
          <div className="border-b border-[#363847] pb-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-sm font-bold font-mono text-white block uppercase">
                  1. Cantidad de Entradas:
                </label>
                <span className="text-xs text-[#8f92a8] font-mono">
                  Precio unitario: ${unitUSD} USD o {unitBs.toLocaleString('es-VE')} Bs
                </span>
              </div>

              {/* Botones táctiles - y + */}
              <div className="flex items-center gap-2 bg-[#121318] p-1 border border-[#3b3e52]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="win98-btn py-1 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="w-12 text-center font-mono font-bold text-base text-white">
                  {quantity}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  disabled={quantity >= 10}
                  className="win98-btn py-1 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* AVISO IMPORTANTE: CÓMO FUNCIONAN LAS ENTRADAS GRUPALES */}
            <div className="win98-sunken p-3 bg-[#121318] text-xs font-mono flex items-start gap-2.5">
              <Users className="w-4 h-4 text-[#457b9d] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-white font-bold block uppercase">
                  {quantity === 1 ? 'PASE INDIVIDUAL (1 PERSONA)' : `PASE GRUPAL (${quantity} PERSONAS)`}
                </span>
                <p className="text-[#8f92a8] leading-relaxed">
                  {quantity === 1
                    ? 'La entrada es válida para 1 persona. Ingresas con tu cédula y tu código QR en puerta.'
                    : `Solo debes ingresar los datos del titular responsable del pago. Tus ${quantity - 1} acompañantes ingresarán contigo al evento mostrando este único código QR para las ${quantity} personas.`}
                </p>
              </div>
            </div>
          </div>

          {/* DATOS DE PAGO MÓVIL EN PANEL HUNDIDO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold font-mono text-white block uppercase">
                2. Realiza el Pago Móvil:
              </label>
              {copiedField && (
                <span className="text-xs font-mono text-[#6b8e23] font-bold">
                  [ ✓ COPIADO AL PORTAPAPELES ]
                </span>
              )}
            </div>

            <div className="win98-sunken p-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2 bg-[#191a22] border border-[#2b2d3a] flex items-center justify-between">
                  <div>
                    <span className="text-[#8f92a8] text-[10px] block uppercase">BANCO:</span>
                    <span className="text-white font-bold">{event.pagoMovil.bank}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(event.pagoMovil.bank, 'banco')}
                    className="win98-btn py-0.5 px-2 text-[10px]"
                  >
                    Copiar
                  </button>
                </div>

                <div className="p-2 bg-[#191a22] border border-[#2b2d3a] flex items-center justify-between">
                  <div>
                    <span className="text-[#8f92a8] text-[10px] block uppercase">TELÉFONO:</span>
                    <span className="text-white font-bold">{event.pagoMovil.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(event.pagoMovil.phone.replace(/[^0-9]/g, ''), 'tel')}
                    className="win98-btn py-0.5 px-2 text-[10px]"
                  >
                    Copiar
                  </button>
                </div>

                <div className="p-2 bg-[#191a22] border border-[#2b2d3a] flex items-center justify-between">
                  <div>
                    <span className="text-[#8f92a8] text-[10px] block uppercase">CÉDULA / RIF:</span>
                    <span className="text-white font-bold">{event.pagoMovil.idNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(event.pagoMovil.idNumber.replace(/[^0-9]/g, ''), 'ci')}
                    className="win98-btn py-0.5 px-2 text-[10px]"
                  >
                    Copiar
                  </button>
                </div>

                <div className="p-2 bg-[#252836] border border-[#3b5998] flex items-center justify-between">
                  <div>
                    <span className="text-[#b5a642] text-[10px] block uppercase font-bold">TOTAL A TRANSFERIR:</span>
                    <span className="text-white font-bold text-sm">{totalBs.toLocaleString('es-VE')} Bs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(totalBs.toString(), 'bs')}
                    className="win98-btn win98-btn-primary py-0.5 px-2 text-[10px]"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#8f92a8] pt-1">
                Titular: <strong className="text-white">{event.pagoMovil.accountHolder}</strong>
              </div>
            </div>
          </div>

          {/* FORMULARIO: DATOS DEL TITULAR */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <label className="text-sm font-bold font-mono text-white block uppercase">
              3. Registra tu Referencia:
            </label>

            {errorMessage && (
              <div className="p-3 bg-[#3a1818] border border-[#8c2727] text-white text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#e05252] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Nombre y Apellido */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8f92a8] block uppercase">
                Nombre y Apellido del Titular:
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Ej. Valeria Castillo"
                className="win98-sunken w-full p-2.5 font-mono text-xs text-white focus:outline-none focus:border-[#728ec7]"
              />
            </div>

            {/* Cédula y Teléfono */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#8f92a8] block uppercase">
                  Cédula de Identidad (Para ingresar):
                </label>
                <div className="flex gap-1">
                  <select
                    value={cedulaPrefix}
                    onChange={(e) => setCedulaPrefix(e.target.value as 'V' | 'E')}
                    className="win98-sunken p-2 font-mono text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={cedulaNumber}
                    onChange={(e) => setCedulaNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="24123456"
                    className="win98-sunken w-full p-2.5 font-mono text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#8f92a8] block uppercase">
                  WhatsApp de Contacto:
                </label>
                <input
                  type="tel"
                  required
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="0412-1234567"
                  className="win98-sunken w-full p-2.5 font-mono text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Número de Referencia */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#8f92a8] block uppercase">
                Número de Referencia del Pago Móvil:
              </label>
              <input
                type="text"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Ej. 654321 (Dígitos del comprobante)"
                className="win98-sunken w-full p-2.5 font-mono text-xs text-white font-bold focus:outline-none"
              />
            </div>

            {/* Resumen Final y Botón de Envío */}
            <div className="pt-4 border-t border-[#363847] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="font-mono text-xs">
                <span className="text-[#8f92a8] block uppercase">TOTAL DE LA ORDEN:</span>
                <span className="text-white font-bold text-base">
                  ${totalUSD} USD <span className="text-xs text-[#8f92a8]">({totalBs.toLocaleString('es-VE')} Bs)</span>
                </span>
                <span className="text-[11px] text-[#457b9d] block">
                  Válido para {quantity} {quantity === 1 ? 'persona' : 'personas'}
                </span>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="win98-btn win98-btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ENVIANDO REPORTE...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRMAR Y OBTENER QR</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Barra de estado inferior */}
        <div className="win98-statusbar font-mono">
          <span>Campos requeridos: 4</span>
          <span>Moneda: USD / VED</span>
          <span>Seguridad: Verificación en Taquilla</span>
        </div>
      </motion.div>
    </div>
  );
}
