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
    const r = await p.goto(`${BASE}/${lang}`, { waitUntil: "networkidle2" });
    check(r.status() === 200, `${vp.name} /${lang} status 200`);
    const cards = await p.$$eval('a[href*="/play/"]', (a) => new Set(a.map((x) => x.getAttribute("href"))).size);
    check(cards >= 5, `${vp.name} /${lang} shows ${cards} game links`);
  }
  for (const g of ["stars", "merge", "snake", "blocks", "memory"]) {
    const r = await p.goto(`${BASE}/en/play/${g}`, { waitUntil: "networkidle2" });
    check(r.status() === 200, `${vp.name} play/${g} status 200`);
    const btn = await p.$$("button");
    let started = false;
    for (const x of btn) { if ((await x.evaluate((n) => n.textContent)).trim() === "Play") { await x.click(); started = true; break; } }
    check(started, `${vp.name} ${g} start button`);
    await new Promise((s) => setTimeout(s, 900));
    if (g === "merge") for (const k of ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"]) await p.keyboard.press(k);
    if (g === "memory") { const cs = await p.$$('button[aria-label="Card"]'); if (cs[0]) { await cs[0].click(); await cs[1].click(); } }
    await new Promise((s) => setTimeout(s, 600));
    const hasBoard = await p.evaluate(() => !!document.querySelector("canvas") || document.querySelectorAll('button[aria-label^="Card"],button[aria-label^="Rune"]').length > 0 || document.querySelectorAll(".rounded-xl.font-extrabold").length > 0);
    check(hasBoard, `${vp.name} ${g} board visible`);
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(overflow <= 1, `${vp.name} ${g} no horizontal overflow (${overflow}px)`);
    if (vp.name === "mobile") await p.screenshot({ path: `/tmp/g-${g}.png` });
  }
  for (const path of ["/en/leaderboard", "/en/leaderboard/guilds", "/en/guilds", "/de/leaderboard"]) {
    const r = await p.goto(`${BASE}${path}`, { waitUntil: "networkidle2" });
    check(r.status() === 200, `${vp.name} ${path} status 200`);
  }
  check(errors.length === 0, `${vp.name} no page errors ${errors.slice(0, 3).join(" | ")}`);
  if (vp.name === "desktop") { await p.goto(`${BASE}/de`, { waitUntil: "networkidle2" }); await p.screenshot({ path: "/tmp/g-home.png", fullPage: true }); }
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAILED` : "ALL PASS");
process.exit(fails ? 1 : 0);
