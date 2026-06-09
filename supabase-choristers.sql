-- ============================================================
-- MEESL – Mise à jour Planning : choristes en service
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter colonnes manquantes à rehearsals
ALTER TABLE rehearsals
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS notify_selected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Ajouter phone aux profiles si absent
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone text;

-- 3. Table rehearsal_choristers
CREATE TABLE IF NOT EXISTS public.rehearsal_choristers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rehearsal_id     uuid NOT NULL REFERENCES public.rehearsals(id) ON DELETE CASCADE,
  profile_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocal_role       text NOT NULL DEFAULT 'Autre',
  notified_email   boolean NOT NULL DEFAULT false,
  notified_whatsapp boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rehearsal_id, profile_id)
);

-- 4. RLS sur rehearsal_choristers
ALTER TABLE rehearsal_choristers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rc_select" ON rehearsal_choristers
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "rc_insert" ON rehearsal_choristers
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "rc_update" ON rehearsal_choristers
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "rc_delete" ON rehearsal_choristers
  FOR DELETE USING (public.is_admin());
