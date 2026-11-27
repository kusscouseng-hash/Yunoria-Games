-- =============================================================================
-- Yunoria Games – Migration G4: „Zuletzt gespielt“
-- Merkt sich pro Konto die zuletzt geöffneten Spiele (nur der Spielname, z. B.
-- GamePix-„namespace“), damit man sie auf jedem Gerät wiederfindet.
-- =============================================================================

create table if not exists public.game_recent (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_key text not null check (game_key ~ '^[a-z0-9:-]{1,80}$'),
  played_at timestamptz not null default now(),
  primary key (user_id, game_key)
);
create index if not exists game_recent_user_time on public.game_recent (user_id, played_at desc);

alter table public.game_recent enable row level security;
drop policy if exists "game_recent_select_own" on public.game_recent;
create policy "game_recent_select_own" on public.game_recent for select to authenticated using (user_id = auth.uid());

-- Spiel als „gerade gespielt“ merken; behält höchstens die letzten 30
create or replace function public.touch_recent_game(p_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_signed_in' using errcode = '28000'; end if;
  if p_key is null or p_key !~ '^[a-z0-9:-]{1,80}$' then raise exception 'invalid_key' using errcode = 'P0001'; end if;
  insert into public.game_recent (user_id, game_key, played_at) values (uid, p_key, clock_timestamp())
    on conflict (user_id, game_key) do update set played_at = clock_timestamp();
  delete from public.game_recent r
    where r.user_id = uid
      and r.game_key not in (select g.game_key from public.game_recent g where g.user_id = uid order by g.played_at desc limit 30);
end;
$$;

revoke all on function public.touch_recent_game(text) from public, anon;
grant execute on function public.touch_recent_game(text) to authenticated;
