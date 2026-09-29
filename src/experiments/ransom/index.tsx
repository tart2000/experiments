import { useEffect, useRef, useState } from 'react'
import { Shuffle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Field, Section, SliderField } from '@/components/controls'
import { cn } from '@/lib/utils'
import thumbnail from '@/assets/ransom.png'
import type { Experiment } from '../types'
import { ensureFonts, FONTS } from './fonts'
import { hitTest } from './hit'
import { LetterPanel } from './LetterPanel'
import { layout, type LetterOverride, type LetterSpec } from './layout'
import { PALETTES, paletteById, type PaletteSet } from './palettes'
import { defaultParams, type RansomParams } from './params'
import { measure, renderNote } from './render'
import { loadTextures } from './textures'

const pct = (v: number) => `${v}%`

function PaletteRow({ pal }: { pal: PaletteSet }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex" style={{ filter: pal.filter }}>
        {pal.colors.slice(0, 5).map((c) => (
          <span key={c} className="-ml-1 size-3.5 rounded-full border border-card first:ml-0" style={{ background: c }} />
        ))}
      </span>
      {pal.label}
    </span>
  )
}

function Controls({ params: p, set }: { params: RansomParams; set: (patch: Partial<RansomParams>) => void }) {
  const toggleFont = (id: string) =>
    set({ fonts: p.fonts.includes(id) ? p.fonts.filter((f) => f !== id) : [...p.fonts, id] })
  return (
    <>
      <Section title="Texte">
        <Textarea value={p.text} onChange={(e) => set({ text: e.target.value })} placeholder="Ton message…" rows={4} />
        <Field label="Seed" value={String(p.seed)}>
          <Button variant="outline" size="sm" className="w-full" onClick={() => set({ seed: Math.floor(Math.random() * 1e6), overrides: {} })}>
            <Shuffle className="size-3.5" /> Reroll
          </Button>
        </Field>
        <Field label="Casse">
          <Select value={p.caseMode} onValueChange={(v) => set({ caseMode: v as RansomParams['caseMode'] })}>
            <SelectTrigger>{{ upper: 'Majuscules', mixed: 'Mélangée', typed: 'Comme tapé' }[p.caseMode]}</SelectTrigger>
            <SelectContent>
              <SelectItem value="upper">Majuscules</SelectItem>
              <SelectItem value="mixed">Mélangée</SelectItem>
              <SelectItem value="typed">Comme tapé</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section title="Couleurs">
        <Select value={p.palette} onValueChange={(v) => set({ palette: v as RansomParams['palette'] })}>
          <SelectTrigger>
            <PaletteRow pal={paletteById(p.palette)} />
          </SelectTrigger>
          <SelectContent>
            {PALETTES.map((pal) => (
              <SelectItem key={pal.id} value={pal.id}>
                <PaletteRow pal={pal} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section title="Arrière-plan">
        <Select value={p.background} onValueChange={(v) => set({ background: v as RansomParams['background'] })}>
          <SelectTrigger>{{ transparent: 'Transparent', white: 'Blanc', black: 'Noir' }[p.background]}</SelectTrigger>
          <SelectContent>
            <SelectItem value="transparent">Transparent</SelectItem>
            <SelectItem value="white">Blanc</SelectItem>
            <SelectItem value="black">Noir</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section title="Mise en page">
        <SliderField label="Taille" value={p.fontSize} min={40} max={320} onChange={(fontSize) => set({ fontSize })} />
        <SliderField label="Espacement" value={p.spacing} min={-40} max={60} onChange={(spacing) => set({ spacing })} />
        <SliderField label="Interligne" value={p.lineHeight} min={0.8} max={2} step={0.05} onChange={(lineHeight) => set({ lineHeight })} />
      </Section>

      <Section title="Variation">
        <SliderField label="Taille" value={p.sizeVar} min={0} max={100} format={pct} onChange={(sizeVar) => set({ sizeVar })} />
        <SliderField label="Angle" value={p.angleVar} min={0} max={30} format={(v) => `±${v}°`} onChange={(angleVar) => set({ angleVar })} />
        <SliderField label="Décalage vertical" value={p.jitterY} min={0} max={100} format={pct} onChange={(jitterY) => set({ jitterY })} />
      </Section>

      <Section title="Polices">
        <div className="flex flex-wrap gap-1.5">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFont(f.id)}
              className={cn(
                'cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors',
                p.fonts.includes(f.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:bg-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Export">
        <SliderField label="Résolution" value={p.exportScale} min={1} max={4} format={(v) => `×${v}`} onChange={(exportScale) => set({ exportScale })} />
      </Section>
    </>
  )
}

async function build(p: RansomParams, scale: number, canvas: HTMLCanvasElement, selected?: LetterSpec['index'] | null) {
  const [tex] = await Promise.all([loadTextures(), ensureFonts(p.fonts)])
  const { letters, height } = layout(p, measure)
  canvas.width = Math.round(p.width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')!
  renderNote(ctx, letters, p.width, height, scale, p.background, tex, paletteById(p.palette).filter)
  const sel = letters.find((l) => l.index === selected)
  if (sel) {
    // repère de sélection (aperçu seulement, jamais dans l'export)
    ctx.save()
    ctx.translate(sel.cx * scale, sel.cy * scale)
    ctx.rotate(sel.angle)
    ctx.strokeStyle = '#3b9eff'
    ctx.lineWidth = 3 * scale
    ctx.setLineDash([10 * scale, 6 * scale])
    ctx.strokeRect((-sel.w / 2 - 4) * scale, (-sel.h / 2 - 4) * scale, (sel.w + 8) * scale, (sel.h + 8) * scale)
    ctx.restore()
  }
  return letters
}

type ExportRef = React.MutableRefObject<(() => Promise<{ blob: Blob; filename: string }>) | null>

function Preview({ params: p, set, exportRef }: { params: RansomParams; set: (patch: Partial<RansomParams>) => void; exportRef: ExportRef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paramsRef = useRef(p)
  paramsRef.current = p
  const [letters, setLetters] = useState<LetterSpec[]>([])
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    build(p, 1, canvasRef.current!, selected).then(setLetters).catch(console.error)
  }, [p, selected])

  useEffect(() => {
    exportRef.current = async () => {
      const cur = paramsRef.current
      const c = document.createElement('canvas')
      await build(cur, cur.exportScale, c)
      const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('export'))), 'image/png'))
      return { blob, filename: `ransom-${cur.seed}.png` }
    }
    return () => {
      exportRef.current = null
    }
  }, [exportRef])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = e.currentTarget
    const r = c.getBoundingClientRect()
    const hit = hitTest(letters, ((e.clientX - r.left) * c.width) / r.width, ((e.clientY - r.top) * c.height) / r.height)
    setSelected(hit ? hit.index : null)
  }

  const spec = letters.find((l) => l.index === selected)
  const updateOverride = (patch: Partial<LetterOverride>) =>
    set({ overrides: { ...p.overrides, [selected!]: { ...p.overrides[selected!], ...patch } } })
  const resetOverride = () => {
    const { [selected!]: _, ...rest } = p.overrides
    set({ overrides: rest })
  }

  return (
    <div className="flex size-full">
      <div className="flex size-full overflow-y-auto">
        <canvas
          ref={canvasRef}
          onClick={onCanvasClick}
          className={cn('m-auto h-auto w-full max-w-[1600px] cursor-pointer rounded-md border border-border', p.background === 'transparent' && 'checker')}
        />
      </div>
      {spec && (
        <LetterPanel spec={spec} palette={paletteById(p.palette)} override={p.overrides[spec.index]} onChange={updateOverride} onReset={resetOverride} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

export const ransom: Experiment<RansomParams> = {
  id: 'ransom',
  title: 'Ransom note generator',
  thumbnail,
  defaultParams,
  onLoad: (saved) => ({ ...saved, background: ['white', 'black'].includes(saved.background) ? saved.background : 'transparent', seed: Math.floor(Math.random() * 1e6), overrides: {} }),
  Controls,
  Preview,
}
