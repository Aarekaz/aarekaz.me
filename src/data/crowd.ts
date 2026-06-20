// Layer 3: the crowd. The creature is tended not only by Anurag's data but by
// whoever is watching. A single anonymous ping records this visit and reads back
// how many others are here — surfaced as a vital sign in Vitals.
//
// Mirrors the feed module (src/data/feed.ts): one memoized promise that never
// rejects. Any failure — including no endpoint configured — resolves to null, so
// the UI simply omits the row and nothing breaks before the Worker is deployed.
//
// Set VITE_CROWD_URL to the public Worker endpoint (e.g.
// https://api.anuragd.me/v1/crowd) to make it live. Recording and reading are
// the same round-trip, so a page view counts exactly once.

export interface Crowd {
  tending: number // distinct visitors active in the last hour (includes you)
  total: number // all-time distinct visitors
}

const CROWD_URL = import.meta.env.VITE_CROWD_URL ?? ""
const STORAGE_KEY = "aarekaz:visitor"

// A stable, anonymous id for this browser so refreshes count once per day. Only
// the id leaves the browser; the server stores its hash, never the raw value.
function visitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    // private mode / storage blocked — an ephemeral id still works for one view
    return crypto.randomUUID()
  }
}

const count = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0

/** Record this visit and read the current crowd. Never rejects: any failure —
 *  or no endpoint configured — resolves to null and the row is hidden. */
async function recordAndRead(): Promise<Crowd | null> {
  if (!CROWD_URL) return null
  try {
    const res = await fetch(CROWD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: visitorId() }),
    })
    if (!res.ok) throw new Error(String(res.status))
    const raw = (await res.json()) as Record<string, unknown>
    return { tending: count(raw.tending), total: count(raw.total) }
  } catch {
    return null
  }
}

// One shared request for the whole app (like getFeed): the singleton guarantees
// a page view pings the server exactly once, even with React's double-render.
let _crowd: Promise<Crowd | null> | null = null
export function getCrowd(): Promise<Crowd | null> {
  return (_crowd ??= recordAndRead())
}
