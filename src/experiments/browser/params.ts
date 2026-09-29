export type BrowserKind = 'safari' | 'chrome' | 'arc'
export type Theme = 'light' | 'dark'
export type Background = 'transparent' | 'white' | 'black' | 'gradient'

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
  background: 'transparent',
  exportScale: 2,
}
