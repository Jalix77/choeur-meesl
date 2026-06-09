-- ============================================================
-- MEESL Chœur de Louange — Audio upload migration
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add new columns to song_files
ALTER TABLE public.song_files
  ADD COLUMN IF NOT EXISTS file_name   text,
  ADD COLUMN IF NOT EXISTS mime_type   text,
  ADD COLUMN IF NOT EXISTS size_bytes  bigint,
  ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Enable RLS on song_files (idempotent)
ALTER TABLE public.song_files ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for song_files
--    Drop first so re-running is safe
DROP POLICY IF EXISTS "sf_select" ON public.song_files;
DROP POLICY IF EXISTS "sf_insert" ON public.song_files;
DROP POLICY IF EXISTS "sf_update" ON public.song_files;
DROP POLICY IF EXISTS "sf_delete" ON public.song_files;

CREATE POLICY "sf_select" ON public.song_files
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "sf_insert" ON public.song_files
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "sf_delete" ON public.song_files
  FOR DELETE USING (public.is_admin());

-- 4. Create the song-audios storage bucket (50 MB limit, audio types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'song-audios',
  'song-audios',
  false,
  52428800,   -- 50 MB in bytes
  ARRAY[
    'audio/mpeg',       -- .mp3
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp4',        -- .m4a
    'audio/m4a',
    'audio/x-m4a',
    'audio/ogg',        -- .ogg
    'audio/webm'        -- .webm
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Storage policies for song-audios bucket
DROP POLICY IF EXISTS "audio_select" ON storage.objects;
DROP POLICY IF EXISTS "audio_insert" ON storage.objects;
DROP POLICY IF EXISTS "audio_delete" ON storage.objects;

-- Any authenticated active member can read (stream / download)
CREATE POLICY "audio_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'song-audios'
    AND auth.role() = 'authenticated'
  );

-- Only admins can upload
CREATE POLICY "audio_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'song-audios'
    AND public.is_admin()
  );

-- Only admins can delete
CREATE POLICY "audio_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'song-audios'
    AND public.is_admin()
  );
