// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente público para consultas de lectura si Supabase está configurado
export const supabasePublic: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('tu-proyecto')
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Cliente administrativo con service role para validaciones y mutaciones seguras
export const supabaseAdmin: SupabaseClient | null =
  supabaseUrl && (supabaseServiceKey || supabaseAnonKey) && !supabaseUrl.includes('tu-proyecto')
    ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;
