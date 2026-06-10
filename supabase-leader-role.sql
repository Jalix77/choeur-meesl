-- ============================================================
-- RÔLE LEADER — Chœur de Louange MEESL
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Ajouter 'leader' à l'enum user_role (si c'est un enum)
--    Si votre colonne profiles.role est de type TEXT avec un CHECK,
--    utilisez la section 1b ci-dessous à la place.

-- ── 1a. Si role est un TYPE ENUM ─────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Ajouter la valeur si elle n'existe pas encore
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'leader'
    ) THEN
      ALTER TYPE user_role ADD VALUE 'leader' AFTER 'member';
    END IF;
  END IF;
END $$;

-- ── 1b. Si role est TEXT avec CHECK constraint ────────────────
-- Met à jour la contrainte pour accepter 'leader'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%role%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('member', 'leader', 'admin'));
  END IF;
END $$;


-- ============================================================
-- 2. Fonctions SECURITY DEFINER pour les checks de rôle
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'leader' AND active = true
  );
$$;

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


-- ============================================================
-- 3. Policies SONGS
-- ============================================================

DROP POLICY IF EXISTS "songs_select"  ON public.songs;
DROP POLICY IF EXISTS "songs_insert"  ON public.songs;
DROP POLICY IF EXISTS "songs_update"  ON public.songs;
DROP POLICY IF EXISTS "songs_delete"  ON public.songs;

CREATE POLICY "songs_select" ON public.songs
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "songs_insert" ON public.songs
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "songs_update" ON public.songs
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "songs_delete" ON public.songs
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 4. Policies SONG_FILES
-- ============================================================

DROP POLICY IF EXISTS "song_files_select" ON public.song_files;
DROP POLICY IF EXISTS "song_files_insert" ON public.song_files;
DROP POLICY IF EXISTS "song_files_update" ON public.song_files;
DROP POLICY IF EXISTS "song_files_delete" ON public.song_files;

CREATE POLICY "song_files_select" ON public.song_files
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "song_files_insert" ON public.song_files
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "song_files_update" ON public.song_files
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "song_files_delete" ON public.song_files
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 5. Policies REHEARSALS
-- ============================================================

DROP POLICY IF EXISTS "rehearsals_select" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_insert" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_update" ON public.rehearsals;
DROP POLICY IF EXISTS "rehearsals_delete" ON public.rehearsals;

CREATE POLICY "rehearsals_select" ON public.rehearsals
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "rehearsals_insert" ON public.rehearsals
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "rehearsals_update" ON public.rehearsals
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "rehearsals_delete" ON public.rehearsals
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 6. Policies REHEARSAL_SONGS
-- ============================================================

DROP POLICY IF EXISTS "rehearsal_songs_select" ON public.rehearsal_songs;
DROP POLICY IF EXISTS "rehearsal_songs_insert" ON public.rehearsal_songs;
DROP POLICY IF EXISTS "rehearsal_songs_update" ON public.rehearsal_songs;
DROP POLICY IF EXISTS "rehearsal_songs_delete" ON public.rehearsal_songs;

CREATE POLICY "rehearsal_songs_select" ON public.rehearsal_songs
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "rehearsal_songs_insert" ON public.rehearsal_songs
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "rehearsal_songs_update" ON public.rehearsal_songs
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "rehearsal_songs_delete" ON public.rehearsal_songs
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 7. Policies REHEARSAL_CHORISTERS
-- ============================================================

DROP POLICY IF EXISTS "rc_select" ON public.rehearsal_choristers;
DROP POLICY IF EXISTS "rc_insert" ON public.rehearsal_choristers;
DROP POLICY IF EXISTS "rc_update" ON public.rehearsal_choristers;
DROP POLICY IF EXISTS "rc_delete" ON public.rehearsal_choristers;

CREATE POLICY "rc_select" ON public.rehearsal_choristers
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "rc_insert" ON public.rehearsal_choristers
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "rc_update" ON public.rehearsal_choristers
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "rc_delete" ON public.rehearsal_choristers
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 8. Policies ANNOUNCEMENTS
-- ============================================================

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete" ON public.announcements;

CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE USING (public.is_admin_or_leader());

CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE USING (public.is_admin_or_leader());


-- ============================================================
-- 9. Policies PROFILES
--    - SELECT : tous les membres actifs
--    - UPDATE : admin (tout) ou leader (phone + date_naissance seulement — géré côté API)
--    - INSERT/DELETE : admin seulement
-- ============================================================

DROP POLICY IF EXISTS "profiles_select"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert"  ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (public.is_active_member());

-- Le leader peut mettre à jour (les champs sont filtrés côté API)
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (public.is_admin_or_leader());

-- Seul l'admin peut voir les comptes inactifs et insérer (via service role)
-- INSERT is done via service role (admin client) — no user-level INSERT needed


-- ============================================================
-- 10. Policies BIRTHDAY_NOTIFICATIONS
-- ============================================================

DROP POLICY IF EXISTS "bn_select" ON public.birthday_notifications;
DROP POLICY IF EXISTS "bn_insert" ON public.birthday_notifications;
DROP POLICY IF EXISTS "bn_update" ON public.birthday_notifications;

CREATE POLICY "bn_select" ON public.birthday_notifications
  FOR SELECT USING (public.is_active_member());

CREATE POLICY "bn_insert" ON public.birthday_notifications
  FOR INSERT WITH CHECK (public.is_admin_or_leader());

CREATE POLICY "bn_update" ON public.birthday_notifications
  FOR UPDATE USING (public.is_admin_or_leader());
