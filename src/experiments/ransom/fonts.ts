import '@fontsource/alfa-slab-one/400.css'
import '@fontsource/anton/400.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/abril-fatface/400.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/archivo-black/400.css'
import '@fontsource/rye/400.css'
import '@fontsource/special-elite/400.css'
import '@fontsource/courier-prime/700.css'
import '@fontsource/bungee/400.css'
import '@fontsource/oswald/700.css'
import '@fontsource/unifrakturcook/700.css'
import '@fontsource/chonburi/400.css'

export interface FontDef {
  id: string
  label: string
  family: string
  weight: number
}

export const FONTS: FontDef[] = [
  { id: 'alfa-slab-one', label: 'Alfa Slab One', family: 'Alfa Slab One', weight: 400 },
  { id: 'anton', label: 'Anton', family: 'Anton', weight: 400 },
  { id: 'bebas-neue', label: 'Bebas Neue', family: 'Bebas Neue', weight: 400 },
  { id: 'abril-fatface', label: 'Abril Fatface', family: 'Abril Fatface', weight: 400 },
  { id: 'playfair-display', label: 'Playfair Display', family: 'Playfair Display', weight: 900 },
  { id: 'archivo-black', label: 'Archivo Black', family: 'Archivo Black', weight: 400 },
  { id: 'rye', label: 'Rye', family: 'Rye', weight: 400 },
  { id: 'special-elite', label: 'Special Elite', family: 'Special Elite', weight: 400 },
  { id: 'courier-prime', label: 'Courier Prime', family: 'Courier Prime', weight: 700 },
  { id: 'bungee', label: 'Bungee', family: 'Bungee', weight: 400 },
  { id: 'oswald', label: 'Oswald', family: 'Oswald', weight: 700 },
  { id: 'unifrakturcook', label: 'UnifrakturCook', family: 'UnifrakturCook', weight: 700 },
  { id: 'chonburi', label: 'Chonburi', family: 'Chonburi', weight: 400 },
]

export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0]
export const fontCss = (f: FontDef, size: number) => `${f.weight} ${size}px "${f.family}"`

export async function ensureFonts(ids: string[]) {
  await Promise.all(ids.map((id) => document.fonts.load(fontCss(fontById(id), 48), 'AaÉé')))
}
