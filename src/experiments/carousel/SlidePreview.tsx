import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ensureFont, fontById } from './fonts'
import { largestFitting, LINE_HEIGHT, slideGeometry } from './fit'
import type { CarouselParams } from './params'

/**
 * Une slide en HTML/CSS : la mise en page est faite à la taille réelle du format (1080 px de large, etc.)
 * puis réduite par transform pour tenir dans la colonne. Le texte s'ajuste en mesurant le DOM.
 */
export function SlidePreview({ text, index, total, params: p, logo }: { text: string; index: number; total: number; params: CarouselParams; logo: HTMLImageElement | null }) {
  const g = slideGeometry(p, logo)
  const font = fontById(p.font)
  const outerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  // échelle d'affichage = largeur disponible / largeur réelle
  useEffect(() => {
    const el = outerRef.current!
    const ro = new ResizeObserver(() => setScale(el.clientWidth / g.w))
    ro.observe(el)
    return () => ro.disconnect()
  }, [g.w])

  // auto-fit : plus grande taille entière dont la hauteur du texte tient dans la boîte
  useLayoutEffect(() => {
    const el = textRef.current!
    const fitNow = () => {
      el.style.fontSize = `${largestFitting(g.minSize, g.maxSize, (s) => {
        el.style.fontSize = `${s}px`
        return el.offsetHeight <= g.boxH
      })}px`
    }
    fitNow()
    let live = true
    ensureFont(font).then(() => live && fitNow()) // refait l'ajustement quand la police est chargée
    return () => {
      live = false
    }
  }, [text, font, g.boxW, g.boxH, g.minSize, g.maxSize])

  const dot = g.w * 0.018
  const arrow = g.w * 0.11

  return (
    <figure className="space-y-1.5">
      <div
        ref={outerRef}
        className="relative w-full overflow-hidden rounded-md border border-border"
        style={{ aspectRatio: `${g.w} / ${g.h}` }}
      >
        <div
          style={{ width: g.w, height: g.h, transform: `scale(${scale})`, transformOrigin: 'top left', background: p.bg, color: p.fg, position: 'absolute', top: 0, left: 0 }}
        >
          {logo && g.logoBox && (
            <img src={logo.src} alt="" style={{ position: 'absolute', left: g.padX, top: g.padY, width: g.logoBox.w, height: g.logoBox.h }} />
          )}
          <div style={{ position: 'absolute', left: g.padX, top: g.boxTop, width: g.boxW, height: g.boxH, display: 'flex', alignItems: 'center' }}>
            <div
              ref={textRef}
              style={{
                width: '100%',
                fontFamily: `"${font.family}"`,
                fontWeight: font.weight,
                lineHeight: LINE_HEIGHT,
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {text}
            </div>
          </div>

          {p.deco === 'dots' && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: g.decoCy - dot / 2, display: 'flex', justifyContent: 'center', gap: g.w * 0.014 }}>
              {Array.from({ length: total }, (_, i) => (
                <span key={i} style={{ width: dot, height: dot, borderRadius: '50%', background: p.fg, opacity: i === index ? 1 : 0.28 }} />
              ))}
            </div>
          )}
          {p.deco === 'arrow' && index < total - 1 && (
            <svg
              width={arrow}
              height={g.w * 0.05}
              viewBox="0 0 110 50"
              fill="none"
              stroke={p.fg}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: 'absolute', right: g.padX, top: g.decoCy - (g.w * 0.05) / 2 }}
            >
              <path d="M4 25 H106 M84 5 L106 25 L84 45" />
            </svg>
          )}
        </div>
      </div>
      <figcaption className="font-mono text-[11px] text-muted-foreground">
        {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </figcaption>
    </figure>
  )
}
