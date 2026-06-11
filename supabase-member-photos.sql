-- ============================================================
-- PHOTOS DE PROFIL MEMBRES — Chœur de Louange MEESL
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter photo_url sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Créer le bucket member-photos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-photos',
  'member-photos',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp'];

-- 3. Storage policies

-- Lecture publique (pour afficher dans les cartes partagées)
DROP POLICY IF EXISTS "member_photos_public_read" ON storage.objects;
CREATE POLICY "member_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

-- Upload / update : admin ou leader seulement
DROP POLICY IF EXISTS "member_photos_upload" ON storage.objects;
CREATE POLICY "member_photos_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );

DROP POLICY IF EXISTS "member_photos_update" ON storage.objects;
CREATE POLICY "member_photos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );

DROP POLICY IF EXISTS "member_photos_delete" ON storage.objects;
CREATE POLICY "member_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'member-photos'
    AND public.is_admin_or_leader()
  );
