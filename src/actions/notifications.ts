'use server';

import { checkIsAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export interface PaymentNotification {
  id: string;
  buyer_name: string;
  payment_ref: string;
  quantity: number;
  total_amount_usd: number;
  status: string;
  created_at: string;
}

// Devuelve las compras hechas después de `since` (ISO). Solo el admin puede consultarlo.
export async function getNewTicketsAction(
  since: string
): Promise<{ success: boolean; tickets: PaymentNotification[]; error?: string }> {
  if (!(await checkIsAdmin())) {
    return { success: false, tickets: [], error: 'Acceso no autorizado.' };
  }
  if (!supabaseAdmin) {
    return { success: false, tickets: [], error: 'Supabase no está configurado.' };
  }

  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('id, buyer_name, payment_ref, quantity, total_amount_usd, status, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { success: false, tickets: [], error: error.message };

  return { success: true, tickets: data as PaymentNotification[] };
}