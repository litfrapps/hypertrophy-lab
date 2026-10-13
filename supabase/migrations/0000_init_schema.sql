-- =====================================================
-- Supabase Schema Migration: Initial Schema
-- File: supabase/migrations/0000_init_schema.sql
-- =====================================================

-- 1. Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- 2. Helper function to extract Clerk User ID from JWT
create or replace function public.requesting_user_id()
returns text
language sql stable
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    (current_setting('request.jwt.claim.sub', true))
  );
$$;

-- 3. Table: workout_sessions
create table if not exists public.workout_sessions (
  id                uuid primary key,
  user_id           text not null,
  date              timestamptz not null,
  duration_seconds  integer,
  notes             text,
  created_at        timestamptz default now()
);

create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_date on public.workout_sessions(date desc);
alter table public.workout_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.workout_sessions
  for all
  using (
    (select auth.role()) = 'service_role' or user_id = (select public.requesting_user_id())
  )
  with check (
    (select auth.role()) = 'service_role' or user_id = (select public.requesting_user_id())
  );

-- 4. Table: workout_logs
create table if not exists public.workout_logs (
  id              uuid primary key,
  session_id      uuid references public.workout_sessions(id) on delete cascade,
  user_id         text not null,
  date            timestamptz not null,
  exercise_id     text not null,
  exercise_name   text not null,
  unit            text not null default 'kg',
  notes           text,
  created_at      timestamptz default now()
);

create index if not exists idx_workout_logs_session_id on public.workout_logs(session_id);
create index if not exists idx_workout_logs_user_id on public.workout_logs(user_id);
create index if not exists idx_workout_logs_exercise_id on public.workout_logs(exercise_id);
create index if not exists idx_workout_logs_date on public.workout_logs(date desc);
alter table public.workout_logs enable row level security;

create policy "Users can manage their own logs"
  on public.workout_logs
  for all
  using (
    (select auth.role()) = 'service_role' or user_id = (select public.requesting_user_id())
  )
  with check (
    (select auth.role()) = 'service_role' or user_id = (select public.requesting_user_id())
  );

-- 5. Table: workout_sets
create table if not exists public.workout_sets (
  id          bigserial primary key,
  log_id      uuid not null references public.workout_logs(id) on delete cascade,
  set_number  integer not null,
  reps        integer not null,
  weight      numeric not null
);

create index if not exists idx_workout_sets_log_id on public.workout_sets(log_id);
alter table public.workout_sets enable row level security;

create policy "Users can manage their own sets"
  on public.workout_sets
  for all
  using (
    (select auth.role()) = 'service_role' or
    exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = (select public.requesting_user_id())
    )
  )
  with check (
    (select auth.role()) = 'service_role' or
    exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = (select public.requesting_user_id())
    )
  );

-- 6. Table: routines
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  exercises   jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_routines_user_id on public.routines(user_id);
create index if not exists idx_routines_created_at on public.routines(created_at desc);
alter table public.routines enable row level security;

create policy "Users can manage their own routines"
  on public.routines
  for all
  using (
    (select auth.role()) = 'service_role' or
    user_id = (select public.requesting_user_id())
  )
  with check (
    (select auth.role()) = 'service_role' or
    user_id = (select public.requesting_user_id())
  );

-- 7. Table: user_settings
create table if not exists public.user_settings (
  user_id         text primary key,
  preferred_unit  text not null default 'kg',
  updated_at      timestamptz default now()
);

create index if not exists idx_user_settings_user_id on public.user_settings(user_id);
alter table public.user_settings enable row level security;

create policy "Users can manage their own settings"
  on public.user_settings
  for all
  using (
    (select auth.role()) = 'service_role' or
    user_id = (select public.requesting_user_id())
  )
  with check (
    (select auth.role()) = 'service_role' or
    user_id = (select public.requesting_user_id())
  );
