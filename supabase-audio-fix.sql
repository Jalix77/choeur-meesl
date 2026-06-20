-- ============================================================
-- MEESL Chœur de Louange — Audio RLS fix
-- Corrige : Leaders exclus des uploads (seul is_admin() utilisé)
-- Ajoute   : UPDATE policy, limit 20 MB, types restreints
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────

-- Crée (ou recrée) une fonction is_admin_or_leader()
CREATE OR REPLACE FUNCTION public.is_admin_or_leader()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'leader')
      AND active = true
  );
$$;

-- ── Table song_files — RLS ────────────────────────────────────

ALTER TABLE public.song_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sf_select"  ON public.song_files;
DROP POLICY IF EXISTS "sf_insert"  ON public.song_files;
DROP POLICY IF EXISTS "sf_update"  ON public.song_files;
DROP POLICY IF EXISTS "sf_delete"  ON public.song_files;

-- SELECT : tout membre connecté actif
CREATE POLICY "sf_select" ON public.song_files
  FOR SELECT
  USING (public.is_active_member());

-- INSERT : admin OU leader
CREATE POLICY "sf_insert" ON public.song_files
  FOR INSERT
  WITH CHECK (public.is_admin_or_leader());

-- UPDATE : admin OU leader
CREATE POLICY "sf_update" ON public.song_files
  FOR UPDATE
  USING  (public.is_admin_or_leader())
  WITH CHECK (public.is_admin_or_leader());

-- DELETE : admin OU leader
CREATE POLICY "sf_delete" ON public.song_files
  FOR DELETE
  USING (public.is_admin_or_leader());

-- ── Bucket song-audios — mise à jour ─────────────────────────
-- Limite 20 MB, types audio courants uniquement

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-audios',
  'song-audios',
  false,
  20971520,   -- 20 MB
  ARRAY[
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/x-m4a',
    'audio/mp4',
    'audio/m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Storage policies ──────────────────────────────────────────

-- Supprime les anciennes policies génériques qui pourraient entrer en conflit
DROP POLICY IF EXISTS "audio_select" ON storage.objects;
DROP POLICY IF EXISTS "audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "audio_update" ON storage.objects;
DROP POLICY IF EXISTS "audio_delete" ON storage.objects;

-- SELECT : tout membre connecté peut lire / streamer
CREATE POLICY "audio_select" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'song-audios'
    AND auth.role() = 'authenticated'
  );

-- INSERT : admin OU leader
CREATE POLICY "audio_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'song-audios'
    AND public.is_admin_or_leader()
  );

-- UPDATE (remplacement) : admin OU leader
CREATE POLICY "audio_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'song-audios'
    AND public.is_admin_or_leader()
  );

-- DELETE : admin OU leader
CREATE POLICY "audio_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'song-audios'
    AND public.is_admin_or_leader()
  );
