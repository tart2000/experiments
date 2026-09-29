import type { BrowserKind, Theme } from './params'

export interface ChromeOptions {
  url: string
  tabTitle: string
}

export const CHROME_HEIGHT: Record<BrowserKind, number> = { safari: 52, chrome: 84, arc: 44 }

const FONT = '-apple-system, BlinkMacSystemFont, "Geist Variable", "Helvetica Neue", Arial, sans-serif'

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

function lights(ctx: CanvasRenderingContext2D, cy: number, x0 = 20) {
  ;['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.beginPath()
    ctx.arc(x0 + i * 20, cy, 6, 0, Math.PI * 2)
    ctx.fillStyle = c
    ctx.fill()
  })
}

function stroke(ctx: CanvasRenderingContext2D, color: string, w = 1.6) {
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const chevron = (ctx: CanvasRenderingContext2D, cx: number, cy: number, dir: 1 | -1, color: string) => {
  stroke(ctx, color, 2)
  ctx.beginPath()
  ctx.moveTo(cx - 3 * dir, cy - 6)
  ctx.lineTo(cx + 3 * dir, cy)
  ctx.lineTo(cx - 3 * dir, cy + 6)
  ctx.stroke()
}

const reload = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
  stroke(ctx, color, 1.6)
  ctx.beginPath()
  ctx.arc(cx, cy, 5.5, -Math.PI * 0.35, Math.PI * 1.45)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx + 3, cy - 8)
  ctx.lineTo(cx + 6.5, cy - 4.6)
  ctx.lineTo(cx + 1.8, cy - 3.2)
  ctx.stroke()
}

const lock = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
  ctx.fillStyle = color
  rr(ctx, cx - 4.5, cy - 1, 9, 7, 1.5)
  ctx.fill()
  stroke(ctx, color, 1.5)
  ctx.beginPath()
  ctx.arc(cx, cy - 1.5, 3, Math.PI, 0)
  ctx.stroke()
}

const plus = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
  stroke(ctx, color, 1.6)
  ctx.beginPath()
  ctx.moveTo(cx - 6, cy)
  ctx.lineTo(cx + 6, cy)
  ctx.moveTo(cx, cy - 6)
  ctx.lineTo(cx, cy + 6)
  ctx.stroke()
}

const share = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
  stroke(ctx, color, 1.5)
  ctx.beginPath()
  ctx.moveTo(cx - 5, cy - 1)
  ctx.lineTo(cx - 5, cy + 7)
  ctx.lineTo(cx + 5, cy + 7)
  ctx.lineTo(cx + 5, cy - 1)
  ctx.moveTo(cx, cy + 3)
  ctx.lineTo(cx, cy - 8)
  ctx.moveTo(cx - 3.5, cy - 4.5)
  ctx.lineTo(cx, cy - 8)
  ctx.lineTo(cx + 3.5, cy - 4.5)
  ctx.stroke()
}

const sidebar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
  stroke(ctx, color, 1.5)
  rr(ctx, cx - 8, cy - 6.5, 16, 13, 3)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - 3, cy - 6.5)
  ctx.lineTo(cx - 3, cy + 6.5)
  ctx.stroke()
}

/** Dessine la barre du navigateur en (0,0) sur `w` de large ; retourne sa hauteur. */
export function drawChrome(ctx: CanvasRenderingContext2D, kind: BrowserKind, theme: Theme, o: ChromeOptions, w: number): number {
  const dark = theme === 'dark'
  const h = CHROME_HEIGHT[kind]
  ctx.save()
  ctx.textBaseline = 'middle'

  if (kind === 'safari') {
    const bar = dark ? '#2d2d2f' : '#ececec'
    const line = dark ? '#161616' : '#d0d0d0'
    const field = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
    const ink = dark ? '#c9c9cc' : '#5a5a5d'
    ctx.fillStyle = bar
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = line
    ctx.fillRect(0, h - 1, w, 1)
    const cy = h / 2
    lights(ctx, cy)
    sidebar(ctx, 106, cy, ink)
    chevron(ctx, 150, cy, -1, ink)
    chevron(ctx, 182, cy, 1, ink)
    const fw = Math.min(560, w * 0.42)
    const fx = (w - fw) / 2
    ctx.fillStyle = field
    rr(ctx, fx, cy - 15, fw, 30, 8)
    ctx.fill()
    ctx.font = `500 14px ${FONT}`
    ctx.fillStyle = dark ? '#e6e6e8' : '#3a3a3c'
    const text = fit(ctx, o.url, fw - 80)
    const tw = ctx.measureText(text).width
    ctx.textAlign = 'left'
    ctx.fillText(text, fx + fw / 2 - tw / 2 + 7, cy + 0.5)
    lock(ctx, fx + fw / 2 - tw / 2 - 7, cy + 0.5, ink)
    reload(ctx, fx + fw - 18, cy, ink)
    share(ctx, w - 110, cy, ink)
    plus(ctx, w - 70, cy, ink)
    rr(ctx, w - 42, cy - 6, 12, 12, 2.5)
    stroke(ctx, ink, 1.5)
    ctx.stroke()
  } else if (kind === 'chrome') {
    const strip = dark ? '#202124' : '#dee1e6'
    const tab = dark ? '#35363a' : '#ffffff'
    const omni = dark ? '#202124' : '#f1f3f4'
    const ink = dark ? '#9aa0a6' : '#5f6368'
    const text = dark ? '#e8eaed' : '#202124'
    ctx.fillStyle = strip
    ctx.fillRect(0, 0, w, 40)
    ctx.fillStyle = tab
    ctx.fillRect(0, 40, w, h - 40)
    lights(ctx, 20)
    // onglet actif
    const tx = 92
    const tw = 240
    ctx.fillStyle = tab
    rr(ctx, tx, 8, tw, 32.5, [10, 10, 0, 0])
    ctx.fill()
    ctx.beginPath()
    ctx.arc(tx + 20, 24, 7, 0, Math.PI * 2)
    ctx.fillStyle = '#4285f4'
    ctx.fill()
    ctx.font = `12.5px ${FONT}`
    ctx.fillStyle = text
    ctx.textAlign = 'left'
    ctx.fillText(fit(ctx, o.tabTitle, tw - 80), tx + 36, 24.5)
    stroke(ctx, ink, 1.4)
    ctx.beginPath()
    ctx.moveTo(tx + tw - 26, 20)
    ctx.lineTo(tx + tw - 18, 28)
    ctx.moveTo(tx + tw - 18, 20)
    ctx.lineTo(tx + tw - 26, 28)
    ctx.stroke()
    plus(ctx, tx + tw + 24, 24, ink)
    // barre d'outils
    const cy = 62
    chevron(ctx, 30, cy, -1, ink)
    chevron(ctx, 66, cy, 1, ink)
    reload(ctx, 102, cy, ink)
    const ox = 132
    const ow = w - ox - 64
    ctx.fillStyle = omni
    rr(ctx, ox, cy - 16, ow, 32, 16)
    ctx.fill()
    lock(ctx, ox + 22, cy + 0.5, ink)
    ctx.font = `14px ${FONT}`
    ctx.fillStyle = text
    ctx.fillText(fit(ctx, o.url, ow - 90), ox + 42, cy + 0.5)
    ctx.fillStyle = ink
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.arc(w - 28, cy + i * 5.5, 1.7, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = dark ? '#1a1a1a' : '#dadce0'
    ctx.fillRect(0, h - 1, w, 1)
  } else {
    // arc : barre fine, champ centré
    const bar = dark ? '#1c1c1e' : '#f3f1f0'
    const pill = dark ? '#2c2c2e' : '#ffffff'
    const ink = dark ? '#a1a1a6' : '#77726f'
    ctx.fillStyle = bar
    ctx.fillRect(0, 0, w, h)
    const cy = h / 2
    lights(ctx, cy, 18)
    const pw = Math.min(520, w * 0.4)
    const px = (w - pw) / 2
    ctx.fillStyle = pill
    rr(ctx, px, cy - 14, pw, 28, 10)
    ctx.fill()
    ctx.font = `500 13.5px ${FONT}`
    ctx.fillStyle = dark ? '#e6e6e8' : '#2a2726'
    const t = fit(ctx, o.url, pw - 70)
    const tw = ctx.measureText(t).width
    ctx.textAlign = 'left'
    ctx.fillText(t, px + pw / 2 - tw / 2 + 7, cy + 0.5)
    lock(ctx, px + pw / 2 - tw / 2 - 7, cy + 0.5, ink)
  }
  ctx.restore()
  return h
}
