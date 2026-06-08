-- ============================================================
-- MEESL Choeur de Louange - Schema SQL
-- A executer dans Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Profiles ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  role         text not null default 'member' check (role in ('admin', 'member')),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Songs ──────────────────────────────────────────────────────
create table if not exists public.songs (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  key_signature  text,
  tempo          integer,
  time_signature text,
  author         text,
  notation       text not null default 'latin' check (notation in ('latin', 'anglo')),
  body           text not null default '',
  notes          text,
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Song Files ─────────────────────────────────────────────────
create table if not exists public.song_files (
  id            uuid primary key default gen_random_uuid(),
  song_id       uuid not null references public.songs(id) on delete cascade,
  label         text not null,
  kind          text not null default 'audio' check (kind in ('audio', 'playback', 'sheet')),
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ── Rehearsals ─────────────────────────────────────────────────
create table if not exists public.rehearsals (
  id          uuid primary key default gen_random_uuid(),
  starts_at   timestamptz not null,
  location    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Rehearsal Songs ────────────────────────────────────────────
create table if not exists public.rehearsal_songs (
  id            uuid primary key default gen_random_uuid(),
  rehearsal_id  uuid not null references public.rehearsals(id) on delete cascade,
  song_id       uuid not null references public.songs(id) on delete cascade,
  order_index   integer not null default 0
);

-- ── Announcements ──────────────────────────────────────────────
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  pinned      boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.songs         enable row level security;
alter table public.song_files    enable row level security;
alter table public.rehearsals    enable row level security;
alter table public.rehearsal_songs enable row level security;
alter table public.announcements enable row level security;

-- Helper: is current user an active member?
create or replace function public.is_active_member()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

-- Helper: is current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- Profiles: read = self or admin; write = admin
create policy "profiles_select" on public.profiles for select using (public.is_active_member());
create policy "profiles_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update using (public.is_admin());
create policy "profiles_delete" on public.profiles for delete using (public.is_admin());

-- Songs: read = active member; write = admin
create policy "songs_select"  on public.songs for select using (public.is_active_member());
create policy "songs_insert"  on public.songs for insert with check (public.is_admin());
create policy "songs_update"  on public.songs for update using (public.is_admin());
create policy "songs_delete"  on public.songs for delete using (public.is_admin());

-- Song files
create policy "song_files_select" on public.song_files for select using (public.is_active_member());
create policy "song_files_insert" on public.song_files for insert with check (public.is_admin());
create policy "song_files_delete" on public.song_files for delete using (public.is_admin());

-- Rehearsals
create policy "rehearsals_select" on public.rehearsals for select using (public.is_active_member());
create policy "rehearsals_insert" on public.rehearsals for insert with check (public.is_admin());
create policy "rehearsals_update" on public.rehearsals for update using (public.is_admin());
create policy "rehearsals_delete" on public.rehearsals for delete using (public.is_admin());

-- Rehearsal songs
create policy "rehearsal_songs_select" on public.rehearsal_songs for select using (public.is_active_member());
create policy "rehearsal_songs_insert" on public.rehearsal_songs for insert with check (public.is_admin());
create policy "rehearsal_songs_delete" on public.rehearsal_songs for delete using (public.is_admin());

-- Announcements
create policy "announcements_select" on public.announcements for select using (public.is_active_member());
create policy "announcements_insert" on public.announcements for insert with check (public.is_admin());
create policy "announcements_update" on public.announcements for update using (public.is_admin());
create policy "announcements_delete" on public.announcements for delete using (public.is_admin());

-- ── Storage bucket ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "media_select" on storage.objects for select
  using (bucket_id = 'media' and public.is_active_member());
create policy "media_insert" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());
create policy "media_delete" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
