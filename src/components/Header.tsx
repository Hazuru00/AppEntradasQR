'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Disc, QrCode, Shield, Terminal, Monitor } from 'lucide-react';
import { EventConfig } from '@/config/event';

export function Header({ event }: { event: EventConfig }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#181922] border-b-2 border-b-[#0a0b0e] border-t-2 border-t-[#4a4d61] shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo estilo aplicación retro */}
        <Link href="/" className="flex items-center gap-2 group min-w-0">
          <div className="w-7 h-7 shrink-0 rounded bg-[#2b2d3a] border-t border-l border-t-[#6b6f8a] border-l-[#6b6f8a] border-b border-r border-b-[#0a0b0e] border-r-[#0a0b0e] flex items-center justify-center text-[#e9e1d4]">
            <Disc className="w-4 h-4 group-hover:animate-spin" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold tracking-tight text-white text-sm uppercase truncate">
                {event.title}.EXE
              </span>
              <span className="hidden sm:inline shrink-0 text-[10px] font-mono px-1.5 py-0.2 bg-[#3b5998] text-white rounded-none border border-[#728ec7]">
                v2000
              </span>
            </div>
            <span className="text-[10px] text-[#8f92a8] font-mono block leading-none truncate">
              Taquilla Oficial • {event.city}
            </span>
          </div>
        </Link>

        {/* Navegación tipo botones Windows 98 */}
        <nav className="flex items-center gap-2 shrink-0">
          <Link
            href="/#taquilla"
            className="win98-btn text-xs py-1 px-2.5 flex items-center gap-1.5"
          >
            <span>Entradas</span>
          </Link>

          <Link
            href="/admin/scan"
            className="win98-btn text-xs py-1 px-2.5 flex items-center gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Escáner</span>
          </Link>

          <Link
            href="/admin"
            className={`win98-btn text-xs py-1 px-2.5 flex items-center gap-1.5 ${
              pathname.startsWith('/admin') ? 'win98-btn-primary' : ''
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
