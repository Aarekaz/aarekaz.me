// The specimen label. Inspired by tikhon.io's "everything inside one idea": the
// page is a living specimen, so this is its vital-signs card — the real Layer-2
// data made legible. Without this, the data shapes the organism invisibly; here
// a visitor can see *why* today's creature looks the way it does.
//
// Reads the feed via React 19's use() under a Suspense boundary — no useEffect,
// no loading state to manage. The shared getFeed() promise means it costs no
// extra network: the canvas already fetched it.

import { use } from "react"
import { getFeed } from "../data/feed"
import { dailySeed } from "../lib/random"

const fmt = new Intl.NumberFormat("en-US")

function statusLabel(discord: string | null, listening: boolean): string {
  if (listening) return "listening ♪"
  switch (discord) {
    case "online":
      return "online"
    case "idle":
      return "idle"
    case "dnd":
      return "do not disturb"
    default:
      return "resting"
  }
}

export function Vitals() {
  const feed = use(getFeed())
  const strain = String(dailySeed() % 1000).padStart(3, "0")
  const hours = Math.round(feed.wakatime.seconds30d / 3600)

  // [label, value] — each a vital sign the simulation actually responds to.
  const rows: Array<[string, string]> = [
    ["commits", `${fmt.format(feed.github.commits30d)} · 30d`],
    ["coding", `${hours}h · 30d`],
    ["dialects", `${feed.wakatime.languages} languages`],
    ["motion", feed.health.avgSteps == null ? "—" : `${fmt.format(feed.health.avgSteps)} steps`],
    ["status", statusLabel(feed.status.discord, feed.status.listening)],
  ]

  return (
    <aside className="vitals" aria-label="Specimen vital signs">
      <p className="vitals-species">Physarum aarekaz</p>
      <p className="vitals-strain">daily strain №{strain}</p>
      <dl className="vitals-list">
        {rows.map(([label, value]) => (
          <div className="vitals-row" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="vitals-foot">live specimen · fed by real data</p>
    </aside>
  )
}
