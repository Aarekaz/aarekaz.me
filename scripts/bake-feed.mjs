// Build-time data bake. Runs on the build machine, where API_TOKEN can exist.
// It fetches the authed API, distills it down to harmless public scalars, and
// writes public/live-feed.json. The browser never sees the token.
//
//   API_TOKEN=... npm run bake
//
// A slow or failing endpoint degrades to that section's fallback rather than
// breaking the build. If the whole API is unreachable and a previous feed
// exists, that feed is kept untouched.

import { writeFile, readFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = resolve(ROOT, "public/live-feed.json")

const API_BASE = process.env.API_BASE ?? "https://api.anuragd.me"
const API_TOKEN = process.env.API_TOKEN ?? ""
const TIMEOUT_MS = 8000

const FALLBACK = {
  github: { commits30d: 120, activeDays30d: 18, repos: 6 },
  wakatime: { seconds30d: 180000, languages: 4 },
  health: { avgSteps: 7000, workouts: 3 },
  status: { discord: "online", listening: false },
}

async function get(path) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { authorization: `Bearer ${API_TOKEN}` },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`${path} -> ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function safe(label, fn, fallback) {
  try {
    const value = await fn()
    console.log(`  ok ${label}`)
    return value
  } catch (err) {
    console.warn(`  warn ${label} failed (${err.message}); using fallback`)
    return fallback
  }
}

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

async function bakeGithub() {
  const d = await get("/v1/github")
  const daily = Array.isArray(d.daily) ? d.daily : []
  return {
    commits30d: daily.reduce((s, r) => s + num(r.count), 0),
    activeDays30d: daily.filter((r) => num(r.count) > 0).length,
    repos: Array.isArray(d.repos) ? d.repos.length : 0,
  }
}

async function bakeWakatime() {
  const d = await get("/v1/wakatime")
  const days = Array.isArray(d.days) ? d.days : []
  const langs = Array.isArray(d.languages) ? d.languages : []
  return {
    seconds30d: Math.round(days.reduce((s, r) => s + num(r.total_seconds), 0)),
    languages: new Set(langs.map((l) => l.name)).size,
  }
}

async function bakeHealth() {
  const d = await get("/v1/health/summary")
  const avg = d.averages_7_days ?? {}
  return {
    avgSteps: avg.steps == null ? null : num(avg.steps),
    workouts: Array.isArray(d.recent_workouts) ? d.recent_workouts.length : 0,
  }
}

async function bakeStatus() {
  const d = await get("/v1/status")
  return {
    discord: typeof d.discord_status === "string" ? d.discord_status : null,
    listening: Boolean(d.spotify),
  }
}

async function main() {
  if (!API_TOKEN) {
    try {
      await readFile(OUT)
      console.warn("warn API_TOKEN not set; keeping existing live feed")
      return
    } catch {
      console.warn("warn API_TOKEN not set and no feed present; writing fallback")
    }
  }
  console.log(`Baking live feed from ${API_BASE}`)

  const feed = {
    generatedAt: new Date().toISOString(),
    github: await safe("github", bakeGithub, FALLBACK.github),
    wakatime: await safe("wakatime", bakeWakatime, FALLBACK.wakatime),
    health: await safe("health", bakeHealth, FALLBACK.health),
    status: await safe("status", bakeStatus, FALLBACK.status),
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(feed, null, 2) + "\n")
  console.log(`ok wrote ${OUT}`)
}

main().catch(async (err) => {
  try {
    await readFile(OUT)
    console.warn(`warn bake failed (${err.message}); keeping existing feed`)
    process.exit(0)
  } catch {
    console.error(`error bake failed and no existing feed: ${err.message}`)
    process.exit(1)
  }
})
