// The creature's birth. Award-gallery sites (Obys, corentinbernadou) stage a
// brief count-up "preloader" as an authored moment, not a spinner. We borrow the
// gesture: a short incubation that counts to 100 while the organism develops
// underneath, then reveals it.
//
// Same lifecycle pattern as the canvas — a callback ref owns an rAF loop and
// returns its own teardown. No useEffect. Rendered only when motion is allowed;
// reduced-motion visitors skip straight to the settled world.

import { useCallback } from "react"

const DURATION = 2200 // ms — long enough to feel deliberate, short enough to respect

const easeOut = (p: number) => 1 - Math.pow(1 - p, 3)

export function Birth() {
  const setup = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    const num = el.querySelector<HTMLElement>(".birth-count")
    const bar = el.querySelector<HTMLElement>(".birth-bar > i")
    let raf = 0
    let start = 0

    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / DURATION)
      const pct = Math.round(easeOut(p) * 100)
      if (num) num.textContent = String(pct)
      if (bar) bar.style.width = `${pct}%`
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        el.classList.add("done") // CSS fades to transparent, then drops pointer events
      }
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="birth" ref={setup} aria-hidden="true">
      <div className="birth-inner">
        <p className="birth-species">Physarum aarekaz</p>
        <p className="birth-state">incubating</p>
        <div className="birth-bar">
          <i />
        </div>
        <p className="birth-count">0</p>
      </div>
    </div>
  )
}
