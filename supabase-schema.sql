-- ================================================================
-- MEESL Chœur de Louange — Schéma Supabase
-- Exécuter dans : Supabase > SQL Editor
-- ================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Songs ────────────────────────────────────────────────────────
create table public.songs (
  id             uuid primary key default uuid_generate_v4(),
  title          text not null,
  key_signature  text,
  tempo          integer,
  time_signature text,
  author         text,
  notation       text not null default 'latin' check (notation in ('latin', 'anglo')),
  body           text not null default '',
  notes          text,
  created_by     uuid references auth.users on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Song files ───────────────────────────────────────────────────
create table public.song_files (
  id            uuid primary key default uuid_generate_v4(),
  song_id       uuid not null references public.songs on delete cascade,
  label         text not null,
  kind          text not null default 'audio' check (kind in ('audio', 'playback', 'sheet')),
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

-- ── Rehearsals ───────────────────────────────────────────────────
create table public.rehearsals (
  id          uuid primary key default uuid_generate_v4(),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Rehearsal songs ──────────────────────────────────────────────
create table public.rehearsal_songs (
  id            uuid primary key default uuid_generate_v4(),
  rehearsal_id  uuid not null references public.rehearsals on delete cascade,
  song_id       uuid not null references public.songs on delete cascade,
  order_index   integer not null default 0,
  unique (rehearsal_id, song_id)
);

-- ── Announcements ────────────────────────────────────────────────
create table public.announcements (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  content     text not null,
  pinned      boolean not null default false,
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ================================================================
-- Row Level Security
-- ================================================================

alter table public.profiles      enable row level security;
alter table public.songs         enable row level security;
alter table public.song_files    enable row level security;
alter table public.rehearsals    enable row level security;
alter table public.rehearsal_songs enable row level security;
alter table public.announcements enable row level security;

-- Helper: is caller an active member?
create or replace function public.is_active_member()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

-- Helper: is caller an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- Profiles
create policy "Members read own profile"   on public.profiles for select using (id = auth.uid());
create policy "Admins read all profiles"   on public.profiles for select using (public.is_admin());
create policy "Admins update profiles"     on public.profiles for update using (public.is_admin());

-- Songs
create policy "Active members read songs"  on public.songs for select using (public.is_active_member());
create policy "Admins insert songs"        on public.songs for insert with check (public.is_admin());
create policy "Admins update songs"        on public.songs for update using (public.is_admin());
create policy "Admins delete songs"        on public.songs for delete using (public.is_admin());

-- Song files
create policy "Active members read song_files"  on public.song_files for select using (public.is_active_member());
create policy "Admins insert song_files"        on public.song_files for insert with check (public.is_admin());
create policy "Admins delete song_files"        on public.song_files for delete using (public.is_admin());

-- Rehearsals
create policy "Active members read rehearsals"  on public.rehearsals for select using (public.is_active_member());
create policy "Admins insert rehearsals"        on public.rehearsals for insert with check (public.is_admin());
create policy "Admins update rehearsals"        on public.rehearsals for update using (public.is_admin());
create policy "Admins delete rehearsals"        on public.rehearsals for delete using (public.is_admin());

-- Rehearsal songs
create policy "Active members read rehearsal_songs"  on public.rehearsal_songs for select using (public.is_active_member());
create policy "Admins insert rehearsal_songs"        on public.rehearsal_songs for insert with check (public.is_admin());
create policy "Admins delete rehearsal_songs"        on public.rehearsal_songs for delete using (public.is_admin());

-- Announcements
create policy "Active members read announcements"  on public.announcements for select using (public.is_active_member());
create policy "Admins insert announcements"        on public.announcements for insert with check (public.is_admin());
create policy "Admins update announcements"        on public.announcements for update using (public.is_admin());
create policy "Admins delete announcements"        on public.announcements for delete using (public.is_admin());

-- ================================================================
-- Storage bucket: media (privé)
-- ================================================================
-- Exécuter aussi dans Storage > New bucket: name="media", Public=OFF

insert into storage.buckets (id, name, public) values ('media', 'media', false)
  on conflict (id) do nothing;

create policy "Active members read media"
  on storage.objects for select
  using (bucket_id = 'media' and public.is_active_member());

create policy "Admins upload media"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins delete media"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
