-- ============================================================
-- MEESL Chœur de Louange — Liens YouTube pour les chants
-- Ajoute le kind 'youtube' à song_files (aucune donnée existante
-- n'est modifiée ; storage_path reste utilisé pour audio/playback/sheet)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. storage_path n'est plus obligatoire (les liens YouTube n'ont pas de fichier storage)
ALTER TABLE public.song_files
  ALTER COLUMN storage_path DROP NOT NULL;

-- 2. Nouvelle colonne pour l'URL YouTube
ALTER TABLE public.song_files
  ADD COLUMN IF NOT EXISTS video_url text;

-- 3. Élargit la contrainte kind pour accepter 'youtube'
ALTER TABLE public.song_files DROP CONSTRAINT IF EXISTS song_files_kind_check;
ALTER TABLE public.song_files
  ADD CONSTRAINT song_files_kind_check
  CHECK (kind IN ('audio', 'playback', 'sheet', 'youtube'));

-- 4. Garantit la cohérence des données selon le type
ALTER TABLE public.song_files DROP CONSTRAINT IF EXISTS song_files_payload_check;
ALTER TABLE public.song_files
  ADD CONSTRAINT song_files_payload_check
  CHECK (
    (kind = 'youtube' AND video_url IS NOT NULL)
    OR (kind <> 'youtube' AND storage_path IS NOT NULL)
  );

-- Les policies RLS existantes (sf_select / sf_insert / sf_update / sf_delete
-- dans supabase-audio-fix.sql) sont génériques sur la table et couvrent
-- déjà le kind 'youtube' — aucun changement nécessaire.
