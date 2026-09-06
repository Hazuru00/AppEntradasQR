// src/lib/types.ts

export type TicketStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'USADO';

export interface Ticket {
  id: string;
  token: string;
  buyer_name: string;
  buyer_cedula: string;
  buyer_phone: string;
  payment_ref: string;
  quantity: number;
  total_amount_usd: number;
  total_amount_bs: number;
  ticket_type: string;
  ticket_tier_name?: string;
  status: TicketStatus;
  rejection_reason?: string | null;
  used_at?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseTicketInput {
  buyerName: string;
  buyerCedula: string;
  buyerPhone: string;
  paymentRef: string;
  quantity: number;
  ticketTypeId: string;
}

export interface ValidationResponse {
  success: boolean;
  status: TicketStatus | 'NOT_FOUND';
  message: string;
  ticket?: {
    id: string;
    token: string;
    buyerName: string;
    buyerCedula: string;
    buyerPhone?: string;
    quantity: number;
    ticketType: string;
    ticketTierName?: string;
    usedAt?: string | null;
    approvedAt?: string | null;
  };
}

export interface DashboardStats {
  totalTicketsSold: number;
  pendingCount: number;
  approvedCount: number;
  usedCount: number;
  rejectedCount: number;
  totalAmountUSD: number;
  totalAmountBs: number;
}
