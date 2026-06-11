-- ============================================================
-- AVATAR URL MEMBRES — Chœur de Louange MEESL
-- Exécuter dans Supabase SQL Editor
-- Le bucket "member-photos" doit déjà exister et être public.
-- ============================================================

-- 1. Ajouter avatar_url sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Storage policies sur le bucket member-photos existant
--    (DROP IF EXISTS pour pouvoir re-exécuter sans erreur)

-- Lecture publique — pour afficher dans les cartes partagées et le PNG
DROP POLICY IF EXISTS "member_photos_public_read"  ON storage.objects;
CREATE POLICY "member_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

-- Upload (INSERT) — admin ou leader seulement
DROP POLICY IF EXISTS "member_photos_upload" ON storage.objects;
CREATE POLICY "member_photos_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );

-- Mise à jour (UPDATE) — admin ou leader seulement
DROP POLICY IF EXISTS "member_photos_update" ON storage.objects;
CREATE POLICY "member_photos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );

-- Suppression (DELETE) — admin ou leader seulement
DROP POLICY IF EXISTS "member_photos_delete" ON storage.objects;
CREATE POLICY "member_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );
