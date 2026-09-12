-- Run this in Supabase Dashboard → SQL Editor

-- 1. Profiles table (extra info beyond built-in auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- 2. Detections table (metadata only — actual images live in Storage)
create table detections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  image_url text not null,
  timestamp timestamptz not null,
  status text default 'unverified'
);

alter table detections enable row level security;

create policy "Users can view their own detections"
  on detections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own detections"
  on detections for insert
  with check (auth.uid() = user_id);

-- 3. Storage bucket for screenshots
-- Go to Storage tab in Supabase Dashboard and create a bucket named "screenshots"
-- Set it to "Public" (simplest for a college project demo) OR keep private and
-- use signed URLs if you want stricter access control.

-- If public, add this policy so only logged-in users can upload to their own folder:
create policy "Users can upload their own screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view screenshots (public bucket)"
  on storage.objects for select
  using (bucket_id = 'screenshots');
