-- =====================================================
-- Supabase Schema Migration: Initial Schema
-- File: supabase/migrations/0000_init_schema.sql
-- =====================================================
-- This migration creates the public.workout_logs table with
-- JSONB sets, composite performance indexing, and Row Level Security.

-- 0. Enable pgcrypto for UUID generation
create extension if not exists "pgcrypto";

-- 1. Table: public.workout_logs
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  exercise_name text not null,
  sets jsonb not null,
  routine_name text,
  created_at timestamptz default now()
);

comment on table public.workout_logs is 'Workout logs tracking exercises, JSONB sets, and routines.';

-- 2. Performance Indexing
create index if not exists idx_workout_logs_user_exercise on public.workout_logs (user_id, exercise_name);

-- 3. Row Level Security (RLS)
alter table public.workout_logs enable row level security;

-- SELECT policy: restricted to authenticated users
drop policy if exists "Allow authenticated users to select workout logs" on public.workout_logs;
create policy "Allow authenticated users to select workout logs"
  on public.workout_logs
  for select
  to authenticated
  using (auth.uid()::text = user_id or auth.role() = 'authenticated');

-- INSERT policy: restricted to authenticated users
drop policy if exists "Allow authenticated users to insert workout logs" on public.workout_logs;
create policy "Allow authenticated users to insert workout logs"
  on public.workout_logs
  for insert
  to authenticated
  with check (auth.uid()::text = user_id or auth.role() = 'authenticated');
