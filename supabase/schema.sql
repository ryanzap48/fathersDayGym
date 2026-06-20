-- =============================================================================
-- Lift — database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) once per project.
-- Idempotent where practical so it can be re-run during development.
-- =============================================================================

-- Enums --------------------------------------------------------------------
do $$ begin
  create type units_pref      as enum ('kg', 'lb');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tracking_type   as enum ('weight_reps', 'bodyweight_reps', 'time', 'distance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type set_type        as enum ('warmup', 'working', 'dropset', 'failure');
exception when duplicate_object then null; end $$;

do $$ begin
  create type goal_type       as enum ('bodyweight', 'one_rep_max', 'frequency', 'volume');
exception when duplicate_object then null; end $$;

-- Profiles -----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text,
  units       units_pref not null default 'lb',
  height_cm   numeric,
  birthdate   date,
  goal_weight numeric,
  created_at  timestamptz not null default now()
);

-- Exercises ----------------------------------------------------------------
-- user_id null => global, seeded exercise readable by everyone.
create table if not exists public.exercises (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users (id) on delete cascade,
  name               text not null,
  primary_muscle     text not null,
  secondary_muscles  text[] not null default '{}',
  equipment          text not null,
  tracking_type      tracking_type not null default 'weight_reps',
  is_custom          boolean not null default false,
  created_at         timestamptz not null default now()
);
create index if not exists exercises_user_id_idx        on public.exercises (user_id);
create index if not exists exercises_primary_muscle_idx on public.exercises (primary_muscle);

-- Routines (reusable templates) --------------------------------------------
create table if not exists public.routines (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists routines_user_id_idx on public.routines (user_id);

create table if not exists public.routine_exercises (
  id           uuid primary key default gen_random_uuid(),
  routine_id   uuid not null references public.routines (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  order_index  int not null default 0,
  target_sets  int,
  target_reps  int
);
create index if not exists routine_exercises_routine_idx on public.routine_exercises (routine_id);

-- Workouts -----------------------------------------------------------------
create table if not exists public.workouts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  notes      text
);
create index if not exists workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table if not exists public.workout_exercises (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid not null references public.workouts (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  order_index  int not null default 0,
  notes        text
);
create index if not exists workout_exercises_workout_idx  on public.workout_exercises (workout_id);
create index if not exists workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

create table if not exists public.sets (
  id                   uuid primary key default gen_random_uuid(),
  workout_exercise_id  uuid not null references public.workout_exercises (id) on delete cascade,
  set_number           int not null default 1,
  weight               numeric,
  reps                 int,
  rpe                  numeric,
  set_type             set_type not null default 'working',
  completed            boolean not null default true,
  created_at           timestamptz not null default now()
);
create index if not exists sets_workout_exercise_idx on public.sets (workout_exercise_id);

-- Body weight check-ins ----------------------------------------------------
create table if not exists public.bodyweight_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  weight    numeric not null,
  logged_at date not null default current_date
);
create index if not exists bodyweight_user_logged_idx on public.bodyweight_logs (user_id, logged_at desc);

-- Goals --------------------------------------------------------------------
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  type          goal_type not null,
  exercise_id   uuid references public.exercises (id) on delete set null,
  target_value  numeric not null,
  current_value numeric not null default 0,
  target_date   date,
  created_at    timestamptz not null default now(),
  achieved_at   timestamptz
);
create index if not exists goals_user_idx on public.goals (user_id);

-- =============================================================================
-- Auto-create a profile row when a new auth user signs up.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- Every table is owner-scoped. Seeded global exercises (user_id is null) are
-- readable by all authenticated users but writable by none through the API.
-- =============================================================================
alter table public.profiles          enable row level security;
alter table public.exercises         enable row level security;
alter table public.routines          enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts          enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets              enable row level security;
alter table public.bodyweight_logs   enable row level security;
alter table public.goals             enable row level security;

-- profiles --------------------------------------------------------------
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile write"  on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile write"  on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- exercises -------------------------------------------------------------
drop policy if exists "exercises readable"  on public.exercises;
drop policy if exists "own exercises insert" on public.exercises;
drop policy if exists "own exercises update" on public.exercises;
drop policy if exists "own exercises delete" on public.exercises;
create policy "exercises readable"   on public.exercises for select
  using (user_id is null or auth.uid() = user_id);
create policy "own exercises insert" on public.exercises for insert with check (auth.uid() = user_id);
create policy "own exercises update" on public.exercises for update using (auth.uid() = user_id);
create policy "own exercises delete" on public.exercises for delete using (auth.uid() = user_id);

-- Generic owner policy generator for the remaining owner-scoped tables.
do $$
declare t text;
begin
  foreach t in array array['routines','workouts','bodyweight_logs','goals'] loop
    execute format('drop policy if exists "owner all" on public.%I', t);
    execute format(
      'create policy "owner all" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Child tables are scoped through their parent's ownership. -------------
drop policy if exists "owner via routine" on public.routine_exercises;
create policy "owner via routine" on public.routine_exercises for all
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

drop policy if exists "owner via workout" on public.workout_exercises;
create policy "owner via workout" on public.workout_exercises for all
  using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

drop policy if exists "owner via workout_exercise" on public.sets;
create policy "owner via workout_exercise" on public.sets for all
  using (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()))
  with check (exists (
    select 1 from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.id = workout_exercise_id and w.user_id = auth.uid()));
