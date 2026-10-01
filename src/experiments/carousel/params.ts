export type Deco = 'none' | 'arrow' | 'dots'

export interface Format {
  id: string
  label: string
  w: number
  h: number
  /** marge verticale de sécurité (fraction de la hauteur) quand l'interface du réseau recouvre le haut / bas */
  safeY?: number
}

export const FORMATS: Format[] = [
  { id: 'ig-square', label: 'Instagram carré · 1:1', w: 1080, h: 1080 },
  { id: 'ig-portrait', label: 'Instagram portrait · 4:5', w: 1080, h: 1350 },
  { id: 'ig-grid', label: 'Instagram grille · 3:4', w: 1080, h: 1440 },
  { id: 'story', label: 'Story / Reel / TikTok · 9:16', w: 1080, h: 1920, safeY: 0.12 },
  { id: 'landscape', label: 'Paysage · 1,91:1', w: 1080, h: 566 },
  { id: 'wide', label: 'X / LinkedIn · 16:9', w: 1200, h: 675 },
  { id: 'pinterest', label: 'Pinterest · 2:3', w: 1000, h: 1500 },
]

export const formatById = (id: string) => FORMATS.find((f) => f.id === id) ?? FORMATS[0]

export interface CarouselParams {
  text: string
  format: string
  bg: string
  fg: string
  font: string
  deco: Deco
}

export const DEFAULT_TEXT = `Ton texte,
en carrousel.
---
Sépare chaque slide par trois tirets, seuls sur leur ligne.
---
La taille du texte s'adapte toute seule à la quantité de mots.
---
Choisis le format, les couleurs, la police, la petite déco du bas.
---
Puis télécharge tout d'un coup. ✨`

export const defaultParams: CarouselParams = {
  text: DEFAULT_TEXT,
  format: 'ig-portrait',
  bg: '#f4efe6',
  fg: '#0b0b0c',
  font: 'dm-serif',
  deco: 'dots',
}
