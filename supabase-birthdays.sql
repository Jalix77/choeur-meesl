-- ============================================================
-- MODULE ANNIVERSAIRES — Chœur de Louange MEESL
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter date_naissance sur profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_naissance DATE;

-- 2. Table historique des notifications anniversaires
CREATE TABLE IF NOT EXISTS public.birthday_notifications (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year             integer     NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  card_generated   boolean     NOT NULL DEFAULT false,
  email_sent       boolean     NOT NULL DEFAULT false,
  whatsapp_shared  boolean     NOT NULL DEFAULT false,
  notified_at      timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(profile_id, year)
);

ALTER TABLE public.birthday_notifications ENABLE ROW LEVEL SECURITY;

-- Membres actifs peuvent lire l'historique
CREATE POLICY "bn_select" ON public.birthday_notifications
  FOR SELECT USING (public.is_active_member());

-- Seuls les admins peuvent créer/modifier
CREATE POLICY "bn_insert" ON public.birthday_notifications
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "bn_update" ON public.birthday_notifications
  FOR UPDATE USING (public.is_admin());

-- 3. Index pour les recherches par mois/jour
CREATE INDEX IF NOT EXISTS idx_profiles_birthday
  ON public.profiles (
    EXTRACT(MONTH FROM date_naissance),
    EXTRACT(DAY FROM date_naissance)
  )
  WHERE date_naissance IS NOT NULL;
