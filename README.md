# Yunoria Games

Kostenlose Browser-Spiele mit Leveln, Rängen, Gilden und Wochen-Ranglisten – Schwester-Seite von Yunoria Scans.

- **Gemeinsames Konto:** Login, Profil und Gilden kommen aus derselben Supabase-Datenbank wie Yunoria Scans.
- **Eigene Spiele-Level:** Spiele-XP (`game_profiles`) sind getrennt von den Lese-XP.
- **Spiele:** Sternenfänger, Zahlen-Fusion, Neon-Schlange, Block-Fall, Runen-Memory (alle selbst programmiert, `src/components/games`).
- **Schutz gegen Schummeln:** Die Datenbank prüft jede Runde (`submit_game_score`): Punkte pro Sekunde, Höchstpunkte,
  höchstens eine Runde alle 8 Sekunden, höchstens 200 Spiele-XP pro Tag.

## Einrichten

1. Migration `supabase/migrations/20261124180000_games_core.sql` im Supabase-SQL-Editor ausführen (gleiches Projekt wie Yunoria Scans).
2. In Vercel das Repo importieren und `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` eintragen (dieselben Werte wie bei Yunoria Scans).
3. In Supabase unter Authentication → URL Configuration die neue Vercel-Adresse bei „Redirect URLs“ hinzufügen (`https://DEINE-ADRESSE.vercel.app/**`).

## Neues Spiel hinzufügen

1. Komponente in `src/components/games/` (bekommt `onScore` und `onGameOver`).
2. Eintrag in `src/lib/games/registry.ts` und in `GAMES` von `game-shell.tsx`.
3. Regel in `game_rules` (neue Migration): Punkte pro Sekunde, Mindestdauer, Höchstpunkte, Punkte pro XP.

## Partner-Spiele (GamePix + GameDistribution)

- Lizenzierte Browserspiele von zwei Partnern werden eingebettet (Werbung läuft über den Partner, Umsatzbeteiligung laut Partnervertrag):
  - **GamePix:** braucht die eigene Partner-ID als `GAMEPIX_SID` in Vercel.
  - **GameDistribution:** Katalog ist öffentlich, standardmäßig an (`GAMEDISTRIBUTION_ENABLED=false` schaltet aus).
    Damit Einnahmen ankommen, die Domain als Publisher bei GameDistribution anmelden.
- **Handverlesene Auswahl:** Unter `/de/admin/arcade` (nur Admins, Controller-Symbol oben rechts) Spiele durchsehen,
  testen und mit „Aufnehmen“ auswählen. Sobald mindestens ein Spiel ausgewählt ist, zeigt die Seite nur noch die Auswahl.
  Solange die Auswahl leer ist, wie bisher die bestbewerteten GamePix-Spiele. Migration: `20261127220000_arcade_picks.sql`.
- Kein Familienfilter: nur Glücksspiel (Casino, Poker, Slots …) bleibt draußen (`BLOCKED_WORDS` in `src/lib/arcade/types.ts`). Ausgesucht wird von Hand im Admin-Bereich.
- Spiel lädt erst nach Klick (Datenschutz). Spielzeit-Bonus: 4 XP pro aktiver Minute, max. 200 XP/Tag (Migrationen `20261124200000_arcade_playtime.sql`, `20261127230000_arcade_bonus_up.sql`).

## Tests

`npx next start -p 3124` und dann `node tests/e2e/games-test.mjs`.
