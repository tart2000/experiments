import type { LetterSpec } from './layout'

/** Lettre sous le point (x, y) en coordonnées de la note ; la dernière dessinée est au-dessus. */
export function hitTest(letters: LetterSpec[], x: number, y: number): LetterSpec | null {
  for (let i = letters.length - 1; i >= 0; i--) {
    const s = letters[i]
    const dx = x - s.cx
    const dy = y - s.cy
    const cos = Math.cos(-s.angle)
    const sin = Math.sin(-s.angle)
    const lx = dx * cos - dy * sin
    const ly = dx * sin + dy * cos
    if (Math.abs(lx) <= s.w / 2 && Math.abs(ly) <= s.h / 2) return s
  }
  return null
}
