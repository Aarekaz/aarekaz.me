# aarekaz.me — "A Living World" — Design

**Date:** 2026-06-19
**Status:** Approved (build in progress)

## One-sentence concept

A creature that lives on the internet — alive on its own, fed by Anurag's real
data, shaped by visitors, and painted as generative art.

## Why this exists

`anuragd.me` is the complete, polished archive (blog, projects, photography,
shelf, resume). `aarekaz.me` is a **second** site with no obligation to repeat
that. It is the creative/experiential counterpart: an experience the archive
can't be. Research into award-winning creative sites (Bruno Simon, Lusion,
One Million Checkboxes, Patatap) and generative artists (Tyler Hobbs, Matt
DesLauriers, Physarum/Lenia work) pointed to one conclusion: the memorable
sites are *alive* — they have emergence, agency, or the visitor inside them.
That is also Anurag's domain (agents, systems, emergence), so the living-world
concept is both distinctive and authentically him.

## The four facets (one thing, not four)

| Layer | Facet | What it adds |
|-------|-------|--------------|
| Core (A) | **Alive** | A real-time emergent organism — the heartbeat. |
| Seed (B) | **Your data** | Live signals tune the creature's mood/density/palette. |
| Shape (C) | **The crowd** | Visitors poke/feed it and leave traces it remembers. |
| Render (D) | **Atmosphere** | Shader-grade light, depth, and color over everything. |

These are layers of a single living world, built and shipped in order. Each
layer stands on its own and improves the previous one.

## The creature

**Physarum (slime-mold) agent simulation.** Thousands of agents sense and
deposit a pheromone trail, self-organizing into organic, breathing, vein-like
networks. Chosen because:

- It is a genuine emergent system (not a looped animation) — never repeats.
- Every parameter (agent count, sensor angle/distance, turn angle, speed,
  deposit, decay) is a knob that live data can later turn.
- The aesthetic reads as a living organism, matching the concept exactly.

The simulation rule is isolated behind a small interface, so it can be swapped
for particle-life or flocking without touching render/data/interaction code.

## Architecture

Small, isolated, independently understandable units:

- `src/lib/random.ts` — `mulberry32` seeded PRNG + string→seed hash. Makes the
  daily creature deterministic.
- `src/lib/oklch.ts` — OKLCH→sRGB conversion, palette ramp construction, and a
  256-entry lookup table for fast trail→color mapping. Time-of-day sets base hue.
- `src/simulation/physarum.ts` — pure engine. Owns agent + trail typed arrays;
  exposes `step()`, `poke(x, y, radius, strength)`, `reseed(seed)`, and the
  `trail`/`gridW`/`gridH` it renders from. No DOM. Unit-testable.
- `src/render/trailRenderer.ts` — maps the trail grid to an offscreen
  `ImageData`, then upscales to the display canvas with smoothing for the soft
  organic look. Pluggable: a WebGL atmosphere pass (layer D) slots in behind it.
- `src/data/params.ts` — default params + `seededParams(seed)`; a
  `mapDataToParams(signals)` stub that layer 2 fills from `api.anuragd.me`.
- `src/hooks/useReducedMotion.ts` — `useSyncExternalStore` over the
  `prefers-reduced-motion` media query. (Custom hook — no `useEffect` in
  components.)
- `src/components/LivingWorld.tsx` — the canvas. A **callback ref** (React 19,
  with cleanup return) sets up the sim, sizing, pointer input, and the rAF loop
  on mount and tears it down on unmount. Remounts via `key` when reduced-motion
  changes. No `useEffect`.
- `src/components/Overlay.tsx` — minimal, elegant identity overlay: name, one
  line, links to anuragd.me / email / GitHub, and a machine-readable JSON block
  for agents (on-brand).
- `src/App.tsx` — composes `LivingWorld` + `Overlay`.

## Data flow

```
seed (today's date)  ─┐
live signals (later) ─┼─> mapDataToParams ─> params ─> physarum.step() ─> trail
pointer poke ─────────┘                                   │
                                       trailRenderer ─> canvas pixels
```

For v1, `params` come from `seededParams(dateSeed)` only. Layer 2 adds the live
branch; the rest is unchanged.

## v1 scope (build first)

A full-screen living Physarum creature that is **stunning and shippable on its
own**:

- Curated OKLCH palette with a time-of-day mood shift.
- Pointer-reactive: hovering/clicking disturbs the creature; it heals.
- Deterministic daily seed — "today's creature."
- `prefers-reduced-motion`: develop a calm static frame, then stop animating.
- Responsive + performant (capped grid resolution and agent count; trail grid
  upscaled with smoothing rather than rendering at full device resolution).
- Minimal identity overlay + machine-readable block.

**Explicitly out of v1:** live data wiring (layer 2), visitor persistence
(layer 3), WebGL shader atmosphere (layer 4). Each is a later, separate slice.

## Performance plan

- Trail grid longest side capped at 360 cells; agent count derived from grid
  area and clamped (≈2k–14k).
- One simulation step per animation frame.
- Display canvas at ≤1.5× DPR; softness comes from upscaling the low-res grid,
  so high device resolution is unnecessary.
- 3×3 separable-free box blur + decay over the grid each frame (O(cells)).

## Error handling & fallbacks

- No-JS / agents: the overlay's identity text + JSON block render in the static
  HTML so the site is meaningful without the simulation.
- `prefers-reduced-motion`: no continuous animation.
- Canvas context unavailable: overlay still renders; the canvas stays blank
  rather than throwing.

## Testing

- `simulation/physarum.ts` is pure and unit-testable: seeded `reseed` →
  deterministic agent state; `step()` conserves agent count and keeps positions
  in-bounds; `poke` perturbs only agents within radius.
- `lib/oklch.ts`: known OKLCH values convert to expected sRGB (within tolerance);
  LUT is monotonic in lightness.
- Manual: run the app, confirm 60fps on the core, reduced-motion path, and
  pointer interaction.

## Tech stack

Keep the existing **Vite + React 19 + TypeScript** static app. No framework
change. Deploys as static output (`dist`).

## Build order

1. **Alive core** (v1, this spec).
2. **Your data** — `api.anuragd.me` → `mapDataToParams`.
3. **The crowd** — poke/feed persistence (Cloudflare Worker + D1, matching the
   existing api).
4. **Atmosphere** — WebGL shader background.
