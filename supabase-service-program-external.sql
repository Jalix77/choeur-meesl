-- ============================================================
-- MEESL Chœur de Louange — Coordonnées des invités externes
-- (programmation du culte : email/téléphone pour notifier un
--  responsable externe qui n'a pas de compte membre)
-- Idempotent — sûr à ré-exécuter
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.service_program_items
  ADD COLUMN IF NOT EXISTS external_email text;

ALTER TABLE public.service_program_items
  ADD COLUMN IF NOT EXISTS external_phone text;

-- Les policies RLS existantes (spi_select / spi_insert / spi_update / spi_delete
-- dans supabase-service-program.sql) sont génériques sur la table et couvrent
-- déjà ces nouvelles colonnes — aucun changement nécessaire.
