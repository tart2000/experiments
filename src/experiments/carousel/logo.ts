import { create } from 'zustand'

/** Hauteur maximale du logo, en px du format réel (1080 px de large, etc.). */
export const LOGO_MAX_H = 100

interface LogoState {
  img: HTMLImageElement | null
  name: string
  load: (file: File | undefined | null) => void
  clear: () => void
}

// Le logo reste en mémoire dans le navigateur : jamais envoyé, jamais sauvegardé.
export const useLogo = create<LogoState>((set, get) => ({
  img: null,
  name: '',
  load(file) {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const old = get().img
      if (old) URL.revokeObjectURL(old.src)
      set({ img, name: file.name })
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  },
  clear() {
    const old = get().img
    if (old) URL.revokeObjectURL(old.src)
    set({ img: null, name: '' })
  },
}))

/** Taille d'affichage du logo : 50 px de haut au plus (jamais agrandi), largeur limitée à `maxW`. */
export function logoSize(img: HTMLImageElement, maxW: number) {
  const nw = img.naturalWidth || 150
  const nh = img.naturalHeight || 50
  let h = Math.min(LOGO_MAX_H, nh)
  let w = (h * nw) / nh
  if (w > maxW) {
    w = maxW
    h = (w * nh) / nw
  }
  return { w, h }
}
