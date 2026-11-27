-- =============================================================================
-- Yunoria Games – Migration G5: Versteckte Spiele
-- Spiele, die der Admin langweilig findet, werden für alle ausgeblendet: Sie erscheinen
-- nirgends auf der Seite und ihre Spielseite gibt 404. Im Admin-Bereich unter
-- „Versteckt“ kann man sie wieder zeigen.
-- Lesen darf jeder (die Seite muss sie herausfiltern), ändern nur Admins.
-- =============================================================================

create table if not exists public.arcade_hidden (
  game_id text primary key check (game_id ~ '^[a-z0-9-]{1,120}$'),
  source text not null check (source in ('gpx', 'gd')),
  title text not null check (char_length(title) between 1 and 80),
  banner text not null check (banner like 'https://img.gamepix.com/%' or banner like 'https://img.gamedistribution.com/%'),
  created_at timestamptz not null default now()
);

alter table public.arcade_hidden enable row level security;

drop policy if exists "Versteckte öffentlich lesbar" on public.arcade_hidden;
create policy "Versteckte öffentlich lesbar" on public.arcade_hidden for select to anon, authenticated using (true);

drop policy if exists "Versteckte: Admins fügen hinzu" on public.arcade_hidden;
create policy "Versteckte: Admins fügen hinzu" on public.arcade_hidden for insert to authenticated with check (public.is_admin());

drop policy if exists "Versteckte: Admins entfernen" on public.arcade_hidden;
create policy "Versteckte: Admins entfernen" on public.arcade_hidden for delete to authenticated using (public.is_admin());

grant select on public.arcade_hidden to anon, authenticated;
grant insert, delete on public.arcade_hidden to authenticated;
