-- =============================================================================
-- Yunoria Games – Migration G1: Spiele-Level, Punkte, Bestenlisten
-- Läuft in DERSELBEN Supabase-Datenbank wie Yunoria Scans (gemeinsame Konten).
-- Spiele-XP und Spiele-Level sind getrennt von den Lese-XP. Gilden sind gemeinsam.
-- =============================================================================

-- Spiele-Profil: eigene XP + eigenes Rangsystem pro Nutzer
create table if not exists public.game_profiles (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  xp           integer not null default 0 constraint game_xp_positive check (xp >= 0),
  rank_system  text not null default 'league' constraint game_rank_system_valid check (rank_system in ('league', 'arcade', 'ninja', 'space')),
  games_played integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- Jede gespielte Runde (Grundlage für Wochen-Ranglisten und das Tageslimit)
create table if not exists public.game_score_events (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  game        text not null,
  score       integer not null constraint game_score_positive check (score >= 0),
  duration_ms integer not null constraint game_duration_positive check (duration_ms >= 0),
  xp          integer not null default 0 constraint game_event_xp_positive check (xp >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists game_score_events_user_idx on public.game_score_events (user_id, created_at);
create index if not exists game_score_events_game_idx on public.game_score_events (game, created_at, score desc);

-- Bester Punktestand pro Spiel und Nutzer
create table if not exists public.game_best_scores (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  game        text not null,
  score       integer not null,
  achieved_at timestamptz not null default now(),
  primary key (user_id, game)
);
create index if not exists game_best_scores_game_idx on public.game_best_scores (game, score desc);

alter table public.game_profiles enable row level security;
alter table public.game_score_events enable row level security;
alter table public.game_best_scores enable row level security;
create policy "Spiele-Profile öffentlich lesbar" on public.game_profiles for select to anon, authenticated using (true);
create policy "Bestwerte öffentlich lesbar" on public.game_best_scores for select to anon, authenticated using (true);
create policy "Eigene Runden lesbar" on public.game_score_events for select to authenticated using (user_id = auth.uid());
revoke all on public.game_profiles, public.game_score_events, public.game_best_scores from anon, authenticated;
grant select on public.game_profiles, public.game_best_scores to anon, authenticated;
grant select on public.game_score_events to authenticated;

-- -----------------------------------------------------------------------------
-- Regeln pro Spiel: Höchstpunkte pro Sekunde (Plausibilität), Mindestdauer,
-- Punkte pro zusätzlichem XP. Neue Spiele = neue Zeile hier.
-- -----------------------------------------------------------------------------
create or replace function public.game_rules(p_game text)
returns table (max_per_sec numeric, min_ms integer, max_score integer, score_per_xp integer)
language sql immutable set search_path = '' as $$
  select r.max_per_sec, r.min_ms, r.max_score, r.score_per_xp from (values
    ('merge',  60::numeric, 15000, 400000, 400),
    ('snake',  12::numeric, 10000,  20000,  40),
    ('memory', 200::numeric, 10000,  2000,  60),
    ('blocks', 120::numeric, 15000, 999999, 300),
    ('stars',  10::numeric, 15000,  20000,   8)
  ) as r(game, max_per_sec, min_ms, max_score, score_per_xp)
  where r.game = p_game
$$;

create or replace function public.game_daily_xp_cap() returns integer language sql immutable set search_path = '' as $$ select 200 $$;

-- -----------------------------------------------------------------------------
-- Runde einreichen: prüft Plausibilität, vergibt XP (5–40 pro Runde, max. 200 am Tag)
-- -----------------------------------------------------------------------------
create or replace function public.submit_game_score(p_game text, p_score integer, p_duration_ms integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  r record;
  today_xp integer;
  last_at timestamptz;
  xp integer;
  new_xp integer;
  prev_best integer;
  is_best boolean := false;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select * into r from public.game_rules(p_game);
  if r.max_per_sec is null then raise exception 'unknown_game' using errcode = 'P0001'; end if;
  if p_score is null or p_score < 0 or p_duration_ms is null or p_duration_ms < 0 or p_duration_ms > 3 * 3600 * 1000 then
    raise exception 'invalid_score' using errcode = 'P0001';
  end if;
  -- Unplausibel schnell oder zu hoch → abgelehnt
  if p_score > r.max_score or p_score > ceil(r.max_per_sec * p_duration_ms / 1000.0) + 50 then
    raise exception 'implausible_score' using errcode = 'P0001';
  end if;
  -- höchstens eine Runde alle 8 Sekunden
  select max(created_at) into last_at from public.game_score_events where user_id = uid;
  if last_at is not null and last_at > now() - interval '8 seconds' then
    raise exception 'too_fast' using errcode = 'P0001';
  end if;

  select coalesce(sum(e.xp), 0) into today_xp from public.game_score_events e
    where e.user_id = uid and e.created_at >= (date_trunc('day', now() at time zone 'Europe/Berlin')) at time zone 'Europe/Berlin';
  if p_duration_ms < r.min_ms then
    xp := 0;  -- sehr kurze Runden zählen für die Bestenliste, geben aber keine XP
  else
    xp := least(40, 5 + (p_score / r.score_per_xp));
  end if;
  xp := greatest(0, least(xp, public.game_daily_xp_cap() - today_xp));

  insert into public.game_score_events (user_id, game, score, duration_ms, xp) values (uid, p_game, p_score, p_duration_ms, xp);
  insert into public.game_profiles (user_id, xp, games_played) values (uid, xp, 1)
    on conflict (user_id) do update set xp = public.game_profiles.xp + excluded.xp,
      games_played = public.game_profiles.games_played + 1, updated_at = now()
    returning public.game_profiles.xp into new_xp;

  select b.score into prev_best from public.game_best_scores b where b.user_id = uid and b.game = p_game;
  if prev_best is null or p_score > prev_best then
    is_best := true;
    insert into public.game_best_scores (user_id, game, score) values (uid, p_game, p_score)
      on conflict (user_id, game) do update set score = excluded.score, achieved_at = now();
  end if;

  return jsonb_build_object('xp', xp, 'total_xp', new_xp, 'today_xp', today_xp + xp,
    'daily_cap', public.game_daily_xp_cap(), 'best', greatest(coalesce(prev_best, 0), p_score), 'new_best', is_best);
end;
$$;

create or replace function public.set_game_rank_system(p_system text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if p_system not in ('league', 'arcade', 'ninja', 'space') then raise exception 'invalid_system' using errcode = 'P0001'; end if;
  insert into public.game_profiles (user_id, rank_system) values (auth.uid(), p_system)
    on conflict (user_id) do update set rank_system = excluded.rank_system, updated_at = now();
end;
$$;

-- -----------------------------------------------------------------------------
-- Ranglisten (p_period: 'weekly' | 'monthly' | 'all' – wie bei Yunoria Scans)
-- -----------------------------------------------------------------------------
create or replace function public.game_leaderboard(p_period text default 'weekly', p_limit integer default 50)
returns table (place bigint, user_id uuid, username text, avatar_url text, role text, rank_system text, total_xp integer, xp bigint)
language sql stable security definer set search_path = '' as $$
  with since as (select public.leaderboard_since(p_period) as t),
  sc as (
    select gp.user_id,
      case when (select t from since) is null then gp.xp::bigint
           else coalesce((select sum(e.xp) from public.game_score_events e where e.user_id = gp.user_id and e.created_at >= (select t from since)), 0)::bigint end as xp
    from public.game_profiles gp
  )
  select rank() over (order by sc.xp desc), p.id, p.username, p.avatar_url, p.role::text, gp.rank_system, gp.xp, sc.xp
  from sc join public.game_profiles gp on gp.user_id = sc.user_id join public.profiles p on p.id = sc.user_id
  where sc.xp > 0
  order by sc.xp desc, p.username
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;

create or replace function public.game_top_scores(p_game text, p_period text default 'all', p_limit integer default 20)
returns table (place bigint, user_id uuid, username text, avatar_url text, score integer)
language sql stable security definer set search_path = '' as $$
  with since as (select public.leaderboard_since(p_period) as t),
  best as (
    select b.user_id, b.score from public.game_best_scores b where b.game = p_game and (select t from since) is null
    union all
    select e.user_id, max(e.score) from public.game_score_events e
      where e.game = p_game and (select t from since) is not null and e.created_at >= (select t from since)
      group by e.user_id
  )
  select rank() over (order by best.score desc), p.id, p.username, p.avatar_url, best.score
  from best join public.profiles p on p.id = best.user_id
  where best.score > 0
  order by best.score desc, p.username
  limit least(greatest(coalesce(p_limit, 20), 1), 100)
$$;

-- Gilden-Turnier: Summe der Spiele-XP aller Mitglieder im Zeitraum
create or replace function public.game_guild_leaderboard(p_period text default 'weekly', p_limit integer default 50)
returns table (place bigint, guild_id uuid, name text, tag text, color text, image_url text, members bigint, xp bigint)
language sql stable security definer set search_path = '' as $$
  with since as (select public.leaderboard_since(p_period) as t),
  pts as (
    select m.guild_id, count(distinct m.user_id) as members,
      coalesce(sum(case when (select t from since) is null then gp.xp
        else (select coalesce(sum(e.xp), 0) from public.game_score_events e where e.user_id = m.user_id and e.created_at >= (select t from since)) end), 0)::bigint as xp
    from public.guild_members m left join public.game_profiles gp on gp.user_id = m.user_id
    group by m.guild_id
  )
  select rank() over (order by pts.xp desc), g.id, g.name, g.tag, g.color::text, g.image_url, pts.members, pts.xp
  from pts join public.guilds g on g.id = pts.guild_id
  where pts.xp > 0
  order by pts.xp desc, g.name
  limit least(greatest(coalesce(p_limit, 50), 1), 100)
$$;

-- Eigene Spiele-Werte (XP, heute, Bestwerte)
create or replace function public.my_game_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'xp', coalesce((select xp from public.game_profiles where user_id = auth.uid()), 0),
    'rank_system', coalesce((select rank_system from public.game_profiles where user_id = auth.uid()), 'league'),
    'games_played', coalesce((select games_played from public.game_profiles where user_id = auth.uid()), 0),
    'today_xp', coalesce((select sum(xp) from public.game_score_events where user_id = auth.uid()
        and created_at >= (date_trunc('day', now() at time zone 'Europe/Berlin')) at time zone 'Europe/Berlin'), 0),
    'daily_cap', public.game_daily_xp_cap(),
    'best', coalesce((select jsonb_object_agg(game, score) from public.game_best_scores where user_id = auth.uid()), '{}'::jsonb)
  )
$$;

-- -----------------------------------------------------------------------------
-- Gilden gründen: Level 100 auf EINER der beiden Seiten reicht (Lesen oder Spielen)
-- (gleiche Funktion wie in Yunoria Scans, nur die Level-Prüfung erweitert)
-- -----------------------------------------------------------------------------
create or replace function public.create_guild(p_name text, p_tag text, p_description text, p_emblem text, p_color text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  privileged boolean;
  game_xp bigint;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  select (role = 'admin' or coalesce(is_owner, false)) into privileged from public.profiles where id = uid;
  select coalesce((select xp from public.game_profiles where user_id = uid), 0) into game_xp;
  if not coalesce(privileged, false)
     and public.current_system_xp(uid) < public.xp_for_level(public.guild_min_level())
     and game_xp < public.xp_for_level(public.guild_min_level()) then
    raise exception 'level_too_low' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.guild_members where user_id = uid) then
    raise exception 'already_in_guild' using errcode = 'P0001';
  end if;
  insert into public.guilds (name, tag, description, emblem, color, owner_id)
  values (btrim(p_name), upper(btrim(p_tag)), nullif(btrim(coalesce(p_description, '')), ''), coalesce(nullif(btrim(p_emblem), ''), '⚔️'), coalesce(p_color, 'red'), uid)
  returning id into gid;
  insert into public.guild_members (guild_id, user_id, role) values (gid, uid, 'leader');
  return gid;
end;
$$;

revoke all on function public.submit_game_score(text, integer, integer), public.set_game_rank_system(text), public.my_game_stats() from public, anon;
grant execute on function public.submit_game_score(text, integer, integer), public.set_game_rank_system(text), public.my_game_stats() to authenticated;
grant execute on function public.game_leaderboard(text, integer), public.game_top_scores(text, text, integer),
  public.game_guild_leaderboard(text, integer), public.game_rules(text), public.game_daily_xp_cap() to anon, authenticated;
