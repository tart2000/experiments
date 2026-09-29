import { CHROME_HEIGHT, drawChrome } from './chrome'
import { WIDTH, type BrowserParams } from './params'

const MAX_PX = 16000 // limite de sécurité d'un canvas

export function mockSize(img: HTMLImageElement | null, p: BrowserParams) {
  const barH = CHROME_HEIGHT[p.browser]
  const imgH = Math.round(img ? (WIDTH * img.naturalHeight) / img.naturalWidth : WIDTH * 0.6)
  return { w: WIDTH + p.padding * 2, h: barH + imgH + p.padding * 2, barH, imgH }
}

/** Réduit l'échelle demandée si le canvas dépasserait la limite. */
export const safeScale = (scale: number, w: number, h: number) => Math.min(scale, MAX_PX / w, MAX_PX / h)

export function renderMock(canvas: HTMLCanvasElement, img: HTMLImageElement | null, p: BrowserParams, wantedScale: number) {
  const { w, h, barH, imgH } = mockSize(img, p)
  const scale = safeScale(wantedScale, w, h)
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)

  // fond
  if (p.background === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#667eea')
    g.addColorStop(1, '#764ba2')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  } else if (p.background !== 'transparent') {
    ctx.fillStyle = p.background === 'white' ? '#ffffff' : '#000000'
    ctx.fillRect(0, 0, w, h)
  }

  const dark = p.theme === 'dark'
  const winH = barH + imgH
  const path = () => {
    ctx.beginPath()
    ctx.roundRect(p.padding, p.padding, WIDTH, winH, p.radius)
  }

  // ombre (le corps opaque de la fenêtre la projette)
  const k = p.shadow / 100
  if (k > 0) {
    ctx.save()
    ctx.shadowColor = `rgba(0,0,0,${0.45 * k})`
    ctx.shadowBlur = 70 * k * scale
    ctx.shadowOffsetY = 24 * k * scale
    ctx.fillStyle = dark ? '#1e1e1e' : '#ffffff'
    path()
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  path()
  ctx.clip()
  ctx.translate(p.padding, p.padding)
  drawChrome(ctx, p.browser, p.theme, { url: p.url, tabTitle: p.tabTitle }, WIDTH)
  if (img) {
    ctx.drawImage(img, 0, barH, WIDTH, imgH)
  } else {
    ctx.fillStyle = dark ? '#1e1e1e' : '#f6f6f6'
    ctx.fillRect(0, barH, WIDTH, imgH)
    ctx.fillStyle = dark ? '#8a8a8e' : '#9a9a9e'
    ctx.font = '500 22px -apple-system, "Geist Variable", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Dépose une image ici, colle-la (⌘V) ou choisis un fichier', WIDTH / 2, barH + imgH / 2)
  }
  ctx.restore()

  // liseré fin autour de la fenêtre
  path()
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)'
  ctx.lineWidth = 1
  ctx.stroke()
}
