import '@fontsource/inter/700.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/playfair-display/900.css'
import '@fontsource/lora/700.css'
import '@fontsource/anton/400.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/archivo-black/400.css'
import '@fontsource/caveat/700.css'
import '@fontsource/courier-prime/700.css'

export interface FontDef {
  id: string
  label: string
  family: string
  weight: number
}

export const FONTS: FontDef[] = [
  { id: 'inter', label: 'Inter', family: 'Inter', weight: 700 },
  { id: 'space-grotesk', label: 'Space Grotesk', family: 'Space Grotesk', weight: 700 },
  { id: 'dm-serif', label: 'DM Serif Display', family: 'DM Serif Display', weight: 400 },
  { id: 'playfair', label: 'Playfair Display', family: 'Playfair Display', weight: 900 },
  { id: 'lora', label: 'Lora', family: 'Lora', weight: 700 },
  { id: 'anton', label: 'Anton', family: 'Anton', weight: 400 },
  { id: 'bebas', label: 'Bebas Neue', family: 'Bebas Neue', weight: 400 },
  { id: 'archivo-black', label: 'Archivo Black', family: 'Archivo Black', weight: 400 },
  { id: 'caveat', label: 'Caveat', family: 'Caveat', weight: 700 },
  { id: 'courier', label: 'Courier Prime', family: 'Courier Prime', weight: 700 },
]

export const fontById = (id: string) => FONTS.find((f) => f.id === id) ?? FONTS[0]
export const fontCss = (f: FontDef, size: number) => `${f.weight} ${size}px "${f.family}"`
export const ensureFont = (f: FontDef) => document.fonts.load(fontCss(f, 48), 'AaÉé')
