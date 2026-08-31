-- ============================================================
-- MEESL Chœur de Louange — Programmation du culte
-- (fiche technique : appel à l'adoration, introduction, prières,
--  lectures, prédication, etc. avec responsable assigné)
-- Run in Supabase SQL Editor
-- ============================================================

-- Garantit que is_admin_or_leader() / is_active_member() existent (au cas où)
CREATE OR REPLACE FUNCTION public.is_admin_or_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'leader') AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND active = true
  );
$$;

-- ── Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.service_program_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rehearsal_id      uuid NOT NULL REFERENCES public.rehearsals(id) ON DELETE CASCADE,
  order_index       integer NOT NULL DEFAULT 0,
  item_type         text NOT NULL DEFAULT 'custom',
  label             text NOT NULL,
  profile_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  external_name     text,
  note              text,
  notified_email    boolean NOT NULL DEFAULT false,
  notified_whatsapp boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_program_items_assignee_check
    CHECK (profile_id IS NULL OR external_name IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_service_program_items_rehearsal
  ON public.service_program_items(rehearsal_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE public.service_program_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "spi_select" ON public.service_program_items;
DROP POLICY IF EXISTS "spi_insert" ON public.service_program_items;
DROP POLICY IF EXISTS "spi_update" ON public.service_program_items;
DROP POLICY IF EXISTS "spi_delete" ON public.service_program_items;

-- SELECT : tout membre actif (consultation planning + fiche technique)
CREATE POLICY "spi_select" ON public.service_program_items
  FOR SELECT USING (public.is_active_member());

-- INSERT / UPDATE / DELETE : admin OU leader
CREATE POLICY "spi_insert" ON public.service_program_items
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "spi_update" ON public.service_program_items
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "spi_delete" ON public.service_program_items
  FOR DELETE USING (public.is_admin_or_leader());
