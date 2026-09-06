import React from 'react';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth';
import { getAllTickets, getDashboardStats } from '@/lib/db';
import { getActiveEvent } from '@/config/event';
import { AdminTable } from '@/components/AdminTable';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect('/admin/login');
  }

  const tickets = await getAllTickets();
  const stats = await getDashboardStats();
  const event = getActiveEvent();

  return (
    <div className="min-h-screen bg-[#14151b] text-white font-mono">
      <AdminTable tickets={tickets} stats={stats} event={event} />
    </div>
  );
}
