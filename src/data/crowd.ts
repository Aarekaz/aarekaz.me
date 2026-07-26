// Optional public presence signal. If VITE_CROWD_URL is configured, one
// anonymous browser id is sent to the endpoint and the page can show how many
// people are here. With no endpoint, the promise resolves to null and the UI
// simply uses quieter copy.

export interface Crowd {
  tending: number
  total: number
}

const CROWD_URL = import.meta.env.VITE_CROWD_URL ?? ""
const STORAGE_KEY = "aarekaz:visitor"

function visitorId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const count = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0

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

let crowdPromise: Promise<Crowd | null> | null = null
export function getCrowd(): Promise<Crowd | null> {
  return (crowdPromise ??= recordAndRead())
}
