import Link from "next/link";
import { ActivityPing } from "./activity-ping";
import { ButtonLink } from "@/components/ui/button";
import { withLocale, type Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth/session";
import { Avatar } from "@/components/community/avatar";
import { levelFromXp } from "@/lib/levels";

type Props = { locale: Locale; loginLabel: string; accountLabel: string };

/** Anmelde-Button (Platzhalter während die Sitzung geprüft wird). */
export function LoginButton({ locale, loginLabel }: Pick<Props, "locale" | "loginLabel">) {
  return (
    <ButtonLink href={withLocale(locale, "/login")} size="sm">
      {loginLabel}
    </ButtonLink>
  );
}

/** Zeigt den angemeldeten Nutzer oder den Anmelde-Button. Liest Cookies → nur in <Suspense>. */
export async function UserNav({ locale, loginLabel, accountLabel }: Props) {
  const user = await getCurrentUser();
  if (!user) return <LoginButton locale={locale} loginLabel={loginLabel} />;

  return (
    <div className="flex items-center gap-1">
      <ActivityPing />
    <Link
      href={withLocale(locale, "/account")}
      aria-label={`${accountLabel}: ${user.username}`}
      className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
    >
      {user.avatarUrl ? (
        <Avatar url={user.avatarUrl} name={user.username} size={32} />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold uppercase text-accent-foreground">
          {user.username.slice(0, 1)}
        </span>
      )}
      <span className="hidden max-w-32 truncate sm:inline">{user.username}</span>
      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-black text-accent-hover">Lv. {levelFromXp(user.gameXp).level}</span>
    </Link>
    </div>
  );
}
