// Decides the simulation's grid size and parameters. Today this comes only from
// the daily seed; layer 2 will add mapDataToParams() to fold in live signals
// (commits -> density, time -> palette, steps -> speed, weather -> turbulence).

import { mulberry32 } from "../lib/random"
import type { PhysarumParams } from "../simulation/physarum"

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
