export type PaletteId = 'standard' | 'vintage' | 'fluo' | 'bw'

export interface PaletteSet {
  id: PaletteId
  label: string
  colors: string[] // fonds et accents
  light: string[] // papiers clairs
  inks: string[] // encres (texte, contours)
  filter: string // filtre canvas appliqué aux pièces ('none' = aucun)
}

export const PALETTES: PaletteSet[] = [
  {
    id: 'standard',
    label: 'Standard',
    colors: ['#f4a6a0', '#1f9d8c', '#d9622b', '#f2c230', '#1f6fb2', '#6b2d7a', '#c8322f', '#2f7d4b', '#7fd0c2', '#d93a7d', '#1a2a4a', '#b9b4ac', '#f08a5d', '#8fb8de'],
    light: ['#f7f5ef', '#efe6d2', '#ffffff', '#e8e2d4', '#f1ead9'],
    inks: ['#141414', '#1a1a1a', '#0d2b52', '#5b1414', '#ffffff', '#f7f5ef'],
    filter: 'none',
  },
  {
    id: 'vintage',
    label: 'Vintage',
    colors: ['#c8973a', '#a63d2f', '#5f7a4f', '#3f6b7a', '#7b4b6a', '#e0b9a0', '#d98e3f', '#2f4858'],
    light: ['#efe3c8', '#e6d8b5', '#f1e9d6', '#d9cbaa'],
    inks: ['#2b2118', '#3a2a1e', '#1f2a33', '#5b1d1d', '#f1e9d6'],
    filter: 'sepia(0.3) saturate(0.85)',
  },
  {
    id: 'fluo',
    label: 'Fluo',
    colors: ['#ff2bd6', '#39ff14', '#fff01f', '#00e5ff', '#ff6a00', '#b026ff', '#ff1744', '#ccff00'],
    light: ['#ffffff', '#fdfd96', '#e0ffe8'],
    inks: ['#0a0a0a', '#0a0a0a', '#ffffff', '#2a0a5e'],
    filter: 'saturate(1.5) contrast(1.05)',
  },
  {
    id: 'bw',
    label: 'Noir & blanc',
    colors: ['#1a1a1a', '#3a3a3a', '#5c5c5c', '#8a8a8a', '#b5b5b5', '#d9d9d9'],
    light: ['#f4f4f4', '#e6e6e6', '#d0d0d0'],
    inks: ['#0d0d0d', '#1a1a1a', '#f4f4f4', '#ffffff'],
    filter: 'grayscale(1) contrast(1.1)',
  },
]

export const paletteById = (id: string) => PALETTES.find((p) => p.id === id) ?? PALETTES[0]
