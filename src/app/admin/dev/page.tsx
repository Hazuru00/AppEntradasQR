import React from 'react';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth';
import { getAllTickets } from '@/lib/db';
import { getActiveEvent } from '@/config/event';
import { DevConsole } from '@/components/DevConsole';

export const dynamic = 'force-dynamic';

export default async function AdminDevPage() {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect('/admin/login');
  }

  const tickets = await getAllTickets();
  const event = getActiveEvent();

  return (
    <div className="min-h-screen bg-[#14151b] text-white font-mono">
      <DevConsole tickets={tickets} event={event} />
    </div>
  );
}