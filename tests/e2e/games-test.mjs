// Prüft Startseite, alle Spielseiten und jedes Spiel kurz (Handy + Desktop). Server: npx next start -p 3124
import puppeteer from "puppeteer-core";
const BASE = process.env.BASE ?? "http://localhost:3124";
const b = await puppeteer.launch({ executablePath: "/usr/bin/google-chrome", args: ["--no-sandbox"] });
let fails = 0;
const check = (ok, msg) => { console.log(`${ok ? "PASS" : "FAIL"} ${msg}`); if (!ok) fails++; };
for (const vp of [{ name: "mobile", width: 390, height: 844, isMobile: true, hasTouch: true }, { name: "desktop", width: 1280, height: 900 }]) {
  const p = await b.newPage();
  await p.setViewport(vp);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  for (const lang of ["en", "de"]) {
    const r = await p.goto(`${BASE}/${lang}`, { waitUntil: "load" });
    check(r.status() === 200, `${vp.name} /${lang} status 200`);
    const cards = await p.$$eval('a[href*="/arcade/"]', (a) => new Set(a.map((x) => x.getAttribute("href"))).size);
    check(cards >= 20, `${vp.name} /${lang} shows ${cards} game links`);
    const own = await p.$$eval('a[href*="/play/"]', (a) => a.length);
    check(own === 0, `${vp.name} /${lang} no own games (${own})`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 1, `${vp.name} /${lang} no horizontal overflow (${overflow}px)`);
  }
  {
    const r = await p.goto(`${BASE}/en/play/stars`, { waitUntil: "load" });
    check(new URL(p.url()).pathname === "/en", `${vp.name} /play/stars redirects home (${p.url()})`);
    check(r.status() === 200, `${vp.name} redirect target 200`);
  }
  for (const path of ["/de/c/puzzle", "/de/c/new", "/de/search?q=ball"]) {
    const r = await p.goto(`${BASE}${path}`, { waitUntil: "load" });
    check(r.status() === 200, `${vp.name} ${path} status 200`);
    const n = await p.$$eval('a[href*="/arcade/"]', (a) => a.length);
    check(n > 0, `${vp.name} ${path} has ${n} games`);
  }
  {
    await p.goto(`${BASE}/de/c/originals`, { waitUntil: "load" });
    const n = await p.$$eval('main a[href*="/arcade/"], main a[href*="/play/"]', (a) => a.length);
    check(n === 0, `${vp.name} /c/originals shows no games (${n})`);
  }
  {
    await p.goto(`${BASE}/de`, { waitUntil: "load" });
    const href = await p.$eval('a[href*="/arcade/"]', (a) => a.getAttribute("href"));
    const r = await p.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" });
    check(r.status() === 200, `${vp.name} ${href} status 200`);
    await new Promise((s) => setTimeout(s, 1500));
    const hasConsent = await p.$$eval("button", (bs) => bs.some((b) => b.textContent.trim() === "Spiel laden"));
    check(hasConsent, `${vp.name} game page shows consent button`);
    const zoom = await p.$('button[aria-label="Größer"]');
    check(!!zoom, `${vp.name} zoom buttons present`);
  }
  for (const path of ["/en/leaderboard", "/en/leaderboard/guilds", "/en/guilds", "/de/leaderboard"]) {
    const r = await p.goto(`${BASE}${path}`, { waitUntil: "load" });
    check(r.status() === 200, `${vp.name} ${path} status 200`);
  }
  check(errors.length === 0, `${vp.name} no page errors ${errors.slice(0, 3).join(" | ")}`);
  if (vp.name === "desktop") { await p.goto(`${BASE}/de`, { waitUntil: "load" }); await p.screenshot({ path: "/tmp/g-home.png", fullPage: true }); }
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
