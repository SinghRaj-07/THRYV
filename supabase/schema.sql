create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique,
 display_name text not null default 'New member',
 bio text not null default '',
 avatar_url text,
 is_private boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.posts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 content text not null default '',
 media_url text,
 media_type text check(media_type in ('image','video') or media_type is null),
 created_at timestamptz not null default now()
);
create table if not exists public.likes (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(post_id,user_id)
);
create table if not exists public.comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 content text not null check(length(content)<=1000),
 created_at timestamptz not null default now()
);
create table if not exists public.messages (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references public.profiles(id) on delete cascade,
 recipient_id uuid not null references public.profiles(id) on delete cascade,
 content text not null check(length(content)<=4000),
 created_at timestamptz not null default now()
);
create table if not exists public.notifications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 actor_id uuid references public.profiles(id) on delete set null,
 kind text not null,
 entity_id uuid,
 read boolean not null default false,
 created_at timestamptz not null default now()
);
create table if not exists public.stories (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 media_url text not null,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours'
);
create table if not exists public.shares (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.posts(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now()
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name,username)
 values(new.id,coalesce(new.raw_user_meta_data->>'display_name','New member'),split_part(new.email,'@',1)||'_'||substr(new.id::text,1,6))
 on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists messages_pair_idx on public.messages(sender_id,recipient_id,created_at);
create index if not exists notifications_user_idx on public.notifications(user_id,created_at desc);
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.stories enable row level security;
alter table public.shares enable row level security;
drop policy if exists "profiles visible" on public.profiles;
create policy "profiles visible" on public.profiles for select to authenticated using(not is_private or id=auth.uid());
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles for insert to authenticated with check(id=auth.uid());
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
drop policy if exists "posts visible" on public.posts;
create policy "posts visible" on public.posts for select to authenticated using (exists (select 1 from public.profiles p where p.id=posts.user_id and (p.is_private=false or p.id=auth.uid() or exists (select 1 from public.follows f where f.follower_id=auth.uid() and f.following_id=p.id))));
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete to authenticated using(user_id=auth.uid());
drop policy if exists "likes visible" on public.likes;
create policy "likes visible" on public.likes for select to authenticated using(true);
drop policy if exists "likes own" on public.likes;
create policy "likes own" on public.likes for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "comments visible" on public.comments;
create policy "comments visible" on public.comments for select to authenticated using(true);
drop policy if exists "comments own" on public.comments;
create policy "comments own" on public.comments for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "messages participants" on public.messages;
create policy "messages participants" on public.messages for select to authenticated using(sender_id=auth.uid() or recipient_id=auth.uid());
drop policy if exists "messages send own" on public.messages;
create policy "messages send own" on public.messages for insert to authenticated with check(sender_id=auth.uid());
drop policy if exists "notifications own read" on public.notifications;
create policy "notifications own read" on public.notifications for select to authenticated using(user_id=auth.uid());
drop policy if exists "notifications own update" on public.notifications;
create policy "notifications own update" on public.notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "stories visible" on public.stories;
create policy "stories visible" on public.stories for select to authenticated using(expires_at>now());
drop policy if exists "stories own" on public.stories;
create policy "stories own" on public.stories for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists "shares visible" on public.shares;
create policy "shares visible" on public.shares for select to authenticated using(true);
drop policy if exists "shares own" on public.shares;
create policy "shares own" on public.shares for insert to authenticated with check(user_id=auth.uid());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('media','media',true,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict(id) do nothing;
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using(bucket_id='media');
drop policy if exists "upload own media folder" on storage.objects;
create policy "upload own media folder" on storage.objects for insert to authenticated with check(bucket_id='media' and (storage.foldername(name))[1]=auth.uid()::text);
do $ begin
 if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then alter publication supabase_realtime add table public.notifications; end if;
 end if;
end $;

create table if not exists public.follows (
 follower_id uuid not null references public.profiles(id) on delete cascade,
 following_id uuid not null references public.profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,following_id),
 check(follower_id<>following_id)
);
alter table public.follows enable row level security;
drop policy if exists "follows visible to signed in" on public.follows;
create policy "follows visible to signed in" on public.follows for select to authenticated using(true);
drop policy if exists "follow own account" on public.follows;
create policy "follow own account" on public.follows for insert to authenticated with check(follower_id=auth.uid());
drop policy if exists "unfollow own account" on public.follows;
create policy "unfollow own account" on public.follows for delete to authenticated using(follower_id=auth.uid());
