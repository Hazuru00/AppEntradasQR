import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTicketById } from '@/lib/db';
import { getActiveEvent } from '@/config/event';
import { getAppUrl } from '@/lib/appUrl';
import { TicketDisplay } from '@/components/TicketDisplay';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  const event = getActiveEvent();
  const appUrl = await getAppUrl();

  if (!ticket) {
    return (
    <div className="min-h-screen flex flex-col bg-[#14151b] text-white font-mono">
        <Header event={event} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black uppercase">Entrada No Encontrada</h1>
            <p className="text-xs text-zinc-400">
              No localizamos ninguna orden asociada al identificador proporcionado. Por favor verifica el enlace o contacta con soporte de taquilla.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </div>
        </main>
        <Footer event={event} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#14151b] text-white font-mono">
      <Header event={event} />
      <main className="flex-1">
        <TicketDisplay ticket={ticket} event={event} appUrl={appUrl} />
      </main>
      <Footer event={event} />
    </div>
  );
}
