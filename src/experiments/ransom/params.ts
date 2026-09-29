import type { LetterOverride } from './layout'
import type { PaletteId } from './palettes'

export type CaseMode = 'upper' | 'mixed' | 'typed'
export type Background = 'transparent' | 'white' | 'black'

export interface RansomParams {
  text: string
  seed: number
  width: number
  height: number
  padding: number
  fontSize: number
  sizeVar: number // 0-100 %
  angleVar: number // degrés max
  jitterY: number // 0-100 % de la taille
  spacing: number // px entre lettres
  lineHeight: number
  caseMode: CaseMode
  paperPct: number // % lettres sur papier déchiré
  texturePct: number // % lettres sur texture couleur (le reste = uni)
  shadowPct: number
  shadowStrength: number
  palette: PaletteId
  fonts: string[]
  overrides: Record<number, LetterOverride>
  background: Background
  exportScale: number
}

export const defaultParams: RansomParams = {
  text: 'Ransom note generator',
  seed: 1,
  width: 1600,
  height: 900,
  padding: 80,
  fontSize: 110,
  sizeVar: 35,
  angleVar: 8,
  jitterY: 15,
  spacing: 0,
  lineHeight: 1.25,
  caseMode: 'mixed',
  paperPct: 25,
  texturePct: 25,
  shadowPct: 60,
  shadowStrength: 50,
  palette: 'standard',
  fonts: [
    'alfa-slab-one',
    'anton',
    'bebas-neue',
    'abril-fatface',
    'playfair-display',
    'archivo-black',
    'special-elite',
    'bungee',
    'oswald',
    'chonburi',
  ],
  overrides: {},
  background: 'transparent',
  exportScale: 2,
}
