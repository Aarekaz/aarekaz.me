// The creature's food. A tiny, sanitized snapshot of Anurag's real life, baked
// at build time into public/creature-feed.json (see scripts/bake-feed.mjs). The
// browser only ever sees these scalars — never the API token.
//
// loadFeed() reads the static file by default. Point VITE_CREATURE_FEED_URL at a
// live CORS endpoint (e.g. a future Cloudflare Worker) to swap to real-time data
// without touching anything else — the one-line upgrade path.

export interface CreatureFeed {
  github: { commits30d: number; activeDays30d: number; repos: number }
  wakatime: { seconds30d: number; languages: number }
  health: { avgSteps: number | null; workouts: number }
  status: { discord: string | null; listening: boolean }
}

// A believable resting creature. Used before the fetch resolves and whenever the
// feed is missing or malformed, so the site is never empty or unshaped.
export const FALLBACK_FEED: CreatureFeed = {
  github: { commits30d: 120, activeDays30d: 18, repos: 6 },
  wakatime: { seconds30d: 180000, languages: 4 },
  health: { avgSteps: 7000, workouts: 3 },
  status: { discord: "online", listening: false },
}

const FEED_URL = import.meta.env.VITE_CREATURE_FEED_URL ?? "/creature-feed.json"

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

/** Coerce arbitrary JSON into a complete CreatureFeed, section by section, so a
 *  partial or stale file can never produce NaN params downstream. */
function coerce(raw: unknown): CreatureFeed {
  const r = (raw ?? {}) as Record<string, any>
  const f = FALLBACK_FEED
  return {
    github: {
      commits30d: num(r.github?.commits30d, f.github.commits30d),
      activeDays30d: num(r.github?.activeDays30d, f.github.activeDays30d),
      repos: num(r.github?.repos, f.github.repos),
    },
    wakatime: {
      seconds30d: num(r.wakatime?.seconds30d, f.wakatime.seconds30d),
      languages: num(r.wakatime?.languages, f.wakatime.languages),
    },
    health: {
      avgSteps: r.health?.avgSteps == null ? null : num(r.health.avgSteps, 0),
      workouts: num(r.health?.workouts, f.health.workouts),
    },
    status: {
      discord: typeof r.status?.discord === "string" ? r.status.discord : null,
      listening: Boolean(r.status?.listening),
    },
  }
}

/** Fetch the baked feed. Never rejects — any failure resolves to FALLBACK_FEED. */
export async function loadFeed(signal?: AbortSignal): Promise<CreatureFeed> {
  try {
    const res = await fetch(FEED_URL, { signal })
    if (!res.ok) throw new Error(String(res.status))
    return coerce(await res.json())
  } catch {
    return FALLBACK_FEED
  }
}
