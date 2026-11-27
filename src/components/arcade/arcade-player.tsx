"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { claimArcadeMinute, recordRecentGame } from "@/lib/arcade/actions";

const CONSENT_KEY = "yg-arcade-consent";

function storedConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false; // Speicher nicht verfügbar → Zustimmung jedes Mal
  }
}
const noSubscribe = () => () => {};

type Texts = {
  consentTitle: string;
  consentText: string;
  consentButton: string;
  privacyLink: string;
  xpInfo: string;
  xpGained: string;
  capReached: string;
  signInForXp: string;
  signIn: string;
};

/**
 * Spielt ein Partner-Spiel (GamePix, GameDistribution) im iframe. Das Spiel (und dessen
 * Werbung) wird erst nach einem Klick geladen, weil dabei Daten an den Anbieter gehen. Angemeldete Spieler bekommen
 * für jede aktive Minute (Tab sichtbar und im Fokus) einen kleinen XP-Bonus.
 */
export function ArcadePlayer({
  src,
  gameKey,
  title,
  width,
  height,
  signedIn,
  loginHref,
  privacyUrl,
  t,
}: {
  src: string;
  gameKey: string;
  title: string;
  width: number;
  height: number;
  signedIn: boolean;
  loginHref: string;
  privacyUrl: string;
  t: Texts;
}) {
  const [accepted, setAccepted] = useState(false);
  // Wer schon einmal zugestimmt hat, bekommt das Spiel direkt
  const remembered = useSyncExternalStore(noSubscribe, storedConsent, () => false);
  const loaded = accepted || remembered;
  const [status, setStatus] = useState<string | null>(null);

  // Für „Zuletzt gespielt“ merken, sobald das Spiel geladen ist
  useEffect(() => {
    if (loaded && signedIn) recordRecentGame(gameKey).catch(() => {});
  }, [loaded, signedIn, gameKey]);

  // Spielzeit zählen: alle 5 s prüfen, nach 60 aktiven Sekunden eine Minute melden
  useEffect(() => {
    if (!loaded || !signedIn) return;
    let active = 0;
    let stopped = false;
    let busy = false;
    const id = window.setInterval(async () => {
      if (stopped || busy) return;
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      active += 5;
      if (active < 60) return;
      active = 0;
      busy = true;
      const r = await claimArcadeMinute();
      busy = false;
      if (!r.ok) {
        if (r.error === "signin") stopped = true;
        return;
      }
      if (r.xp > 0) setStatus(t.xpGained.replace("{xp}", String(r.xp)).replace("{today}", String(r.todayArcade)).replace("{cap}", String(r.cap)));
      if (r.capped) {
        stopped = true;
        setStatus(t.capReached);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [loaded, signedIn, t.xpGained, t.capReached]);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* egal */
    }
    setAccepted(true);
  }

  const ratio = `${Math.max(width, 1)} / ${Math.max(height, 1)}`;

  return (
    <div className="space-y-2">
      <div
        className="arcade-frame relative mx-auto w-full overflow-hidden rounded-3xl border border-border bg-black"
        style={{ aspectRatio: ratio, maxHeight: "var(--stage-h, 72vh)", maxWidth: `calc(var(--stage-h, 72vh) * ${Math.max(width, 1) / Math.max(height, 1)})` }}
      >
        {loaded ? (
          <iframe
            src={src}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; gamepad"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-lg font-black text-white">{t.consentTitle}</p>
            <p className="max-w-md text-sm text-white/75">{t.consentText}</p>
            <button type="button" onClick={accept} className="rounded-full bg-accent px-6 py-2.5 font-bold text-white hover:bg-accent-hover">
              {t.consentButton}
            </button>
            <a
              href={privacyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/60 underline hover:text-white"
            >
              {t.privacyLink}
            </a>
          </div>
        )}
      </div>

      <div className="arcade-meta flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          {signedIn ? (
            (status ?? t.xpInfo)
          ) : (
            <>
              {t.signInForXp}{" "}
              <Link href={loginHref} className="font-semibold text-accent hover:text-accent-hover">
                {t.signIn}
              </Link>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
