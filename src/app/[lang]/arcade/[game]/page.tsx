import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArcadeCard } from "@/components/arcade/arcade-card";
import { ArcadePlayer } from "@/components/arcade/arcade-player";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { embedUrl, getArcadeCatalog, gamepixSid, type ArcadeGame } from "@/lib/arcade/gamepix";

async function findGame(namespace: string) {
  const sid = gamepixSid();
  if (!sid) return null;
  const games = await getArcadeCatalog(sid);
  const game = games.find((g) => g.namespace === namespace);
  return game ? { sid, game, games } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/arcade/[game]">): Promise<Metadata> {
  const { game } = await params;
  const found = await findGame(game);
  if (!found) return {};
  return { title: found.game.title, description: found.game.description || undefined };
}

export default function ArcadeGamePage({ params }: PageProps<"/[lang]/arcade/[game]">) {
  return (
    <Suspense fallback={<div className="mx-auto mt-6 aspect-[4/3] max-h-[80vh] w-full max-w-6xl animate-pulse rounded-3xl bg-surface" />}>
      <GameBody params={params} />
    </Suspense>
  );
}

async function GameBody({ params }: { params: PageProps<"/[lang]/arcade/[game]">["params"] }) {
  const { game: namespace } = await params;
  const found = await findGame(namespace);
  if (!found) notFound();
  const { sid, game, games } = found;
  const { locale, dict } = await getDictionary();
  const t = dict.arcade;
  const label = (c: string) => (t.categories as Record<string, string>)[c] ?? c;
  const more = games.filter((g) => g.category === game.category && g.namespace !== game.namespace).slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Link href={withLocale(locale, "/arcade")} className="text-sm font-semibold text-muted hover:text-foreground">
        ← {t.back}
      </Link>
      <h1 className="mt-2 text-3xl font-black tracking-tight">{game.title}</h1>
      <p className="mb-4 mt-1 text-sm text-subtle">{label(game.category)} · {t.provider}</p>

      <Suspense fallback={<div className="mx-auto aspect-[4/3] max-h-[80vh] animate-pulse rounded-3xl bg-surface" />}>
        <Player game={game} sid={sid} locale={locale} dict={dict} />
      </Suspense>

      {game.description && <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted">{game.description}</p>}

      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-black">{label(game.category)}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {more.map((g) => (
              <ArcadeCard key={g.namespace} game={g} locale={locale} categoryLabel={label(g.category)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

async function Player({ game, sid, locale, dict }: { game: ArcadeGame; sid: string; locale: Locale; dict: Dictionary }) {
  const t = dict.arcade;
  const user = await getCurrentUser();
  const here = withLocale(locale, `/arcade/${game.namespace}`);
  return (
    <ArcadePlayer
      src={embedUrl(game.namespace, sid)}
      title={game.title}
      width={game.width}
      height={game.height}
      signedIn={Boolean(user)}
      loginHref={`${withLocale(locale, "/login")}?next=${encodeURIComponent(here)}`}
      t={{
        consentTitle: t.consentTitle,
        consentText: t.consentText,
        consentButton: t.consentButton,
        privacyLink: t.privacyLink,
        xpInfo: t.xpInfo,
        xpGained: t.xpGained,
        capReached: t.capReached,
        signInForXp: t.signInForXp,
        signIn: t.signIn,
        fullscreen: t.fullscreen,
      }}
    />
  );
}
