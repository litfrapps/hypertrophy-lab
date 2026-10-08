-- =====================================================
-- Muscle Lab — Supabase CLI Migration
-- File: supabase/migrations/0000_init_schema.sql
-- Apply: supabase db push  (or supabase migration up)
-- =====================================================
-- This file is the single source of truth for the database schema.
-- It is idempotent (safe to re-run) and tracked in version control.

-- 0. Extensions
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: extract Clerk user_id from JWT sub claim
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.requesting_user_id()
returns text
language sql stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    current_setting('request.jwt.claim.sub', true)
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: workout_sessions
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.workout_sessions (
  id               uuid        primary key,
  user_id          text        not null,
  date             timestamptz not null,
  duration_seconds integer,
  notes            text,
  created_at       timestamptz default now() not null
);

comment on table public.workout_sessions is 'One row per completed workout session.';
comment on column public.workout_sessions.user_id is 'Clerk user ID (e.g. user_2abc…).';

create index if not exists idx_workout_sessions_user_id on public.workout_sessions (user_id);
create index if not exists idx_workout_sessions_date    on public.workout_sessions (date desc);

alter table public.workout_sessions enable row level security;

drop policy if exists "Users can manage their own sessions" on public.workout_sessions;
create policy "Users can manage their own sessions"
  on public.workout_sessions
  for all
  using  (auth.role() = 'service_role' or user_id = public.requesting_user_id())
  with check (auth.role() = 'service_role' or user_id = public.requesting_user_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: workout_logs
-- One row per exercise within a session.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.workout_logs (
  id            uuid        primary key,
  session_id    uuid        references public.workout_sessions (id) on delete cascade,
  user_id       text        not null,
  date          timestamptz not null,
  exercise_id   text        not null,
  exercise_name text        not null,
  unit          text        not null default 'kg' check (unit in ('kg', 'lbs')),
  notes         text,
  created_at    timestamptz default now() not null
);

comment on table public.workout_logs is 'One row per exercise logged within a session.';

create index if not exists idx_workout_logs_session_id  on public.workout_logs (session_id);
create index if not exists idx_workout_logs_user_id     on public.workout_logs (user_id);
create index if not exists idx_workout_logs_exercise_id on public.workout_logs (exercise_id);
create index if not exists idx_workout_logs_date        on public.workout_logs (date desc);

alter table public.workout_logs enable row level security;

drop policy if exists "Users can manage their own logs" on public.workout_logs;
create policy "Users can manage their own logs"
  on public.workout_logs
  for all
  using  (auth.role() = 'service_role' or user_id = public.requesting_user_id())
  with check (auth.role() = 'service_role' or user_id = public.requesting_user_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: workout_sets
-- One row per set within a workout_log.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.workout_sets (
  id         bigserial   primary key,
  log_id     uuid        not null references public.workout_logs (id) on delete cascade,
  set_number integer     not null check (set_number >= 1),
  reps       integer     not null check (reps >= 0),
  weight     numeric     not null check (weight >= 0),
  unit       text                 check (unit in ('kg', 'lbs')),
  created_at timestamptz default now() not null
);

comment on table public.workout_sets is 'Individual sets belonging to a workout_log entry.';

create index if not exists idx_workout_sets_log_id on public.workout_sets (log_id);

alter table public.workout_sets enable row level security;

drop policy if exists "Users can manage their own sets" on public.workout_sets;
create policy "Users can manage their own sets"
  on public.workout_sets
  for all
  using (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = public.requesting_user_id()
    )
  )
  with check (
    auth.role() = 'service_role'
    or exists (
      select 1 from public.workout_logs l
      where l.id = workout_sets.log_id
        and l.user_id = public.requesting_user_id()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: user_exercises  (future — user-created custom exercises)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_exercises (
  id              uuid        primary key default gen_random_uuid(),
  user_id         text        not null,
  name            text        not null,
  primary_muscle  text        not null,
  secondary_muscle text,
  category        text,
  notes           text,
  created_at      timestamptz default now() not null
);

comment on table public.user_exercises is 'User-defined custom exercises not in the built-in list.';

create index if not exists idx_user_exercises_user_id on public.user_exercises (user_id);

alter table public.user_exercises enable row level security;

drop policy if exists "Users can manage their own exercises" on public.user_exercises;
create policy "Users can manage their own exercises"
  on public.user_exercises
  for all
  using  (auth.role() = 'service_role' or user_id = public.requesting_user_id())
  with check (auth.role() = 'service_role' or user_id = public.requesting_user_id());
