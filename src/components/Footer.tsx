import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { EventConfig } from '@/config/event';

export function Footer({ event }: { event: EventConfig }) {
  return (
    <footer className="mt-auto border-t-2 border-t-[#4a4d61] bg-[#181922] py-6 px-4 text-xs font-mono text-[#8f92a8]">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white uppercase">{event.title}</span>
          <span>• {event.city}</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Link href="/#taquilla" className="text-[#8f92a8] hover:text-white transition-colors">
            [ Taquilla ]
          </Link>
          <Link href="/admin/scan" className="text-[#8f92a8] hover:text-white transition-colors">
            [ Escáner ]
          </Link>
          <Link href="/admin" className="text-[#8f92a8] hover:text-white transition-colors flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>[ Admin ]</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
