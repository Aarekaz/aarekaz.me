import { Suspense } from "react"
import { LivingWorld } from "./components/LivingWorld"
import { Overlay } from "./components/Overlay"
import { Vitals } from "./components/Vitals"
import { useReducedMotion } from "./hooks/useReducedMotion"

export function App() {
  const reduced = useReducedMotion()

  return (
    <main className="stage">
      {/* key forces a clean remount (and a fresh canvas lifecycle) when the
          motion preference changes — Rule 5: reset with key, not effects. */}
      <LivingWorld key={reduced ? "reduced" : "motion"} reduced={reduced} />
      <Overlay />
      {/* Vitals read the feed via use(); Suspense holds them until it resolves.
          fallback={null} keeps the stage clean — they fade in when ready. */}
      <Suspense fallback={null}>
        <Vitals />
      </Suspense>
    </main>
  )
}
