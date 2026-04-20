-- =============================================
-- 팀매처 Supabase Schema v1
-- Supabase SQL Editor에 붙여넣고 실행하세요
-- =============================================

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 6)),
  created_at timestamptz default now()
);

-- Profiles (linked to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  team_id uuid references teams(id) on delete set null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

-- Players
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  score int not null default 5 check (score between 1 and 10),
  tier text not null,
  status text not null default 'measuring' check (status in ('measuring', 'confirmed')),
  position text,
  official_match_count int not null default 0,
  created_at timestamptz default now()
);

-- Events (match schedules)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  date timestamptz not null,
  location text,
  is_open boolean not null default true,
  created_at timestamptz default now()
);

-- Attendance votes
create table if not exists attend_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  player_name text not null,
  status text not null check (status in ('attending', 'absent', 'maybe')),
  voted_at timestamptz default now(),
  unique (event_id, player_id)
);

-- Lineups
create table if not exists lineups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade unique,
  formation_id text not null,
  is_published boolean not null default false,
  notes text,
  created_at timestamptz default now()
);

-- Lineup slots
create table if not exists lineup_slots (
  id uuid primary key default gen_random_uuid(),
  lineup_id uuid not null references lineups(id) on delete cascade,
  position text not null,
  slot_index int not null,
  player_id uuid references players(id) on delete set null,
  player_name text,
  unique (lineup_id, position, slot_index)
);

-- Match records
create table if not exists match_records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  title text not null,
  date date not null,
  team_a_name text not null default 'A팀',
  team_b_name text not null default 'B팀',
  score_a int not null default 0,
  score_b int not null default 0,
  notes text,
  mvp_open boolean not null default true,
  created_at timestamptz default now()
);

-- Match participants
create table if not exists match_participants (
  match_id uuid not null references match_records(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  primary key (match_id, player_id)
);

-- MVP votes
create table if not exists mvp_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references match_records(id) on delete cascade,
  voter_id uuid not null references players(id) on delete cascade,
  mvp_player_id uuid not null references players(id) on delete cascade,
  mvp_player_name text not null,
  unique (match_id, voter_id)
);

-- Eval requests
create table if not exists eval_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  player_name text not null,
  current_tier text not null,
  suggested_tier text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_at timestamptz default now()
);

-- =============================================
-- RPC Functions
-- =============================================

create or replace function increment_match_count(player_id uuid)
returns void language sql security definer as $$
  update players set official_match_count = official_match_count + 1 where id = player_id;
$$;

-- =============================================
-- Row Level Security
-- =============================================

alter table teams enable row level security;
alter table profiles enable row level security;
alter table players enable row level security;
alter table events enable row level security;
alter table attend_votes enable row level security;
alter table lineups enable row level security;
alter table lineup_slots enable row level security;
alter table match_records enable row level security;
alter table match_participants enable row level security;
alter table mvp_votes enable row level security;
alter table eval_requests enable row level security;

-- Helper functions
create or replace function my_team_id()
returns uuid language sql stable security definer as $$
  select team_id from profiles where id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select role = 'admin' from profiles where id = auth.uid()
$$;

-- Policies
create policy "team read"    on teams for select using (id = my_team_id());
create policy "team update"  on teams for update using (is_admin() and id = my_team_id());

create policy "profile own"  on profiles for all using (id = auth.uid());

create policy "players read"  on players for select using (team_id = my_team_id());
create policy "players write" on players for all    using (is_admin() and team_id = my_team_id());

create policy "events read"   on events for select using (team_id = my_team_id());
create policy "events write"  on events for all    using (is_admin() and team_id = my_team_id());

create policy "votes read"    on attend_votes for select using (exists (select 1 from events where id = event_id and team_id = my_team_id()));
create policy "votes write"   on attend_votes for all    using (exists (select 1 from events where id = event_id and team_id = my_team_id()));

create policy "lineups read member" on lineups for select using (
  is_admin() or (is_published = true and exists (select 1 from events where id = event_id and team_id = my_team_id()))
);
create policy "lineups write" on lineups for all using (is_admin());

create policy "slots read"    on lineup_slots for select using (
  exists (select 1 from lineups l join events e on e.id = l.event_id where l.id = lineup_id and e.team_id = my_team_id())
);
create policy "slots write"   on lineup_slots for all using (is_admin());

create policy "matches read"  on match_records for select using (team_id = my_team_id());
create policy "matches write" on match_records for all    using (is_admin() and team_id = my_team_id());

create policy "participants read"  on match_participants for select using (exists (select 1 from match_records where id = match_id and team_id = my_team_id()));
create policy "participants write" on match_participants for all    using (is_admin());

create policy "mvp read"    on mvp_votes for select using (exists (select 1 from match_records where id = match_id and team_id = my_team_id()));
create policy "mvp insert"  on mvp_votes for insert with check (exists (select 1 from match_records where id = match_id and team_id = my_team_id() and mvp_open = true));

create policy "eval read"          on eval_requests for select using (team_id = my_team_id());
create policy "eval member insert" on eval_requests for insert with check (team_id = my_team_id());
create policy "eval admin update"  on eval_requests for update using (is_admin() and team_id = my_team_id());
