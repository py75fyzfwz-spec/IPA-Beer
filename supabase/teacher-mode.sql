-- Teacher mode storage. Run this once in the Supabase dashboard:
-- SQL Editor → New query → paste → Run. Running it again is harmless.
--
-- Only the website's server talks to these tables, with the secret
-- (service role) key, so row level security is on with no policies:
-- the public anon key can't read or change anything here.

-- Cards the teacher added in teacher mode, on top of src/content/.
create table if not exists public.teacher_cards (
  card_id text primary key check (card_id ~ '^(word|sentence):[a-z0-9-]+$'),
  unit integer not null check (unit between 1 and 99),
  ipa text not null,
  spelling text,          -- words: shown after Check
  text text,              -- sentences: shown after Check
  words text[],           -- sentences: word ids to start first
  require_stress boolean not null default false,
  created_at timestamptz not null default now()
);

-- The newest recording for each card, static or added.
create table if not exists public.teacher_recordings (
  card_id text primary key,
  path text not null,     -- object path in the teacher-recordings bucket
  updated_at timestamptz not null default now()
);

alter table public.teacher_cards enable row level security;
alter table public.teacher_recordings enable row level security;

-- Newer Supabase projects don't always grant table access automatically.
grant select, insert, update, delete on public.teacher_cards, public.teacher_recordings to service_role;

-- Public bucket, so learners' browsers can play the files directly.
-- Uploads still go through the website's server only.
insert into storage.buckets (id, name, public, file_size_limit)
values ('teacher-recordings', 'teacher-recordings', true, 5242880)
on conflict (id) do update set public = true;
