import type { GameSlug } from "@/lib/games/registry";

/** Kachel-Grafik je Spiel (eigene Vektorgrafik, keine fremden Bilder). */
export function GameArt({ slug, color, accent, className }: { slug: GameSlug; color: string; accent: string; className?: string }) {
  const shapes: Record<GameSlug, React.ReactNode> = {
    stars: (
      <>
        <path transform="translate(120 70) scale(1.6)" d="M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7 Z" fill={accent} />
        <path transform="translate(60 40) scale(0.6)" d="M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7 Z" fill="#e0e7ff" />
        <path transform="translate(190 50) scale(0.5)" d="M0 -22 L6 -7 L22 -7 L9 3 L14 19 L0 9 L-14 19 L-9 3 L-22 -7 L-6 -7 Z" fill="#e0e7ff" />
        <rect x="80" y="122" width="80" height="12" rx="6" fill="#a78bfa" />
        <circle cx="200" cy="105" r="10" fill="#7c4a3a" />
      </>
    ),
    merge: (
      <>
        <rect x="56" y="24" width="56" height="56" rx="10" fill={accent} />
        <rect x="120" y="24" width="56" height="56" rx="10" fill="#fdba74" />
        <rect x="56" y="88" width="56" height="56" rx="10" fill="#4a3f33" />
        <rect x="120" y="88" width="56" height="56" rx="10" fill="#e11d2e" />
        <text x="84" y="61" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">2048</text>
        <text x="148" y="125" textAnchor="middle" fontSize="22" fontWeight="800" fill="#fff">64</text>
      </>
    ),
    snake: (
      <>
        <path d="M40 120 H110 V60 H170 V100" fill="none" stroke={accent} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="200" cy="40" r="10" fill="#f472b6" />
        <circle cx="170" cy="100" r="5" fill="#06150f" />
      </>
    ),
    blocks: (
      <>
        <rect x="70" y="90" width="28" height="28" rx="5" fill="#38bdf8" />
        <rect x="100" y="90" width="28" height="28" rx="5" fill="#38bdf8" />
        <rect x="130" y="90" width="28" height="28" rx="5" fill={accent} />
        <rect x="130" y="60" width="28" height="28" rx="5" fill={accent} />
        <rect x="100" y="120" width="28" height="28" rx="5" fill="#facc15" />
        <rect x="130" y="120" width="28" height="28" rx="5" fill="#facc15" />
        <rect x="100" y="20" width="28" height="28" rx="5" fill="#fb7185" />
        <rect x="70" y="20" width="28" height="28" rx="5" fill="#fb7185" />
      </>
    ),
    memory: (
      <>
        <rect x="50" y="30" width="60" height="84" rx="10" fill="#0f2236" stroke={accent} strokeWidth="3" />
        <path d="M80 50v44M66 64l14-14 14 14" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" />
        <rect x="130" y="40" width="60" height="84" rx="10" fill="#1e3a5f" transform="rotate(8 160 82)" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 240 150" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`ga-${slug}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
      </defs>
      <rect width="240" height="150" fill={`url(#ga-${slug})`} />
      {shapes[slug]}
    </svg>
  );
}
