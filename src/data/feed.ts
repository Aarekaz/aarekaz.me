// A tiny, sanitized snapshot of Anurag's real activity, baked at build time
// into public/live-feed.json (see scripts/bake-feed.mjs). The browser only sees
// these scalars, never the API token.

export interface SiteFeed {
  generatedAt: string | null
  github: { commits30d: number; activeDays30d: number; repos: number }
  wakatime: { seconds30d: number; languages: number }
  health: { avgSteps: number | null; workouts: number }
  status: { discord: string | null; listening: boolean }
}

export const FALLBACK_FEED: SiteFeed = {
  generatedAt: null,
  github: { commits30d: 120, activeDays30d: 18, repos: 6 },
  wakatime: { seconds30d: 180000, languages: 4 },
  health: { avgSteps: 7000, workouts: 3 },
  status: { discord: "online", listening: false },
}

const FEED_URL =
  import.meta.env.VITE_LIVE_FEED_URL ?? "/live-feed.json"

const num = (v: unknown, fallback: number): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

function coerce(raw: unknown): SiteFeed {
  const r = (raw ?? {}) as Record<string, any>
  const f = FALLBACK_FEED
  return {
    generatedAt: typeof r.generatedAt === "string" ? r.generatedAt : null,
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

export async function loadFeed(signal?: AbortSignal): Promise<SiteFeed> {
  try {
    const res = await fetch(FEED_URL, { signal })
    if (!res.ok) throw new Error(String(res.status))
    return coerce(await res.json())
  } catch {
    return FALLBACK_FEED
  }
}

let feedPromise: Promise<SiteFeed> | null = null
export function getFeed(): Promise<SiteFeed> {
  return (feedPromise ??= loadFeed())
}
