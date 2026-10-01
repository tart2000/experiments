import { useEffect, useMemo, useRef } from 'react'
import { ImageSquare, Trash } from '@phosphor-icons/react'
import { zipSync } from 'fflate'
import thumbnail from '@/assets/carousel.png'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Chips, ColorPicker, Field, Section } from '@/components/controls'
import type { Experiment, ExportFn } from '../types'
import { ensureFont, FONTS, fontById } from './fonts'
import { PALETTE } from './palette'
import { defaultParams, FORMATS, formatById, type CarouselParams, type Deco } from './params'
import { splitSlides } from './parse'
import { useLogo } from './logo'
import { renderSlide } from './render'
import { SlidePreview } from './SlidePreview'

function LogoPicker() {
  const { img, name, load, clear } = useLogo()
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <Section title="Logo">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          load(e.target.files?.[0])
          e.target.value = '' // permet de re-choisir le même fichier
        }}
      />
      {img ? (
        <div className="flex items-center gap-2">
          <img src={img.src} alt="" className="h-8 max-w-20 rounded border border-border bg-muted object-contain p-0.5" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{name}</span>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} title="Changer">
            <ImageSquare className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={clear} title="Enlever le logo">
            <Trash className="size-3.5" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
          <ImageSquare className="size-4" /> Choisir un logo
        </Button>
      )}
      <p className="text-xs text-muted-foreground">En haut à gauche de chaque slide, 100 px de haut au plus.</p>
    </Section>
  )
}

function Controls({ params: p, set }: { params: CarouselParams; set: (patch: Partial<CarouselParams>) => void }) {
  return (
    <>
      <LogoPicker />

      <Section title="Texte">
        <Textarea
          value={p.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={14}
          className="font-mono text-xs"
          placeholder={'Un bloc par slide,\nséparés par ---'}
        />
      </Section>

      <Section title="Format">
        <Select value={p.format} onValueChange={(format) => set({ format })}>
          <SelectTrigger>{formatById(p.format).label}</SelectTrigger>
          <SelectContent>
            {FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label} <span className="ml-1 text-muted-foreground">{f.w}×{f.h}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Couleurs">
        <Field label="Fond">
          <ColorPicker swatches={PALETTE} value={p.bg} onChange={(c) => c && set({ bg: c })} />
        </Field>
        <Field label="Texte">
          <ColorPicker swatches={PALETTE} value={p.fg} onChange={(c) => c && set({ fg: c })} />
        </Field>
      </Section>

      <Section title="Police">
        <Select value={p.font} onValueChange={(font) => set({ font })}>
          <SelectTrigger>
            <span style={{ fontFamily: `"${fontById(p.font).family}"`, fontWeight: fontById(p.font).weight }}>{fontById(p.font).label}</span>
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                <span style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }} className="text-base">
                  {f.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Déco du bas">
        <Chips<Deco>
          options={[['none', 'Rien'], ['arrow', 'Flèche'], ['dots', 'Points']]}
          value={p.deco}
          onChange={(deco) => set({ deco })}
        />
      </Section>
    </>
  )
}

function Preview({ params: p, exportRef }: { params: CarouselParams; set: (patch: Partial<CarouselParams>) => void; exportRef: React.MutableRefObject<ExportFn | null> }) {
  const slides = useMemo(() => splitSlides(p.text), [p.text])
  const logo = useLogo((s) => s.img)

  const state = useRef({ p, slides })
  state.current = { p, slides }

  // Téléchargement : chaque slide est redessinée en canvas à la taille réelle du format (1 slide → PNG, sinon ZIP).
  useEffect(() => {
    exportRef.current = async () => {
      const { p, slides } = state.current
      if (!slides.some((s) => s.trim())) throw new Error('Écris au moins un bloc de texte.')
      await ensureFont(fontById(p.font))
      const pngs: Uint8Array[] = []
      for (let i = 0; i < slides.length; i++) {
        const c = document.createElement('canvas')
        renderSlide(c, slides[i], i, slides.length, p, 1, useLogo.getState().img)
        const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('export'))), 'image/png'))
        pngs.push(new Uint8Array(await blob.arrayBuffer()))
      }
      if (pngs.length === 1) return { blob: new Blob([pngs[0] as BlobPart], { type: 'image/png' }), filename: 'slide-01.png' }
      const files: Record<string, [Uint8Array, { level: 0 }]> = {}
      pngs.forEach((b, i) => (files[`slide-${String(i + 1).padStart(2, '0')}.png`] = [b, { level: 0 }]))
      return { blob: new Blob([zipSync(files) as BlobPart], { type: 'application/zip' }), filename: 'carousel.zip' }
    }
    return () => {
      exportRef.current = null
    }
  }, [exportRef])

  if (!slides.some((s) => s.trim())) {
    return <p className="m-auto text-sm text-muted-foreground">Écris du texte à gauche pour générer des slides.</p>
  }
  return (
    <div className="size-full overflow-y-auto">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] items-start gap-5 pb-4">
        {slides.map((text, i) => (
          <SlidePreview key={i} text={text} index={i} total={slides.length} params={p} logo={logo} />
        ))}
      </div>
    </div>
  )
}

export const carousel: Experiment<CarouselParams> = {
  id: 'carousel',
  title: 'Carousel texte',
  thumbnail,
  defaultParams,
  Controls,
  Preview,
}
