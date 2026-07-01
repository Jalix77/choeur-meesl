-- ============================================================
-- MEESL Chœur de Louange — Suppression des chants
-- Confirme les policies RLS DELETE (admin OU leader) sur songs,
-- song_files et rehearsal_songs. Idempotent — sûr à ré-exécuter
-- même si supabase-leader-role.sql / supabase-audio-fix.sql
-- ont déjà été appliqués.
-- Run in Supabase SQL Editor
-- ============================================================

-- Garantit que is_admin_or_leader() existe (au cas où)
CREATE OR REPLACE FUNCTION public.is_admin_or_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'leader') AND active = true
  );
$$;

-- ── songs ────────────────────────────────────────────────────
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "songs_delete" ON public.songs;
CREATE POLICY "songs_delete" ON public.songs
  FOR DELETE USING (public.is_admin_or_leader());

-- ── song_files ───────────────────────────────────────────────
-- (les lignes sont de toute façon supprimées en cascade quand le
--  chant parent est supprimé, mais la policy doit exister pour
--  autoriser la suppression manuelle des fichiers depuis l'app)
ALTER TABLE public.song_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "song_files_delete" ON public.song_files;
DROP POLICY IF EXISTS "sf_delete" ON public.song_files;
CREATE POLICY "sf_delete" ON public.song_files
  FOR DELETE USING (public.is_admin_or_leader());

-- ── rehearsal_songs ──────────────────────────────────────────
ALTER TABLE public.rehearsal_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rehearsal_songs_delete" ON public.rehearsal_songs;
CREATE POLICY "rehearsal_songs_delete" ON public.rehearsal_songs
  FOR DELETE USING (public.is_admin_or_leader());

-- ── Storage (audio / partitions liées aux chants) ────────────
-- Nécessaire pour que le client puisse nettoyer les fichiers
-- storage avant de supprimer le chant.
DROP POLICY IF EXISTS "media_delete" ON storage.objects;
CREATE POLICY "media_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND public.is_admin_or_leader());

DROP POLICY IF EXISTS "audio_delete" ON storage.objects;
CREATE POLICY "audio_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'song-audios' AND public.is_admin_or_leader());
