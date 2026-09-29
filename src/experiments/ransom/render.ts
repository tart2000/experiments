import { fontById, fontCss } from './fonts'
import type { Bg, LetterSpec, Pt } from './layout'
import type { Background, RansomParams } from './params'
import type { Textures } from './textures'

const M = 2 // marge (px CSS) autour du canvas d'une pièce

const measureCtx = document.createElement('canvas').getContext('2d')!
export function measure(font: string, text: string) {
  measureCtx.font = font
  const m = measureCtx.measureText(text)
  return { advance: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent }
}

function mk(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.ceil(w)
  c.height = Math.ceil(h)
  return c
}

function polyPath(ctx: CanvasRenderingContext2D, pts: Pt[], ox = 0, oy = 0) {
  ctx.beginPath()
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + ox, y + oy) : ctx.moveTo(x + ox, y + oy)))
  ctx.closePath()
}

/** Dessine une image en couvrant (0,0,w,h) avec rotation par quart de tour. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, bg: Extract<Bg, { kind: 'color' | 'paper' }>) {
  const odd = bg.rot % 2 === 1
  const qw = odd ? img.naturalHeight : img.naturalWidth
  const qh = odd ? img.naturalWidth : img.naturalHeight
  const zoom = bg.kind === 'color' ? bg.zoom : 1
  const fine = bg.kind === 'color' ? bg.fine : 0
  const s = Math.max(w / qw, h / qh) * zoom * (bg.kind === 'color' ? 1.15 : 1)
  const ox = bg.kind === 'color' ? bg.ox * Math.max(0, (qw * s - w) / 2) * 0.8 : 0
  const oy = bg.kind === 'color' ? bg.oy * Math.max(0, (qh * s - h) / 2) * 0.8 : 0
  ctx.save()
  ctx.translate(w / 2 + ox, h / 2 + oy)
  ctx.rotate((bg.rot * Math.PI) / 2 + fine)
  if (bg.flip) ctx.scale(-1, 1)
  ctx.drawImage(img, (-img.naturalWidth * s) / 2, (-img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s)
  ctx.restore()
}

/** Papier déchiré : la texture donne la forme (alpha) ; teinte par multiply. */
function drawPaper(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number, bg: Extract<Bg, { kind: 'paper' }>, scale: number) {
  const over = 1.1
  const ow = w * over
  const oh = h * over
  const t = mk(ow * scale, oh * scale)
  const tc = t.getContext('2d')!
  tc.scale(scale, scale)
  // le papier est étiré à la boîte : on dessine avec ses propres proportions ré-étirées
  const draw = (c: CanvasRenderingContext2D) => {
    c.save()
    c.translate(ow / 2, oh / 2)
    c.rotate((bg.rot * Math.PI) / 2)
    if (bg.flip) c.scale(-1, 1)
    const odd = bg.rot % 2 === 1
    const dw = odd ? oh : ow
    const dh = odd ? ow : oh
    c.drawImage(img, -dw / 2, -dh / 2, dw, dh)
    c.restore()
  }
  tc.fillStyle = bg.tint
  tc.fillRect(0, 0, ow, oh)
  tc.globalCompositeOperation = 'multiply'
  draw(tc)
  tc.globalCompositeOperation = 'destination-in'
  draw(tc)
  ctx.drawImage(t, -(ow - w) / 2, -(oh - h) / 2, ow, oh)
}

function renderPiece(s: LetterSpec, tex: Textures, scale: number): HTMLCanvasElement {
  const cv = mk((s.w + M * 2) * scale, (s.h + M * 2) * scale)
  const ctx = cv.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.translate(M, M)

  const bg = s.bg
  if (bg.kind === 'paper') {
    drawPaper(ctx, tex.paper[bg.tex % tex.paper.length], s.w, s.h, bg, scale)
  } else {
    ctx.save()
    polyPath(ctx, s.poly)
    ctx.clip()
    if (bg.kind === 'solid') {
      ctx.fillStyle = bg.color
      ctx.fillRect(-M, -M, s.w + M * 2, s.h + M * 2)
    } else {
      drawCover(ctx, tex.color[bg.tex % tex.color.length], s.w, s.h, bg)
      if (bg.tint) {
        ctx.globalCompositeOperation = 'multiply'
        ctx.globalAlpha = bg.tintAlpha
        ctx.fillStyle = bg.tint
        ctx.fillRect(-M, -M, s.w + M * 2, s.h + M * 2)
      }
    }
    ctx.restore()
  }

  const { frame, outline, textShadow } = s.decoration
  if (frame) {
    ctx.strokeStyle = frame.color
    ctx.lineWidth = frame.width
    const i = frame.inset
    ctx.strokeRect(i, i, s.w - i * 2, s.h - i * 2)
  }

  // texte, centré sur la boîte englobante du glyphe
  const font = fontById(s.fontId)
  ctx.font = fontCss(font, s.size)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(s.char)
  const tx = s.w / 2
  const ty = s.h / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  if (textShadow) {
    ctx.fillStyle = textShadow.color
    ctx.fillText(s.char, tx + textShadow.d, ty + textShadow.d)
  }
  if (outline) {
    ctx.lineJoin = 'round'
    ctx.lineWidth = outline.width
    ctx.strokeStyle = outline.color
    ctx.strokeText(s.char, tx, ty)
  }
  const tf = s.textFill
  if (tf.kind === 'texture') {
    const t = mk(s.w * scale, s.h * scale)
    const tc = t.getContext('2d')!
    tc.scale(scale, scale)
    tc.font = ctx.font
    tc.textAlign = 'center'
    tc.fillText(s.char, tx, ty)
    tc.globalCompositeOperation = 'source-in'
    drawCover(tc, tex.color[tf.tex % tex.color.length], s.w, s.h, {
      kind: 'color', tex: tf.tex, rot: tf.rot, flip: tf.flip, fine: 0, zoom: tf.zoom, ox: tf.ox, oy: tf.oy, tint: null, tintAlpha: 1,
    })
    ctx.drawImage(t, 0, 0, s.w, s.h)
  } else {
    if (tf.kind === 'gradient') {
      const cy = ty - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
      const L = Math.max(m.width, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 2
      const dx = Math.cos(tf.angle) * L
      const dy = Math.sin(tf.angle) * L
      const g = ctx.createLinearGradient(tx - dx, cy - dy, tx + dx, cy + dy)
      g.addColorStop(0, s.textColor)
      g.addColorStop(1, tf.to)
      ctx.fillStyle = g
    } else {
      ctx.fillStyle = s.textColor
    }
    ctx.fillText(s.char, tx, ty)
  }
  return cv
}

const BG: Record<Exclude<Background, 'transparent'>, string> = {
  white: '#ffffff',
  black: '#000000',
}

export function renderNote(
  ctx: CanvasRenderingContext2D,
  letters: LetterSpec[],
  width: number,
  height: number,
  scale: number,
  background: RansomParams['background'],
  tex: Textures,
  filter = 'none',
) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width * scale, height * scale)
  if (background in BG) {
    ctx.fillStyle = BG[background as keyof typeof BG]
    ctx.fillRect(0, 0, width * scale, height * scale)
  }
  for (const s of letters) {
    const piece = renderPiece(s, tex, scale)
    ctx.save()
    ctx.translate(s.cx * scale, s.cy * scale)
    ctx.rotate(s.angle)
    ctx.filter = filter
    if (s.shadow) {
      ctx.shadowColor = `rgba(0,0,0,${s.shadow.alpha})`
      ctx.shadowBlur = s.shadow.blur * scale
      ctx.shadowOffsetX = s.shadow.dx * scale
      ctx.shadowOffsetY = s.shadow.dy * scale
    }
    ctx.drawImage(piece, -(s.w / 2 + M) * scale, -(s.h / 2 + M) * scale)
    ctx.restore()
  }
}
