// Physarum (slime-mold) transport network. Each agent senses the pheromone
// trail at three points ahead (left / front / right), steers toward the
// strongest, moves, and deposits a little trail of its own. The trail diffuses
// and decays every step. Nobody choreographs the result — the lifelike veins
// emerge from thousands of agents following this one rule. Pure: no DOM, no React.

import { mulberry32 } from "../lib/random"

export interface PhysarumParams {
  sensorAngle: number // radians between the front sensor and the side sensors
  sensorDist: number // how far ahead (in cells) the agent senses
  turnAngle: number // radians turned per step when steering
  speed: number // cells advanced per step
  deposit: number // trail laid down per step
  diffuse: number // 0..1 — how much each cell blends toward its neighbourhood (low = fine veins)
  decay: number // trail multiplier per step (0..1)
  agentCount: number
}

export class Physarum {
  gridW: number
  gridH: number
  trail: Float32Array
  params: PhysarumParams

  private temp: Float32Array
  private px: Float32Array
  private py: Float32Array
  private ph: Float32Array
  private rng: () => number

  constructor(gridW: number, gridH: number, params: PhysarumParams, seed: number) {
    this.gridW = gridW
    this.gridH = gridH
    this.params = params
    this.trail = new Float32Array(gridW * gridH)
    this.temp = new Float32Array(gridW * gridH)
    this.px = new Float32Array(params.agentCount)
    this.py = new Float32Array(params.agentCount)
    this.ph = new Float32Array(params.agentCount)
    this.rng = mulberry32(seed)
    this.reseed(seed)
  }

  /** Scatter agents and clear the trail. Deterministic for a given seed. */
  reseed(seed: number): void {
    this.rng = mulberry32(seed)
    for (let i = 0; i < this.params.agentCount; i++) {
      this.px[i] = this.rng() * this.gridW
      this.py[i] = this.rng() * this.gridH
      this.ph[i] = this.rng() * Math.PI * 2
    }
    this.trail.fill(0)
  }

  private sample(x: number, y: number): number {
    let ix = x | 0
    let iy = y | 0
    ix = ((ix % this.gridW) + this.gridW) % this.gridW
    iy = ((iy % this.gridH) + this.gridH) % this.gridH
    return this.trail[iy * this.gridW + ix]
  }

  /** Advance the simulation one step. */
  step(): void {
    const { sensorAngle, sensorDist, turnAngle, speed, deposit, diffuse, decay, agentCount } =
      this.params
    const W = this.gridW
    const H = this.gridH

    // 1. Each agent senses, steers, moves, and deposits.
    for (let i = 0; i < agentCount; i++) {
      const x = this.px[i]
      const y = this.py[i]
      const a = this.ph[i]

      const F = this.sample(x + Math.cos(a) * sensorDist, y + Math.sin(a) * sensorDist)
      const L = this.sample(
        x + Math.cos(a + sensorAngle) * sensorDist,
        y + Math.sin(a + sensorAngle) * sensorDist,
      )
      const R = this.sample(
        x + Math.cos(a - sensorAngle) * sensorDist,
        y + Math.sin(a - sensorAngle) * sensorDist,
      )

      let na = a
      if (F > L && F > R) {
        // strongest ahead — keep going
      } else if (F < L && F < R) {
        na = a + (this.rng() < 0.5 ? turnAngle : -turnAngle) // ambiguous — pick a side
      } else if (L > R) {
        na = a + turnAngle
      } else if (R > L) {
        na = a - turnAngle
      }

      let nx = x + Math.cos(na) * speed
      let ny = y + Math.sin(na) * speed
      if (nx < 0) nx += W
      else if (nx >= W) nx -= W
      if (ny < 0) ny += H
      else if (ny >= H) ny -= H

      this.px[i] = nx
      this.py[i] = ny
      this.ph[i] = na
      this.trail[(ny | 0) * W + (nx | 0)] += deposit
    }

    // 2. Diffuse (3x3 box blur, wrapped) and decay into the temp buffer, then swap.
    const trail = this.trail
    const temp = this.temp
    for (let y = 0; y < H; y++) {
      const ym = ((y - 1 + H) % H) * W
      const yc = y * W
      const yp = ((y + 1) % H) * W
      for (let x = 0; x < W; x++) {
        const xm = (x - 1 + W) % W
        const xp = (x + 1) % W
        const sum =
          trail[ym + xm] + trail[ym + x] + trail[ym + xp] +
          trail[yc + xm] + trail[yc + x] + trail[yc + xp] +
          trail[yp + xm] + trail[yp + x] + trail[yp + xp]
        // Blend each cell only partway toward its neighbourhood average. A full
        // mean (diffuse=1) smears everything into blobs; a small blend keeps the
        // crisp vein network while still letting trails connect.
        const center = trail[yc + x]
        const avg = sum / 9
        temp[yc + x] = (center + (avg - center) * diffuse) * decay
      }
    }
    this.trail = temp
    this.temp = trail
  }

  /** Disturb the organism: repel nearby agents and deposit a bright blob. It heals on its own. */
  poke(x: number, y: number, radius: number, strength: number): void {
    const r2 = radius * radius
    for (let i = 0; i < this.params.agentCount; i++) {
      const dx = this.px[i] - x
      const dy = this.py[i] - y
      if (dx * dx + dy * dy < r2) {
        this.ph[i] = Math.atan2(dy, dx) + (this.rng() - 0.5) * 0.6
      }
    }
    const ir = Math.ceil(radius)
    for (let dy = -ir; dy <= ir; dy++) {
      for (let dx = -ir; dx <= ir; dx++) {
        const d2 = dx * dx + dy * dy
        if (d2 > r2) continue
        const gx = ((((x + dx) | 0) % this.gridW) + this.gridW) % this.gridW
        const gy = ((((y + dy) | 0) % this.gridH) + this.gridH) % this.gridH
        this.trail[gy * this.gridW + gx] += strength * (1 - d2 / r2)
      }
    }
  }
}
