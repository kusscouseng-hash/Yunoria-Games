-- =============================================================================
-- Yunoria Games – Migration G3: höherer Spielzeit-Bonus
-- Die eigenen Spiele sind ausgeblendet, XP gibt es jetzt über Spielzeit:
-- 4 XP pro aktiver Minute, bis zu 200 XP am Tag (= allgemeines Tageslimit).
-- =============================================================================

create or replace function public.arcade_daily_xp_cap() returns integer language sql immutable set search_path = '' as $$ select 200 $$;

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

  xp := greatest(0, least(4, public.arcade_daily_xp_cap() - arcade_today, public.game_daily_xp_cap() - total_today));
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

