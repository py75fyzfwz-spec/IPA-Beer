-- Progress tables for the IPA reading app.
-- Course content lives in the repo; Supabase only stores who someone is
-- and how well they know each card. Row-level security limits every
-- user to their own rows.

-- Per-user settings.
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  new_per_day integer not null default 10 check (new_per_day between 1 and 100),
  created_at timestamptz not null default now()
);

-- Current FSRS state of each card for each user.
create table public.review_state (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null,
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  scheduled_days integer not null,
  learning_steps integer not null,
  reps integer not null,
  lapses integer not null,
  state smallint not null,
  last_review timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create index review_state_due_idx on public.review_state (user_id, due);

-- Every rating ever given, kept to tune FSRS parameters later.
create table public.review_log (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id text not null,
  rating smallint not null check (rating between 1 and 4),
  state smallint not null, -- card state before this review
  due timestamptz not null,
  stability double precision not null,
  difficulty double precision not null,
  scheduled_days integer not null,
  learning_steps integer not null,
  reviewed_at timestamptz not null default now()
);

create index review_log_user_time_idx on public.review_log (user_id, reviewed_at);

alter table public.profiles enable row level security;
alter table public.review_state enable row level security;
alter table public.review_log enable row level security;

revoke all on public.profiles, public.review_state, public.review_log from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.review_state to authenticated;
grant select, insert on public.review_log to authenticated;

create policy "own profile: read" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own profile: create" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own profile: update" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own state: read" on public.review_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own state: create" on public.review_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own state: update" on public.review_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own state: delete" on public.review_state
  for delete to authenticated using ((select auth.uid()) = user_id);

-- The log is append-only: no update or delete policy.
create policy "own log: read" on public.review_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own log: create" on public.review_log
  for insert to authenticated with check ((select auth.uid()) = user_id);
