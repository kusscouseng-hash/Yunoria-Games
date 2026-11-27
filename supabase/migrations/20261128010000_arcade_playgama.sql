-- =============================================================================
-- Yunoria Games – Migration G6: Playgama als dritter Partner
-- Erlaubt in „Empfohlen“ (arcade_picks) und „Versteckt“ (arcade_hidden) auch
-- Playgama-Spiele (source 'pg', Bilder von static.playgama.com).
-- =============================================================================

alter table public.arcade_picks drop constraint if exists arcade_picks_source_check;
alter table public.arcade_picks add constraint arcade_picks_source_check check (source in ('gpx', 'gd', 'pg'));
alter table public.arcade_picks drop constraint if exists arcade_picks_banner_check;
alter table public.arcade_picks add constraint arcade_picks_banner_check
  check (banner like 'https://img.gamepix.com/%' or banner like 'https://img.gamedistribution.com/%' or banner like 'https://static.playgama.com/%');
alter table public.arcade_picks drop constraint if exists arcade_picks_icon_check;
alter table public.arcade_picks add constraint arcade_picks_icon_check
  check (icon like 'https://img.gamepix.com/%' or icon like 'https://img.gamedistribution.com/%' or icon like 'https://static.playgama.com/%');

alter table public.arcade_hidden drop constraint if exists arcade_hidden_source_check;
alter table public.arcade_hidden add constraint arcade_hidden_source_check check (source in ('gpx', 'gd', 'pg'));
alter table public.arcade_hidden drop constraint if exists arcade_hidden_banner_check;
alter table public.arcade_hidden add constraint arcade_hidden_banner_check
  check (banner like 'https://img.gamepix.com/%' or banner like 'https://img.gamedistribution.com/%' or banner like 'https://static.playgama.com/%');
