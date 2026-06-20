// Build-time data bake. Runs on the build machine (laptop or CI) where the
// secret API_TOKEN lives — NEVER in the browser. It fetches the authed API,
// distills it down to a handful of harmless scalars, and writes
// public/creature-feed.json. The shipped site only ever sees those numbers.
//
//   API_TOKEN=... npm run bake
//
// Robust by design: a slow or failing endpoint degrades to that section's
// fallback rather than breaking the build. If the whole API is unreachable and
// a previous feed exists, that feed is kept untouched.

import { writeFile, readFile, mkdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = resolve(ROOT, "public/creature-feed.json")

const API_BASE = process.env.API_BASE ?? "https://api.anuragd.me"
const API_TOKEN = process.env.API_TOKEN ?? ""
const TIMEOUT_MS = 8000

// Mirrors src/data/feed.ts FALLBACK_FEED — a believable resting creature so the
// site is shaped and alive even with no network at build time.
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

// Each reducer is wrapped so one bad endpoint can't sink the others.
async function safe(label, fn, fallback) {
  try {
    const value = await fn()
    console.log(`  ✓ ${label}`)
    return value
  } catch (err) {
    console.warn(`  ⚠ ${label} failed (${err.message}) — using fallback`)
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
    // No token: don't clobber a previously-baked real feed with fallback.
    try {
      await readFile(OUT)
      console.warn("⚠ API_TOKEN not set — keeping existing feed (no live fetch).")
      return
    } catch {
      console.warn("⚠ API_TOKEN not set and no feed present — writing fallback.")
    }
  }
  console.log(`Baking creature feed from ${API_BASE} …`)

  const feed = {
    generatedAt: new Date().toISOString(),
    github: await safe("github", bakeGithub, FALLBACK.github),
    wakatime: await safe("wakatime", bakeWakatime, FALLBACK.wakatime),
    health: await safe("health", bakeHealth, FALLBACK.health),
    status: await safe("status", bakeStatus, FALLBACK.status),
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(feed, null, 2) + "\n")
  console.log(`✓ Wrote ${OUT}`)
}

main().catch(async (err) => {
  // Total failure: keep any existing feed so a deploy never ships an empty one.
  try {
    await readFile(OUT)
    console.warn(`⚠ Bake failed (${err.message}) — keeping existing feed.`)
    process.exit(0)
  } catch {
    console.error(`✖ Bake failed and no existing feed: ${err.message}`)
    process.exit(1)
  }
})
