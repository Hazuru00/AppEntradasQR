import React from 'react';
import { redirect } from 'next/navigation';
import { checkIsAdmin } from '@/lib/auth';
import { getActiveEvent } from '@/config/event';
import { QrScannerComponent } from '@/components/QrScannerComponent';

export const dynamic = 'force-dynamic';

export default async function ScanPage() {
  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect('/admin/login');
  }

  const event = getActiveEvent();

  return (
    <div className="min-h-screen bg-black text-white">
      <QrScannerComponent event={event} />
    </div>
  );
}
