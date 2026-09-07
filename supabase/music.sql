-- ==============================================================================
-- SCHEMA PARA SUPABASE STORAGE: PLAYLIST / REPRODUCTOR DEL EVENTO
-- ==============================================================================
-- Crea un bucket público 'music' donde se guardan las canciones (.mp3) y sus
-- portadas (.jpg/.png/.webp). El reproductor de la web las lee como playlist.
-- La carga/borrado lo hace la app con la secret key (service_role), que ignora RLS.
-- ==============================================================================

-- 1. Crear el bucket público si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('music', 'music', true)
ON CONFLICT (id) DO NOTHING;

-- 2. (Opcional) Políticas para que la anon key pueda LISTAR objectos (por si algún día
--    se lista desde el navegador). La app lista desde el servidor con service_role,
--    así que esto es solo por robustez.
DROP POLICY IF EXISTS "Permitir listar musica publica" ON storage.objects;
CREATE POLICY "Permitir listar musica publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

-- 3. Revisar el bucket (debe devolver el bucket 'music' público)
SELECT name, public FROM storage.buckets WHERE id = 'music';