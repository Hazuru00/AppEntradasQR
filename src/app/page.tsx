import React from 'react';
import { getActiveEvent } from '@/config/event';
import { Header } from '@/components/Header';
import { EventHero } from '@/components/EventHero';
import { TicketPurchaseForm } from '@/components/TicketPurchaseForm';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  const event = getActiveEvent();

  return (
    <div className="min-h-screen flex flex-col bg-[#14151b] text-[#e9e1d4] font-mono">
      <Header event={event} />

      <main className="flex-1 pb-16">
        <EventHero event={event} />
        <TicketPurchaseForm event={event} />
      </main>

      <Footer event={event} />
    </div>
  );
}
