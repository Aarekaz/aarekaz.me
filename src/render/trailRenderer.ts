// Renders the simulation's trail grid to pixels. The trail is computed at a low
// resolution; we paint it into an offscreen canvas at grid size, then upscale to
// the display canvas with smoothing. The smoothing is the trick: it turns blocky
// cells into the soft, organic, glowing look for free.

export class TrailRenderer {
  readonly gridW: number
  readonly gridH: number
  /** Higher = trail saturates to the bright end of the palette sooner. */
  exposure: number

  private offscreen: HTMLCanvasElement
  private octx: CanvasRenderingContext2D
  private image: ImageData

  constructor(gridW: number, gridH: number, exposure = 0.08) {
    this.gridW = gridW
    this.gridH = gridH
    this.exposure = exposure

    this.offscreen = document.createElement("canvas")
    this.offscreen.width = gridW
    this.offscreen.height = gridH
    const ctx = this.offscreen.getContext("2d")
    if (!ctx) throw new Error("2d context unavailable for trail renderer")
    this.octx = ctx
    this.image = ctx.createImageData(gridW, gridH)
  }

  /** Map trail values through a tone curve and the palette LUT into the offscreen image. */
  render(trail: Float32Array, lut: Uint8ClampedArray): void {
    const data = this.image.data
    const n = this.gridW * this.gridH
    const lutMax = lut.length / 3 - 1
    const exposure = this.exposure

    for (let i = 0; i < n; i++) {
      // Filmic-ish tone map: bounded 0..1, never clips harshly.
      const t = 1 - Math.exp(-trail[i] * exposure)
      let li = (t * lutMax) | 0
      if (li < 0) li = 0
      else if (li > lutMax) li = lutMax

      const o = i * 4
      const l3 = li * 3
      data[o] = lut[l3]
      data[o + 1] = lut[l3 + 1]
      data[o + 2] = lut[l3 + 2]
      data[o + 3] = 255
    }
    this.octx.putImageData(this.image, 0, 0)
  }

  /** Upscale the offscreen image onto the display canvas. */
  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(this.offscreen, 0, 0, w, h)
  }
}
