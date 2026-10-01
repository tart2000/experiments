import { fontById, fontCss } from './fonts'
import { largestFitting, LINE_HEIGHT, slideGeometry } from './fit'
import type { CarouselParams } from './params'

/** Retour à la ligne par mots (les mots plus longs que la ligne sont coupés). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = []
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of para.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width <= maxW) {
        line = test
        continue
      }
      if (line) lines.push(line)
      line = ''
      let rest = word
      while (ctx.measureText(rest).width > maxW && rest.length > 1) {
        let cut = rest.length - 1
        while (cut > 1 && ctx.measureText(rest.slice(0, cut)).width > maxW) cut--
        lines.push(rest.slice(0, cut))
        rest = rest.slice(cut)
      }
      line = rest
    }
    lines.push(line)
  }
  return lines
}

/** Plus grande taille de police pour laquelle le texte tient dans (maxW × maxH). */
function fit(ctx: CanvasRenderingContext2D, text: string, p: CarouselParams, maxW: number, maxH: number, minSize: number, maxSize: number) {
  const font = fontById(p.font)
  const layout = (size: number) => {
    ctx.font = fontCss(font, size)
    const lines = wrap(ctx, text, maxW)
    return { size, lines, height: lines.length * size * LINE_HEIGHT }
  }
  return layout(largestFitting(minSize, maxSize, (s) => layout(s).height <= maxH))
}

function drawDots(ctx: CanvasRenderingContext2D, cx: number, cy: number, index: number, total: number, W: number, color: string) {
  const r = W * 0.009
  const gap = W * 0.032
  const x0 = cx - ((total - 1) * gap) / 2
  for (let i = 0; i < total; i++) {
    ctx.globalAlpha = i === index ? 1 : 0.28
    ctx.beginPath()
    ctx.arc(x0 + i * gap, cy, i === index ? r * 1.25 : r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawArrow(ctx: CanvasRenderingContext2D, xRight: number, cy: number, W: number, color: string) {
  const len = W * 0.11
  const head = W * 0.022
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(3, W * 0.005)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(xRight - len, cy)
  ctx.lineTo(xRight, cy)
  ctx.moveTo(xRight - head, cy - head)
  ctx.lineTo(xRight, cy)
  ctx.lineTo(xRight - head, cy + head)
  ctx.stroke()
}

/** Dessine une slide. La police doit déjà être chargée. */
export function renderSlide(canvas: HTMLCanvasElement, text: string, index: number, total: number, p: CarouselParams, scale: number, logo: HTMLImageElement | null = null) {
  const g = slideGeometry(p, logo)
  const { w: W, h: H, padX, padY, boxTop, boxW, boxH, decoCy } = g
  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(H * scale)
  const ctx = canvas.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)

  ctx.fillStyle = p.bg
  ctx.fillRect(0, 0, W, H)
  if (logo && g.logoBox) ctx.drawImage(logo, padX, padY, g.logoBox.w, g.logoBox.h)

  const { size, lines, height } = fit(ctx, text, p, boxW, boxH, g.minSize, g.maxSize)
  ctx.font = fontCss(fontById(p.font), size)
  ctx.fillStyle = p.fg
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const lh = size * LINE_HEIGHT
  const top = boxTop + (boxH - height) / 2
  // même placement que le CSS : le demi-interligne est réparti autour de la hauteur de police
  const m = ctx.measureText('Mg')
  const asc = m.fontBoundingBoxAscent
  const desc = m.fontBoundingBoxDescent
  lines.forEach((l, i) => ctx.fillText(l, padX, top + i * lh + (lh - (asc + desc)) / 2 + asc))

  if (p.deco === 'dots') drawDots(ctx, W / 2, decoCy, index, total, W, p.fg)
  if (p.deco === 'arrow' && index < total - 1) drawArrow(ctx, W - padX, decoCy, W, p.fg)
}
