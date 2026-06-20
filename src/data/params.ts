// Decides the simulation's grid size and parameters. Today this comes only from
// the daily seed; layer 2 will add mapDataToParams() to fold in live signals
// (commits -> density, time -> palette, steps -> speed, weather -> turbulence).

import { mulberry32 } from "../lib/random"
import type { PhysarumParams } from "../simulation/physarum"
import type { CreatureFeed } from "./feed"

export interface GridSpec {
  gridW: number
  gridH: number
}

/**
 * A simulation grid for a canvas of the given backing-store size. The longest
 * side is capped so blur cost and agent count stay bounded regardless of screen.
 */
export function gridForCanvas(canvasW: number, canvasH: number, maxDim = 360): GridSpec {
  const scale = Math.min(1, maxDim / Math.max(canvasW, canvasH))
  return {
    gridW: Math.max(2, Math.round(canvasW * scale)),
    gridH: Math.max(2, Math.round(canvasH * scale)),
  }
}

/** Deterministic parameters for a seed. The same day yields the same creature. */
export function seededParams(seed: number, grid: GridSpec): PhysarumParams {
  const rng = mulberry32(seed ^ 0x9e3779b9)
  const between = (a: number, b: number) => a + rng() * (b - a)
  const area = grid.gridW * grid.gridH

  return {
    sensorAngle: between(0.4, 0.85),
    sensorDist: between(5, 10),
    turnAngle: between(0.35, 0.7),
    speed: between(0.7, 1.1),
    deposit: 5,
    diffuse: between(0.12, 0.26),
    decay: between(0.9, 0.95),
    agentCount: Math.max(2000, Math.min(16000, Math.round(area * 0.2))),
  }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Fold Anurag's real signals onto the seeded base. We *nudge* the daily
 * parameters rather than replace them: the creature keeps its day's character
 * but visibly shifts with the data. agentCount and the spatial sensors stay
 * fixed so the change can be applied to a live simulation without reallocating
 * (and so the result is always one of the day's plausible creatures). Every
 * output is clamped to the same range the seed draws from, so no real-world
 * number — a quiet week or a frantic one — can ever make it ugly.
 *
 *   commits   -> deposit   (busier = denser, brighter veins)
 *   coding    -> speed     (more hours = faster, more restless flow)
 *   languages -> turnAngle (more variety = more branching)
 *   movement  -> diffuse   (more steps/workouts = looser, more turbulent)
 */
export function mapDataToParams(base: PhysarumParams, feed: CreatureFeed): PhysarumParams {
  const commitIntensity = clamp01(
    (feed.github.commits30d / 250) * 0.6 + (feed.github.activeDays30d / 30) * 0.4,
  )
  const codingIntensity = clamp01(feed.wakatime.seconds30d / (50 * 3600))
  const branching = clamp01(feed.wakatime.languages / 6)
  const movement = clamp01(
    clamp01((feed.health.avgSteps ?? 0) / 12000) * 0.7 + clamp01(feed.health.workouts / 12) * 0.3,
  )

  return {
    ...base,
    deposit: clamp(base.deposit * lerp(0.7, 1.6, commitIntensity), 3, 9),
    speed: clamp(base.speed * lerp(0.8, 1.35, codingIntensity), 0.6, 1.5),
    turnAngle: clamp(base.turnAngle * lerp(0.8, 1.4, branching), 0.3, 0.95),
    diffuse: clamp(base.diffuse * lerp(0.7, 1.5, movement), 0.1, 0.34),
  }
}
