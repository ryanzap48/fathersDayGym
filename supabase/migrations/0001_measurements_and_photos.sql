-- =============================================================================
-- Migration 0001 — body measurements + progress photos
-- Run this in the Supabase SQL editor after the base schema.sql.
-- =============================================================================

-- Body measurements -------------------------------------------------------
-- Generic metric/value rows (waist, chest, arms, …) so new metrics need no
-- schema change. Value is stored in the user's circumference unit (in / cm).
create table if not exists public.body_measurements (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  metric    text not null,
  value     numeric not null,
  logged_at date not null default current_date
);
create index if not exists body_measurements_user_idx
  on public.body_measurements (user_id, metric, logged_at desc);

alter table public.body_measurements enable row level security;
drop policy if exists "owner all" on public.body_measurements;
create policy "owner all" on public.body_measurements for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Progress photos (Supabase Storage) --------------------------------------
-- Private bucket; each user's files live under a folder named by their uid,
-- e.g. "<uid>/2026-06-20.jpg". Policies scope access to that folder.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "own photos read"   on storage.objects;
drop policy if exists "own photos insert" on storage.objects;
drop policy if exists "own photos delete" on storage.objects;

create policy "own photos read" on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own photos insert" on storage.objects for insert
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "own photos delete" on storage.objects for delete
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
