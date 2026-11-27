import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArcadePlayer } from "@/components/arcade/arcade-player";
import { GamePageLayout, recommend } from "@/components/tiles/game-page-layout";
import { TileRow } from "@/components/tiles/tile-grids";
import { withLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/get-dictionary";
import { getCurrentUser } from "@/lib/auth/session";
import { arcadeEmbedUrl, findArcadeGame, providerInfo } from "@/lib/arcade/sources";
import type { ArcadeGame } from "@/lib/arcade/types";
import { CATEGORY_ICON, allTiles, byCategory, type Tile } from "@/lib/catalog";

async function findGame(locale: Locale, id: string) {
  const data = await allTiles(locale);
  const listed = data.arcade.find((t) => t.kind === "arcade" && t.game.id === id);
  if (listed && listed.kind === "arcade") return { tile: listed, data };
  // Nicht in der Auswahl (alter Link oder Vorschau im Admin-Bereich) → direkt beim Anbieter suchen
  const game = await findArcadeGame(id);
  if (!game) return null;
  const tile: Extract<Tile, { kind: "arcade" }> = {
    kind: "arcade",
    key: `${game.source}:${game.id}`,
    href: withLocale(locale, `/arcade/${game.id}`),
    title: game.title,
    category: game.category,
    icon: game.icon,
    cover: game.banner,
    published: game.published,
    description: game.description,
    game,
  };
  return { tile, data };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/arcade/[game]">): Promise<Metadata> {
  const { game } = await params;
  const { locale } = await getDictionary();
  const found = await findGame(locale, game);
  if (!found) return {};
  return { title: found.tile.title, description: found.tile.description || undefined };
}

export default function ArcadeGamePage({ params }: PageProps<"/[lang]/arcade/[game]">) {
  return (
    <Suspense fallback={<div className="m-4 aspect-[4/3] max-h-[75vh] animate-pulse rounded-3xl bg-surface" />}>
      <GameBody params={params} />
    </Suspense>
  );
}

async function GameBody({ params }: { params: PageProps<"/[lang]/arcade/[game]">["params"] }) {
  const { game: id } = await params;
  const { locale, dict } = await getDictionary();
  const found = await findGame(locale, id);
  if (!found) notFound();
  const { tile, data } = found;
  const b = dict.browse;
  const t = dict.arcade;
  const catLabel = b.categories[tile.category];
  const more = byCategory(data.all, tile.category).filter((x) => x.key !== tile.key).slice(12, 30);

  return (
    <GamePageLayout
      tile={tile}
      subtitle={`${catLabel} · ${t.provider.replace("{provider}", providerInfo(tile.game.source).name)}`}
      player={<Player game={tile.game} locale={locale} dict={dict} />}
      recommended={recommend(tile, data.all)}
      recommendedTitle={b.recommended}
      originalLabel={b.original}
      stageLabels={b.stage}
    >
      {tile.description && (
        <section className="max-w-3xl rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-subtle">{b.about}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{tile.description}</p>
        </section>
      )}
      <TileRow
        title={b.moreLikeThis}
        icon={CATEGORY_ICON[tile.category]}
        href={withLocale(locale, `/c/${tile.category}`)}
        showAll={b.showAll}
        tiles={more}
        originalLabel={b.original}
      />
    </GamePageLayout>
  );
}

async function Player({ game, locale, dict }: { game: ArcadeGame; locale: Locale; dict: Dictionary }) {
  const t = dict.arcade;
  const user = await getCurrentUser();
  const here = withLocale(locale, `/arcade/${game.id}`);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const src = arcadeEmbedUrl(game, `${proto}://${host}${here}`);
  if (!src) notFound();
  const provider = providerInfo(game.source);
  return (
    <ArcadePlayer
      src={src}
      title={game.title}
      width={game.width}
      height={game.height}
      signedIn={Boolean(user)}
      loginHref={`${withLocale(locale, "/login")}?next=${encodeURIComponent(here)}`}
      privacyUrl={provider.privacyUrl}
      t={{
        consentTitle: t.consentTitle,
        consentText: t.consentText.replace("{provider}", provider.name),
        consentButton: t.consentButton,
        privacyLink: t.privacyLink.replace("{provider}", provider.name),
        xpInfo: t.xpInfo,
        xpGained: t.xpGained,
        capReached: t.capReached,
        signInForXp: t.signInForXp,
        signIn: t.signIn,
      }}
    />
  );
}
