import { logoSize } from './logo'
import { formatById, type CarouselParams } from './params'

/** Plus grande valeur entière de [min, max] pour laquelle `fits` est vrai (min si aucune). */
export function largestFitting(min: number, max: number, fits: (size: number) => boolean): number {
  let lo = Math.ceil(min)
  let hi = Math.floor(max)
  if (fits(hi)) return hi
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1 // lo et hi sont entiers : la boucle progresse toujours
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return lo
}

export const LINE_HEIGHT = 1.25

/** Géométrie d'une slide, en px du format réel (1080 de large, etc.). */
export function slideGeometry(p: CarouselParams, logo: HTMLImageElement | null = null) {
  const { w, h, safeY } = formatById(p.format)
  const padX = w * 0.09
  const padY = Math.max(w * 0.09, h * (safeY ?? 0))
  const decoH = p.deco === 'none' ? 0 : w * 0.07
  // le logo se cale en haut à gauche ; le texte démarre sous lui
  const logoBox = logo ? logoSize(logo, (w - padX * 2) * 0.5) : null
  const reserved = logoBox ? logoBox.h + w * 0.035 : 0
  return {
    w,
    h,
    padX,
    padY,
    logoBox,
    boxTop: padY + reserved,
    boxW: w - padX * 2,
    boxH: h - padY * 2 - decoH - reserved,
    minSize: w * 0.025,
    maxSize: w * 0.14,
    decoCy: h - padY - w * 0.02,
  }
}
