-- =============================================================================
-- Yunoria Games – Migration G2: Spielzeit-Bonus für eingebettete Spiele (GamePix)
-- Fremde Spiele melden keine prüfbaren Punkte. Deshalb gibt es nur einen kleinen
-- Bonus für Spielzeit: 2 XP pro Minute, höchstens 30 XP am Tag. Diese XP zählen
-- auch zum allgemeinen Tageslimit (200) und zu den Wochen-Ranglisten.
-- Gespeichert als game_score_events mit game = 'arcade'.
-- =============================================================================

create or replace function public.arcade_daily_xp_cap() returns integer language sql immutable set search_path = '' as $$ select 30 $$;

-- Eine Spielminute melden (die Seite ruft das höchstens einmal pro Minute auf)
create or replace function public.claim_arcade_minute()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  day_start timestamptz := (date_trunc('day', now() at time zone 'Europe/Berlin')) at time zone 'Europe/Berlin';
  last_at timestamptz;
  arcade_today integer;
  total_today integer;
  xp integer;
  new_xp integer;
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;

  select max(created_at) into last_at from public.game_score_events where user_id = uid and game = 'arcade';
  if last_at is not null and last_at > now() - interval '55 seconds' then
    raise exception 'too_fast' using errcode = 'P0001';
  end if;

  select coalesce(sum(e.xp) filter (where e.game = 'arcade'), 0), coalesce(sum(e.xp), 0)
    into arcade_today, total_today
    from public.game_score_events e where e.user_id = uid and e.created_at >= day_start;

  xp := greatest(0, least(2, public.arcade_daily_xp_cap() - arcade_today, public.game_daily_xp_cap() - total_today));
  if xp = 0 then
    return jsonb_build_object('xp', 0, 'today_arcade', arcade_today, 'cap', public.arcade_daily_xp_cap(), 'capped', true);
  end if;

  insert into public.game_score_events (user_id, game, score, duration_ms, xp) values (uid, 'arcade', 0, 60000, xp);
  insert into public.game_profiles (user_id, xp) values (uid, xp)
    on conflict (user_id) do update set xp = public.game_profiles.xp + excluded.xp, updated_at = now()
    returning public.game_profiles.xp into new_xp;

  return jsonb_build_object('xp', xp, 'total_xp', new_xp, 'today_arcade', arcade_today + xp,
    'cap', public.arcade_daily_xp_cap(), 'capped', arcade_today + xp >= public.arcade_daily_xp_cap());
end;
$$;

revoke all on function public.claim_arcade_minute() from public, anon;
grant execute on function public.claim_arcade_minute() to authenticated;

-- Eigene Spiele: die 8-Sekunden-Sperre soll Spielzeit-Meldungen nicht mitzählen
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
  if p_score > r.max_score or p_score > ceil(r.max_per_sec * p_duration_ms / 1000.0) + 50 then
    raise exception 'implausible_score' using errcode = 'P0001';
  end if;
  select max(created_at) into last_at from public.game_score_events where user_id = uid and game <> 'arcade';
  if last_at is not null and last_at > now() - interval '8 seconds' then
    raise exception 'too_fast' using errcode = 'P0001';
  end if;

  select coalesce(sum(e.xp), 0) into today_xp from public.game_score_events e
    where e.user_id = uid and e.created_at >= (date_trunc('day', now() at time zone 'Europe/Berlin')) at time zone 'Europe/Berlin';
  if p_duration_ms < r.min_ms then
    xp := 0;
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
