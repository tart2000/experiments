import { hash2, mulberry32, pick, signed, type Rng } from '@/lib/prng'
import { fontById, fontCss } from './fonts'
import type { RansomParams } from './params'
import { paletteById, type PaletteSet } from './palettes'
import { COLOR_COUNT, PAPER_COUNT } from './textures'

export type Pt = [number, number]

export type Bg =
  | { kind: 'solid'; color: string }
  | { kind: 'color'; tex: number; rot: number; flip: boolean; fine: number; zoom: number; ox: number; oy: number; tint: string | null; tintAlpha: number }
  | { kind: 'paper'; tex: number; rot: number; flip: boolean; tint: string }

export interface LetterSpec {
  char: string
  index: number
  cx: number
  cy: number
  w: number
  h: number
  padX: number // marges autour du glyphe, en fraction de la taille
  padY: number
  angle: number // radians
  fontId: string
  size: number
  textColor: string // couleur unie, ou début du dégradé
  textFill: TextFill
  bg: Bg
  poly: Pt[] // forme (vide pour paper : la forme est celle de la texture)
  shadow: { dx: number; dy: number; blur: number; alpha: number } | null
  decoration: Decoration
}

/** Remplissage du glyphe : uni (textColor), dégradé (textColor → to) ou texture. */
export type TextFill =
  | { kind: 'solid' }
  | { kind: 'gradient'; to: string; angle: number }
  | { kind: 'texture'; tex: number; rot: number; flip: boolean; zoom: number; ox: number; oy: number }

/** Décorations optionnelles d'une lettre : toutes facultatives. */
export interface Decoration {
  frame?: { color: string; width: number; inset: number } // cadre autour de la lettre
  outline?: { color: string; width: number } // contour du glyphe
  textShadow?: { color: string; d: number } // ombre portée du glyphe
}

export interface Measure {
  (fontCssStr: string, text: string): { advance: number; asc: number; desc: number }
}

function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}
function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

function textColorFor(rng: Rng, bg: string, pal: PaletteSet): string {
  const pool = [...pal.colors, ...pal.inks, ...pal.inks].filter((c) => contrast(c, bg) >= 3.6)
  if (pool.length === 0) return lum(bg) > 0.4 ? pal.inks[0] : pal.light[0]
  return pick(rng, pool)
}

/** Réglages manuels d'une lettre (clé = index du caractère dans le texte). Tout est facultatif. */
export interface LetterOverride {
  fontId?: string
  case?: 'upper' | 'lower'
  sizeScale?: number
  padX?: number // marge gauche/droite, en fraction de la taille
  padY?: number // marge haut/bas, en fraction de la taille
  angle?: number // degrés
  textColor?: string
  textFill?: TextFill['kind']
  textColor2?: string // fin du dégradé
  textGradAngle?: number // degrés
  textTex?: number
  bgKind?: 'solid' | 'color' | 'paper'
  bgColor?: string | null // null = texture sans teinte
  tex?: number
  frame?: boolean
  outline?: boolean
  textShadow?: boolean
  shadow?: boolean
}

export function layout(p: RansomParams, measure: Measure): { letters: LetterSpec[]; height: number } {
  const pal = paletteById(p.palette)
  const fontIds = p.fonts.length ? p.fonts : ['anton']
  const maxW = p.width - p.padding * 2
  const chars = Array.from(p.text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\s+$/, ''))

  interface Word { pieces: LetterSpec[]; width: number; br?: boolean }
  const words: Word[] = []
  let cur: Word = { pieces: [], width: 0 }
  const spaceGap = p.fontSize * 0.4 + p.spacing

  chars.forEach((raw, index) => {
    if (raw === ' ' || raw === '\n') {
      if (cur.pieces.length) words.push(cur)
      cur = { pieces: [], width: 0 }
      if (raw === '\n') words.push({ pieces: [], width: 0, br: true })
      return
    }
    // 4 flux indépendants par lettre : modifier un aspect (override) ne change pas les autres
    const base = hash2(p.seed, index)
    const rg = mulberry32(base)
    const rb = mulberry32(hash2(base, 1))
    const rc = mulberry32(hash2(base, 2))
    const rd = mulberry32(hash2(base, 3))
    const ov: LetterOverride = p.overrides?.[index] ?? {}
    const pickI = <T,>(arr: readonly T[], r: number) => arr[Math.floor(r * arr.length)]

    // --- flux géométrie / type
    const autoFont = pick(rg, fontIds)
    const autoUpper = p.caseMode === 'upper' || (p.caseMode === 'mixed' && rg() < 0.6)
    const sizeR = signed(rg)
    const kindRoll = rg() * 100
    const padXR = rg()
    const padYR = rg()
    const angleR = signed(rg)
    const jitterR = signed(rg)

    const fontId = ov.fontId ?? autoFont
    const upper = ov.case ? ov.case === 'upper' : autoUpper
    const char = p.caseMode === 'typed' && !ov.case ? raw : upper ? raw.toUpperCase() : raw.toLowerCase()
    const size = p.fontSize * (1 + sizeR * (p.sizeVar / 100) * 0.6) * (ov.sizeScale ?? 1)
    const m = measure(fontCss(fontById(fontId), size), char)

    const bgKind = ov.bgKind ?? (kindRoll < p.paperPct ? 'paper' : kindRoll < p.paperPct + p.texturePct ? 'color' : 'solid')
    const paperK = bgKind === 'paper' ? 1.5 : 1
    const padX = size * (ov.padX ?? (0.04 + padXR * 0.08) * paperK)
    const padY = size * (ov.padY ?? (0.03 + padYR * 0.06) * paperK)
    const w = Math.max(m.advance, size * 0.42) + padX * 2
    const h = m.asc + m.desc + padY * 2

    // --- flux fond
    const lightRoll = rb()
    const lightIdx = rb()
    const palIdx = rb()
    const texR = rb()
    const rotR = rb()
    const flipR = rb()
    const fineR = signed(rb)
    const zoomR = rb()
    const oxR = signed(rb)
    const oyR = signed(rb)
    const tintedRoll = rb()
    const tintAlphaR = rb()
    const solidRoll = rb()
    const cuts = Array.from({ length: 8 }, () => rb())

    let bg: Bg
    let baseColor: string
    let poly: Pt[] = []
    if (bgKind === 'paper') {
      const tint = ov.bgColor ?? (lightRoll < 0.6 ? pickI(pal.light, lightIdx) : pickI(pal.colors, palIdx))
      baseColor = tint
      bg = { kind: 'paper', tex: ov.tex ?? Math.floor(texR * PAPER_COUNT), rot: Math.floor(rotR * 4), flip: flipR < 0.5, tint }
    } else {
      if (bgKind === 'color') {
        const tint = ov.bgColor === null ? null : (ov.bgColor ?? (tintedRoll < 0.6 ? pickI(pal.colors, palIdx) : null))
        baseColor = tint ?? '#d8d4cc'
        bg = {
          kind: 'color', tex: ov.tex ?? Math.floor(texR * COLOR_COUNT), rot: Math.floor(rotR * 4), flip: flipR < 0.5,
          fine: fineR * 0.12, zoom: 1 + zoomR * 1.4, ox: oxR, oy: oyR, tint, tintAlpha: 0.55 + tintAlphaR * 0.45,
        }
      } else {
        baseColor = ov.bgColor ?? (solidRoll < 0.25 ? pickI(pal.light, lightIdx) : pickI(pal.colors.concat([pal.inks[0], pal.inks[0], pal.light[0]]), palIdx))
        bg = { kind: 'solid', color: baseColor }
      }
      // quadrilatère à côtés droits : chaque coin rentre d'une quantité aléatoire (souvent faible)
      const cut = (pad: number, r: number) => pad * 0.9 * r ** 2
      poly = [
        [cut(padX, cuts[0]), cut(padY, cuts[1])],
        [w - cut(padX, cuts[2]), cut(padY, cuts[3])],
        [w - cut(padX, cuts[4]), h - cut(padY, cuts[5])],
        [cut(padX, cuts[6]), h - cut(padY, cuts[7])],
      ]
    }

    const textColor = ov.textColor ?? textColorFor(rc, baseColor, pal)
    const fillRoll = rc()
    const c2Idx = rc()
    const gradAngleR = rc()
    const ttexR = rc()
    const trotR = rc()
    const tflipR = rc()
    const tzoomR = rc()
    const toxR = signed(rc)
    const toyR = signed(rc)
    // tirage auto : jamais de texture sur le texte quand le fond est déjà une texture
    const autoFill = fillRoll < 0.1 ? 'gradient' : fillRoll < 0.18 && bgKind === 'solid' ? 'texture' : 'solid'
    const fillKind = ov.textFill ?? autoFill
    const gradPool = pal.colors.filter((c) => contrast(c, baseColor) >= 2.5)
    let textFill: TextFill = { kind: 'solid' }
    if (fillKind === 'gradient') {
      textFill = {
        kind: 'gradient',
        to: ov.textColor2 ?? (gradPool.length ? pickI(gradPool, c2Idx) : textColor),
        angle: ov.textGradAngle !== undefined ? (ov.textGradAngle * Math.PI) / 180 : gradAngleR * Math.PI,
      }
    } else if (fillKind === 'texture') {
      textFill = {
        kind: 'texture', tex: ov.textTex ?? Math.floor(ttexR * COLOR_COUNT), rot: Math.floor(trotR * 4),
        flip: tflipR < 0.5, zoom: 1 + tzoomR, ox: toxR, oy: toyR,
      }
    }

    // --- flux décoration / ombre
    const shadowRoll = rd() * 100
    const frameR = rd()
    const outlineR = rd()
    const tsR = rd()
    const outlineColorIdx = rd()
    const tsColorIdx = rd()
    const k = p.shadowStrength / 100
    const shadow = (ov.shadow ?? shadowRoll < p.shadowPct)
      ? { dx: size * 0.03 * (0.5 + k), dy: size * 0.05 * (0.5 + k), blur: size * 0.06 * (0.3 + k * 1.4), alpha: 0.25 + 0.5 * k }
      : null
    const decoration: Decoration = {}
    if (ov.frame ?? frameR < 0.03) decoration.frame = { color: textColor, width: Math.max(2, size * 0.035), inset: Math.min(padX, padY) * 0.45 }
    if (ov.outline ?? outlineR < 0.1) decoration.outline = { color: pickI([pal.inks[0], pal.light[0]], outlineColorIdx), width: size * 0.05 }
    if (ov.textShadow ?? tsR < 0.12) decoration.textShadow = { color: pickI(pal.colors, tsColorIdx), d: size * 0.04 }

    const spec: LetterSpec = {
      char, index, cx: 0, cy: 0, w, h, padX: padX / size, padY: padY / size,
      angle: ov.angle !== undefined ? (ov.angle * Math.PI) / 180 : (angleR * p.angleVar * Math.PI) / 180,
      fontId, size, textColor, textFill, bg, poly,
      shadow, decoration,
    }
    // décalage vertical pré-tiré (stocké dans cy, ajouté au placement)
    spec.cy = jitterR * (p.jitterY / 100) * p.fontSize * 0.5
    cur.pieces.push(spec)
    cur.width += w + (cur.pieces.length > 1 ? p.spacing : 0)
  })
  if (cur.pieces.length) words.push(cur)

  // retour à la ligne
  const lines: { words: Word[]; width: number }[] = []
  let line = { words: [] as Word[], width: 0 }
  for (const word of words) {
    if (word.br) {
      lines.push(line)
      line = { words: [], width: 0 }
      continue
    }
    const add = word.width + (line.words.length ? spaceGap : 0)
    if (line.words.length && line.width + add > maxW) {
      lines.push(line)
      line = { words: [], width: 0 }
    }
    line.width += word.width + (line.words.length ? spaceGap : 0)
    line.words.push(word)
  }
  if (line.words.length) lines.push(line)

  const lh = p.fontSize * p.lineHeight
  // la hauteur s'adapte au texte (au moins la hauteur de base)
  const height = Math.max(p.height, lh * lines.length + p.padding * 2)
  const letters: LetterSpec[] = []
  lines.forEach((ln, li) => {
    let x = p.padding + (maxW - ln.width) / 2
    const cyLine = (height - lh * lines.length) / 2 + lh * (li + 0.5)
    ln.words.forEach((word, wi) => {
      if (wi) x += spaceGap
      word.pieces.forEach((s, pi) => {
        if (pi) x += p.spacing
        s.cx = x + s.w / 2
        s.cy = cyLine + s.cy
        x += s.w
        letters.push(s)
      })
    })
  })
  return { letters, height }
}
