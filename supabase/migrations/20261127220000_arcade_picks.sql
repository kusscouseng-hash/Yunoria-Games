-- =============================================================================
-- Yunoria Games – Migration G3: Handverlesene Spiele-Auswahl
-- Statt alle Spiele der Partner (GamePix, GameDistribution) anzuzeigen, sucht der
-- Admin im Admin-Bereich (/de/admin/arcade) die besten Spiele von Hand aus.
-- Sobald mindestens ein Spiel ausgewählt ist, zeigt die Seite NUR noch die Auswahl
-- (plus die eigenen Spiele).
-- Lesen darf jeder, ändern nur Admins (is_admin() aus Yunoria Scans).
-- =============================================================================

create table if not exists public.arcade_picks (
  source text not null check (source in ('gpx', 'gd')),
  game_id text not null check (game_id ~ '^[a-z0-9-]{1,120}$'),
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  category text not null check (category in ('action', 'puzzle', 'racing', 'sports', 'brain', 'casual', 'creative', 'animals', 'strategy')),
  width integer not null default 800 check (width between 50 and 4000),
  height integer not null default 600 check (height between 50 and 4000),
  banner text not null check (banner like 'https://img.gamepix.com/%' or banner like 'https://img.gamedistribution.com/%'),
  icon text not null check (icon like 'https://img.gamepix.com/%' or icon like 'https://img.gamedistribution.com/%'),
  created_at timestamptz not null default now(),
  primary key (game_id)
);

alter table public.arcade_picks enable row level security;

drop policy if exists "Auswahl öffentlich lesbar" on public.arcade_picks;
create policy "Auswahl öffentlich lesbar" on public.arcade_picks for select to anon, authenticated using (true);

drop policy if exists "Auswahl: Admins fügen hinzu" on public.arcade_picks;
create policy "Auswahl: Admins fügen hinzu" on public.arcade_picks for insert to authenticated with check (public.is_admin());

drop policy if exists "Auswahl: Admins entfernen" on public.arcade_picks;
create policy "Auswahl: Admins entfernen" on public.arcade_picks for delete to authenticated using (public.is_admin());

grant select on public.arcade_picks to anon, authenticated;
grant insert, delete on public.arcade_picks to authenticated;
