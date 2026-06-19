// The living canvas. A React 19 callback ref (with a cleanup return) owns the
// whole lifecycle: build the sim, size the canvas, wire pointer input, run the
// rAF loop — and tear it all down on unmount. No useEffect. When reduced-motion
// changes, the parent remounts this via `key`, so the callback ref re-runs.

import { useCallback } from "react"
import { Physarum } from "../simulation/physarum"
import { TrailRenderer } from "../render/trailRenderer"
import { gridForCanvas, seededParams } from "../data/params"
import { buildPaletteLUT, creaturePalette, timeOfDayHue } from "../lib/oklch"
import { dailySeed } from "../lib/random"

interface Props {
  reduced: boolean
}

// Steps run up front (instead of animating) when motion is reduced, so the
// organism still develops into a finished, static portrait.
const STATIC_STEPS = 220

export function LivingWorld({ reduced }: Props) {
  const setup = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const seed = dailySeed()
      const lut = buildPaletteLUT(creaturePalette(timeOfDayHue()))

      let sim: Physarum
      let renderer: TrailRenderer
      let raf = 0
      let resizeTimer = 0
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5)

      const build = () => {
        const rect = canvas.getBoundingClientRect()
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        const grid = gridForCanvas(canvas.width, canvas.height)
        sim = new Physarum(grid.gridW, grid.gridH, seededParams(seed, grid), seed)
        renderer = new TrailRenderer(grid.gridW, grid.gridH)
      }

      const paint = () => {
        renderer.render(sim.trail, lut)
        renderer.draw(ctx, canvas.width, canvas.height)
      }

      const settleAndPaint = () => {
        for (let i = 0; i < STATIC_STEPS; i++) sim.step()
        paint()
      }

      build()

      if (reduced) {
        settleAndPaint()
      } else {
        const loop = () => {
          sim.step()
          paint()
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      }

      const onResize = () => {
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(() => {
          dpr = Math.min(window.devicePixelRatio || 1, 1.5)
          build()
          if (reduced) settleAndPaint()
        }, 250)
      }
      window.addEventListener("resize", onResize)

      // Pointer disturbs the organism. Throttled so dragging doesn't flood the
      // poke loop (which touches every agent).
      let lastPoke = 0
      const onPointer = (e: PointerEvent) => {
        const now = performance.now()
        if (now - lastPoke < 24) return
        lastPoke = now
        const rect = canvas.getBoundingClientRect()
        const gx = ((e.clientX - rect.left) / rect.width) * sim.gridW
        const gy = ((e.clientY - rect.top) / rect.height) * sim.gridH
        sim.poke(gx, gy, Math.max(6, sim.gridW * 0.045), sim.params.deposit * 7)
      }
      canvas.addEventListener("pointermove", onPointer)
      canvas.addEventListener("pointerdown", onPointer)

      return () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(resizeTimer)
        window.removeEventListener("resize", onResize)
        canvas.removeEventListener("pointermove", onPointer)
        canvas.removeEventListener("pointerdown", onPointer)
      }
    },
    [reduced],
  )

  return <canvas className="living-world" ref={setup} aria-hidden="true" />
}
