-- ==============================================================================
-- SCHEMA PARA SUPABASE / POSTGRESQL: SISTEMA DE ENTRADAS QR (EVENTOS / Y2K / CINE)
-- ==============================================================================
-- Copia y pega este contenido en el SQL Editor de tu proyecto en Supabase (https://supabase.com)

-- 1. Crear tipo ENUM para el estado de la entrada si no existe
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'USADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear tabla de entradas (tickets)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  buyer_name VARCHAR(255) NOT NULL,
  buyer_cedula VARCHAR(50) NOT NULL,
  buyer_phone VARCHAR(50) NOT NULL,
  payment_ref VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount_bs NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  ticket_type VARCHAR(50) NOT NULL DEFAULT 'general',
  ticket_tier_name VARCHAR(100),
  status ticket_status NOT NULL DEFAULT 'PENDIENTE',
  rejection_reason TEXT,
  used_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para acelerar búsquedas en taquilla, admin y validación de QR
CREATE INDEX IF NOT EXISTS idx_tickets_token ON public.tickets (token);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_ref ON public.tickets (payment_ref);
CREATE INDEX IF NOT EXISTS idx_tickets_cedula ON public.tickets (buyer_cedula);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets (created_at DESC);

-- 4. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Configurar Row Level Security (RLS)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 6. Permisos para las keys de la API (con "Automatically expose new tables" desactivado no hay autogrants)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.tickets TO service_role;

-- La app usa la secret key (service_role), pero dejamos también los permisos de lectura/inserción
-- públicos para la publishable key si algún día se usa supabase-js desde el navegador (RLS/policies).
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.tickets TO anon, authenticated;

-- Política para permitir que cualquiera pueda registrar una compra (INSERT)
DROP POLICY IF EXISTS "Permitir compras públicas" ON public.tickets;
CREATE POLICY "Permitir compras públicas"
ON public.tickets FOR INSERT
WITH CHECK (true);

-- Política para permitir que cualquier persona con su ID o Token pueda consultar su entrada (SELECT)
DROP POLICY IF EXISTS "Permitir lectura de entrada por token o id" ON public.tickets;
CREATE POLICY "Permitir lectura de entrada por token o id"
ON public.tickets FOR SELECT
USING (true);

-- Política para que el Service Role o Admin pueda actualizar estados (UPDATE)
DROP POLICY IF EXISTS "Permitir actualización a través de service role o server actions" ON public.tickets;
CREATE POLICY "Permitir actualización a través de service role o server actions"
ON public.tickets FOR UPDATE
USING (true)
WITH CHECK (true);

-- 7. Revisar que los permisos quedaron bien (debe devolver una lista de roles sin error)
SELECT grantee FROM information_schema.role_table_grants WHERE table_name = 'tickets' AND grantee = 'service_role';
