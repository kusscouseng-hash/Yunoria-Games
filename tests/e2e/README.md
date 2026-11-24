# Browser-Tests

Prüfen Anmeldung (`auth-test.mjs`) und Handy-Darstellung (`mobile-test.mjs`, 8 Seiten × 4 Breiten, kein seitliches Scrollen, keine Überlappung in der Kopfzeile).

```bash
npm run build && npx next start -p 3123   # in einem Terminal
cd tests/e2e && npm i puppeteer-core       # einmalig
node mobile-test.mjs                        # lokal
node mobile-test.mjs https://manga-site-eosin.vercel.app   # online
node auth-test.mjs
```

Benötigt Google Chrome unter `/usr/bin/google-chrome` (Pfad in den Dateien anpassbar).
