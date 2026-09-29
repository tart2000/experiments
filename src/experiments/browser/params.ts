export type BrowserKind = 'safari' | 'chrome' | 'arc'
export type Theme = 'light' | 'dark'
export type Ratio = 'auto' | '1:1' | '2:3' | '3:4' | '3:2' | '4:3'
export type Background = 'transparent' | 'white' | 'black' | 'gradient'

/** hauteur / largeur de chaque ratio fixe */
export const RATIO_HW: Record<Exclude<Ratio, 'auto'>, number> = { '1:1': 1, '2:3': 3 / 2, '3:4': 4 / 3, '3:2': 2 / 3, '4:3': 3 / 4 }

/** Largeur fixe de la fenêtre du navigateur (px CSS) ; la hauteur suit l'image. */
export const WIDTH = 1440

export interface BrowserParams {
  browser: BrowserKind
  theme: Theme
  url: string
  tabTitle: string
  radius: number
  shadow: number // 0-100
  padding: number
  ratio: Ratio // ratio de l'image finale ; auto = suit l'image chargée
  background: Background
  exportScale: number
}

export const defaultParams: BrowserParams = {
  browser: 'safari',
  theme: 'light',
  url: 'example.com',
  tabTitle: 'Example',
  radius: 12,
  shadow: 50,
  padding: 80,
  ratio: 'auto',
  background: 'transparent',
  exportScale: 2,
}
