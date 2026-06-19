// OKLCH color: perceptually uniform, so interpolated palettes stay even in
// lightness and chroma (no muddy midpoints like sRGB lerps produce). We build
// the creature's palette here and bake it into a lookup table for fast pixel
// mapping during render.

function srgbGamma(c: number): number {
  const x = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
  return Math.max(0, Math.min(1, x))
}

/** OKLCH (L 0..1, C chroma, h degrees) -> sRGB [0..255]. */
export function oklchToRgb(L: number, C: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const a = C * Math.cos(hr)
  const b = C * Math.sin(hr)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return [srgbGamma(r) * 255, srgbGamma(g) * 255, srgbGamma(bl) * 255]
}

export interface PaletteStop {
  pos: number // 0..1 position in the ramp
  L: number
  C: number
  h: number
}

/** Shortest-path hue interpolation (avoids spinning the long way round the wheel). */
function lerpHue(a: number, b: number, f: number): number {
  let dh = b - a
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  return a + dh * f
}

/** Bake palette stops into a flat RGB lookup table for O(1) trail->color mapping. */
export function buildPaletteLUT(stops: PaletteStop[], size = 256): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(size * 3)
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1)
    let a = stops[0]
    let b = stops[stops.length - 1]
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s].pos && t <= stops[s + 1].pos) {
        a = stops[s]
        b = stops[s + 1]
        break
      }
    }
    const span = b.pos - a.pos || 1
    const f = Math.max(0, Math.min(1, (t - a.pos) / span))
    const [r, g, bl] = oklchToRgb(
      a.L + (b.L - a.L) * f,
      a.C + (b.C - a.C) * f,
      lerpHue(a.h, b.h, f),
    )
    lut[i * 3] = r
    lut[i * 3 + 1] = g
    lut[i * 3 + 2] = bl
  }
  return lut
}

/** Base hue that drifts across the day: night indigo -> dawn amber -> noon teal -> dusk magenta. */
export function timeOfDayHue(date = new Date()): number {
  const hour = date.getHours() + date.getMinutes() / 60
  const anchors = [
    { t: 0, h: 265 },
    { t: 6, h: 70 },
    { t: 12, h: 175 },
    { t: 18, h: 320 },
    { t: 24, h: 265 },
  ]
  for (let i = 0; i < anchors.length - 1; i++) {
    if (hour >= anchors[i].t && hour <= anchors[i + 1].t) {
      const f = (hour - anchors[i].t) / (anchors[i + 1].t - anchors[i].t)
      return lerpHue(anchors[i].h, anchors[i + 1].h, f)
    }
  }
  return 265
}

/** The creature's ramp: near-black background -> deep tone -> glowing accent -> hot highlight. */
export function creaturePalette(baseHue: number): PaletteStop[] {
  return [
    { pos: 0.0, L: 0.06, C: 0.02, h: baseHue },
    { pos: 0.35, L: 0.3, C: 0.1, h: baseHue + 8 },
    { pos: 0.7, L: 0.66, C: 0.16, h: baseHue + 28 },
    { pos: 1.0, L: 0.96, C: 0.05, h: baseHue + 48 },
  ]
}
