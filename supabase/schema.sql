-- =====================================================
-- Hypertrophy Lab — Supabase Database Schema
-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- =====================================================

-- 1. Enable pgcrypto for UUID generation (if not already enabled)
create extension if not exists "pgcrypto";

-- 2. Helper function to extract Clerk User ID from JWT (used for RLS)
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    (current_setting('request.jwt.claim.sub', true))
  );
$$;

-- ─────────────────────────────────────────────────────
-- Table: workout_sessions
-- ─────────────────────────────────────────────────────
create table if not exists public.workout_sessions (
  id                uuid primary key,
  user_id           text not null,                 -- Clerk user ID (e.g. "user_2...")
  date              timestamptz not null,
  duration_seconds  integer,
  notes             text,
  created_at        timestamptz default now()
);

-- Indexes for workout_sessions
create index if not exists idx_workout_sessions_user_id on public.workout_sessions(user_id);
create index if not exists idx_workout_sessions_date on public.workout_sessions(date desc);

-- RLS for workout_sessions
alter table public.workout_sessions enable row level security;

drop policy if exists "Users can manage their own sessions" on public.workout_sessions;
create policy "Users can manage their own sessions"
  on public.workout_sessions
  for all
  using (
    auth.role() = 'service_role' or user_id = requesting_user_id()
  )
  with check (
    auth.role() = 'service_role' or user_id = requesting_user_id()
  );

-- ─────────────────────────────────────────────────────
-- Table: workout_logs
-- ─────────────────────────────────────────────────────
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

-- Indexes for workout_logs
create index if not exists idx_workout_logs_session_id on public.workout_logs(session_id);
create index if not exists idx_workout_logs_user_id on public.workout_logs(user_id);
create index if not exists idx_workout_logs_exercise_id on public.workout_logs(exercise_id);
create index if not exists idx_workout_logs_date on public.workout_logs(date desc);

-- RLS for workout_logs
alter table public.workout_logs enable row level security;

drop policy if exists "Users can manage their own logs" on public.workout_logs;
create policy "Users can manage their own logs"
  on public.workout_logs
  for all
  using (
    auth.role() = 'service_role' or user_id = requesting_user_id()
  )
  with check (
    auth.role() = 'service_role' or user_id = requesting_user_id()
  );

-- ─────────────────────────────────────────────────────
-- Table: workout_sets
-- ─────────────────────────────────────────────────────
create table if not exists public.workout_sets (
  id          bigserial primary key,
  log_id      uuid not null references public.workout_logs(id) on delete cascade,
  set_number  integer not null,
  reps        integer not null,
  weight      numeric not null
);

-- Index for workout_sets
create index if not exists idx_workout_sets_log_id on public.workout_sets(log_id);

-- RLS for workout_sets
alter table public.workout_sets enable row level security;

drop policy if exists "Users can manage their own sets" on public.workout_sets;
create policy "Users can manage their own sets"
  on public.workout_sets
  for all
  using (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = requesting_user_id()
    )
  )
  with check (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = requesting_user_id()
    )
  );
