// The living canvas. A React 19 callback ref (with a cleanup return) owns the
// whole lifecycle: build the sim, size the canvas, wire pointer input, run the
// rAF loop — and tear it all down on unmount. No useEffect. When reduced-motion
// changes, the parent remounts this via `key`, so the callback ref re-runs.
//
// The creature starts from its daily seed instantly, then folds in Anurag's real
// data the moment the baked feed resolves (see src/data/feed.ts) — so the first
// paint is never blocked on the network, but the organism soon *means* something.

import { useCallback } from "react"
import { Physarum } from "../simulation/physarum"
import { TrailRenderer } from "../render/trailRenderer"
import { gridForCanvas, seededParams, mapDataToParams, type GridSpec } from "../data/params"
import { buildPaletteLUT, creaturePalette, liveAccentHue, timeOfDayHue } from "../lib/oklch"
import { dailySeed } from "../lib/random"
import { getFeed, type CreatureFeed } from "../data/feed"

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

      let sim: Physarum
      let renderer: TrailRenderer
      let grid: GridSpec
      let lut: Uint8ClampedArray
      let feed: CreatureFeed | null = null // null until the baked feed resolves
      let pulseAmt = 0 // >0 makes the glow breathe when status is "live"
      let baseExposure = 0.08 // renderer's resting exposure; the pulse oscillates around it
      let frame = 0
      let raf = 0
      let resizeTimer = 0
      let cancelled = false
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5)

      // Recompute the palette + pulse from the current feed. Cheap (256 entries),
      // so it's fine to call on every build and when the feed arrives.
      const applyPalette = () => {
        const hue = liveAccentHue(
          timeOfDayHue(),
          feed?.status.discord ?? null,
          feed?.status.listening ?? false,
        )
        lut = buildPaletteLUT(creaturePalette(hue))
        pulseAmt =
          !reduced && feed && (feed.status.listening || feed.status.discord === "online") ? 0.12 : 0
      }

      const build = () => {
        const rect = canvas.getBoundingClientRect()
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        grid = gridForCanvas(canvas.width, canvas.height)
        const base = seededParams(seed, grid)
        const params = feed ? mapDataToParams(base, feed) : base
        sim = new Physarum(grid.gridW, grid.gridH, params, seed)
        renderer = new TrailRenderer(grid.gridW, grid.gridH)
        baseExposure = renderer.exposure
        applyPalette()
      }

      build()

      const paint = () => {
        renderer.render(sim.trail, lut)
        renderer.draw(ctx, canvas.width, canvas.height)
      }

      const settleAndPaint = () => {
        for (let i = 0; i < STATIC_STEPS; i++) sim.step()
        paint()
      }

      if (reduced) {
        settleAndPaint()
      } else {
        const loop = () => {
          sim.step()
          // A slow, shallow breath on the exposure — only when the feed says the
          // creature is "live" (online or listening). Purely visual.
          if (pulseAmt > 0) renderer.exposure = baseExposure * (1 + pulseAmt * Math.sin(frame * 0.04))
          frame++
          paint()
          raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
      }

      // Feed Anurag's real data in once it loads. getFeed never rejects, so the
      // worst case is the committed fallback — the creature is always shaped.
      getFeed().then((loaded) => {
        if (cancelled) return
        feed = loaded
        sim.params = mapDataToParams(seededParams(seed, grid), feed)
        applyPalette()
        if (reduced) {
          sim.reseed(seed) // clean, deterministic restart for the static portrait
          settleAndPaint()
        }
      })

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
        cancelled = true
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
