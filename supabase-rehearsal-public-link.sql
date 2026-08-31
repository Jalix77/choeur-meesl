-- ============================================================
-- MEESL Chœur de Louange — Lien public de la programmation du culte
-- (accès en lecture seule, sans compte, pour les invités externes)
-- Idempotent — sûr à ré-exécuter
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS public_token uuid UNIQUE DEFAULT gen_random_uuid();

ALTER TABLE public.rehearsals
  ADD COLUMN IF NOT EXISTS public_access_enabled boolean NOT NULL DEFAULT false;

-- Aucune policy RLS anonyme n'est ajoutée : la page publique
-- /public/programme/[token] est un composant serveur qui utilise le
-- client Supabase "service role" (src/lib/supabase/admin.ts, jamais
-- exposé au navigateur) pour vérifier public_access_enabled = true
-- avant de renvoyer les champs nécessaires à l'affichage. La table
-- rehearsals (et service_program_items) reste protégée par ses
-- policies RLS existantes pour tout accès authentifié normal.
