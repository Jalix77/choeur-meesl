-- ============================================================
-- announcement_recipients — destinataires WA des annonces
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id  uuid        NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  profile_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel          text        NOT NULL DEFAULT 'whatsapp',
  status           text        NOT NULL DEFAULT 'pending',   -- 'pending' | 'sent'
  sent_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, profile_id, channel)
);

-- Index pour requêtes par annonce
CREATE INDEX IF NOT EXISTS idx_ann_recipients_announcement
  ON public.announcement_recipients(announcement_id);

-- RLS
ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Admins et leaders : accès complet
CREATE POLICY "ar_admin_leader_all" ON public.announcement_recipients
  FOR ALL
  USING (public.is_admin_or_leader())
  WITH CHECK (public.is_admin_or_leader());

-- Membres actifs : lecture de leurs propres enregistrements
CREATE POLICY "ar_member_read_own" ON public.announcement_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.active = true
    )
    AND profile_id = auth.uid()
  );

-- Commentaire
COMMENT ON TABLE public.announcement_recipients IS
  'Destinataires WhatsApp des annonces du Chœur de Louange MEESL';
