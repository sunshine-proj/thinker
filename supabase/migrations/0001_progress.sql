-- Physics Playground learner progress.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Also enable anonymous sign-ins: Authentication → Providers → Anonymous.
--
-- Records are immutable and keyed naturally, so sync is a set union and devices
-- never conflict. Timestamps are kept as the exact ISO-8601 text the app wrote.

create table if not exists public.game_results (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id text not null check (length(game_id) between 1 and 100),
  score integer not null check (score >= 0),
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  completion_status text not null check (completion_status in ('completed', 'abandoned')),
  completed_at text not null,
  stars integer check (stars >= 0),
  max_stars integer check (max_stars >= 0),
  primary key (user_id, game_id, completed_at)
);

create table if not exists public.saved_experiments (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (length(id) between 1 and 100),
  experiment_id text not null,
  experiment_name text not null,
  run_name text not null,
  parameters jsonb not null,
  results jsonb not null,
  created_at text not null,
  primary key (user_id, id)
);

create table if not exists public.achievements (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_id text not null,
  title text not null,
  description text not null,
  unlocked_at text not null,
  primary key (user_id, achievement_id)
);

alter table public.game_results enable row level security;
alter table public.saved_experiments enable row level security;
alter table public.achievements enable row level security;

-- Each learner can read and write only their own rows.
create policy "own game results" on public.game_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own saved experiments" on public.saved_experiments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own achievements" on public.achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
