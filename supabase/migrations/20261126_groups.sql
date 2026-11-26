-- THRYV circles and communities
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 48),
  description text not null default '' check (char_length(description) <= 240),
  created_at timestamptz not null default now()
);
create table if not exists public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key(circle_id,user_id)
);
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 500),
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key(community_id,user_id)
);
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index if not exists circle_members_user_idx on public.circle_members(user_id);
create index if not exists community_members_user_idx on public.community_members(user_id);
create index if not exists community_posts_feed_idx on public.community_posts(community_id,created_at desc);
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
drop policy if exists "circle members can view circle" on public.circles;
create policy "circle members can view circle" on public.circles for select to authenticated using (exists(select 1 from public.circle_members m where m.circle_id=circles.id and m.user_id=auth.uid()));
drop policy if exists "users create own circles" on public.circles;
create policy "users create own circles" on public.circles for insert to authenticated with check(owner_id=auth.uid());
drop policy if exists "circle owners update circle" on public.circles;
create policy "circle owners update circle" on public.circles for update to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists "circle members can view members" on public.circle_members;
create policy "circle members can view members" on public.circle_members for select to authenticated using(exists(select 1 from public.circle_members m where m.circle_id=circle_members.circle_id and m.user_id=auth.uid()));
drop policy if exists "users can add themselves to circles" on public.circle_members;
create policy "users can add themselves to circles" on public.circle_members for insert to authenticated with check(user_id=auth.uid() or exists(select 1 from public.circles c where c.id=circle_id and c.owner_id=auth.uid()));
drop policy if exists "users leave circles" on public.circle_members;
create policy "users leave circles" on public.circle_members for delete to authenticated using(user_id=auth.uid() or exists(select 1 from public.circles c where c.id=circle_id and c.owner_id=auth.uid()));
drop policy if exists "public communities visible" on public.communities;
create policy "public communities visible" on public.communities for select to authenticated using(not is_private or exists(select 1 from public.community_members m where m.community_id=communities.id and m.user_id=auth.uid()));
drop policy if exists "users create communities" on public.communities;
create policy "users create communities" on public.communities for insert to authenticated with check(created_by=auth.uid());
drop policy if exists "community creators update" on public.communities;
create policy "community creators update" on public.communities for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
drop policy if exists "community members visible" on public.community_members;
create policy "community members visible" on public.community_members for select to authenticated using(exists(select 1 from public.community_members m where m.community_id=community_members.community_id and m.user_id=auth.uid()));
drop policy if exists "users join public communities" on public.community_members;
create policy "users join public communities" on public.community_members for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.communities c where c.id=community_id and not c.is_private));
drop policy if exists "users leave communities" on public.community_members;
create policy "users leave communities" on public.community_members for delete to authenticated using(user_id=auth.uid());
drop policy if exists "community posts visible to members" on public.community_posts;
create policy "community posts visible to members" on public.community_posts for select to authenticated using(exists(select 1 from public.communities c where c.id=community_id and (not c.is_private or exists(select 1 from public.community_members m where m.community_id=c.id and m.user_id=auth.uid()))));
drop policy if exists "members can publish community posts" on public.community_posts;
create policy "members can publish community posts" on public.community_posts for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.community_members m where m.community_id=community_id and m.user_id=auth.uid()));
