'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Monitor, Terminal, Disc, ArrowDown } from 'lucide-react';
import { EventConfig } from '@/config/event';

export function EventHero({ event }: { event: EventConfig }) {
  return (
    <section className="pt-8 pb-6 px-4 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="win98-box rounded-none overflow-hidden"
      >
        {/* Barra de Título Windows 98 */}
        <div className="win98-titlebar">
          <div className="flex items-center gap-2">
            <Monitor className="w-3.5 h-3.5 text-white" />
            <span className="font-mono text-xs">EVENT_PROPERTIES.EXE - [{event.title}]</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="win98-winbtn">_</div>
            <div className="win98-winbtn">□</div>
            <div className="win98-winbtn">✕</div>
          </div>
        </div>

        {/* Contenido de la Ventana */}
        <div className="p-5 sm:p-7 space-y-6 bg-[#1f2029]">
          {/* Encabezado Principal */}
          <div className="border-b border-[#363847] pb-5 space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#121318] border border-[#3b3e52] text-[#b5a642] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-[#6b8e23] inline-block animate-pulse" />
              <span>SISTEMA DE TAQUILLA ACTIVO</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white uppercase font-mono">
              {event.title}
            </h1>
            <p className="text-sm text-[#e9e1d4]/80 font-mono leading-relaxed">
              {event.subtitle}
            </p>
          </div>

          {/* Ficha de Detalles en Panel Hundido (Sunken) */}
          <div className="win98-sunken p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-[#8f92a8] text-[11px] block uppercase">• FECHA</span>
              <span className="text-white font-bold block">{event.date}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#8f92a8] text-[11px] block uppercase">• HORARIO</span>
              <span className="text-white font-bold block">{event.time}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#8f92a8] text-[11px] block uppercase">• LOCACIÓN</span>
              <span className="text-white font-bold block">{event.venue} ({event.city})</span>
            </div>
          </div>

          {/* Nota de Dress Code estilo Terminal */}
          {event.dressCode && (
            <div className="win98-sunken p-3 bg-[#0d0e12] font-mono text-xs text-[#e9e1d4] space-y-1">
              <span className="text-[#6b8e23] font-bold block">
                C:\EVENT&gt; TYPE DRESS_CODE.TXT
              </span>
              <p className="text-zinc-300">
                &gt;&gt; {event.dressCode}
              </p>
            </div>
          )}

          {/* Botón de acceso a taquilla */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#8f92a8]">
              Precio: $3 USD o 3.000 Bs por persona
            </span>
            <a
              href="#taquilla"
              className="win98-btn win98-btn-primary w-full sm:w-auto text-center flex items-center justify-center gap-2"
            >
              <span>Ir a la Taquilla de Entradas</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Barra de estado inferior Windows 98 */}
        <div className="win98-statusbar font-mono">
          <span>Zona: Taquilla Principal</span>
          <span>1 archivo(s) seleccionado(s)</span>
          <span>Estado: Listo</span>
        </div>
      </motion.div>
    </section>
  );
}
