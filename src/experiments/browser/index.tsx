import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageSquare, Trash } from '@phosphor-icons/react'
import thumbnail from '@/assets/browser.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Field, Section, SliderField } from '@/components/controls'
import { cn } from '@/lib/utils'
import type { Experiment, ExportFn } from '../types'
import { defaultParams, WIDTH, type BrowserParams, type Ratio } from './params'
import { renderMock } from './render'

const BROWSERS = { safari: 'Safari', chrome: 'Chrome', arc: 'Arc (minimal)' } as const
const THEMES = { light: 'Clair', dark: 'Sombre' } as const
const RATIOS: Record<Ratio, string> = { auto: 'Auto (selon l\'image)', '1:1': '1:1', '2:3': '2:3', '3:4': '3:4', '3:2': '3:2', '4:3': '4:3' }
const BACKGROUNDS = { transparent: 'Transparent', white: 'Blanc', black: 'Noir', gradient: 'Dégradé' } as const

function Options<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>{options[value]}</SelectTrigger>
        <SelectContent>
          {(Object.keys(options) as T[]).map((k) => (
            <SelectItem key={k} value={k}>
              {options[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function Controls({ params: p, set }: { params: BrowserParams; set: (patch: Partial<BrowserParams>) => void }) {
  return (
    <>
      <Section title="Navigateur">
        <Options label="Type" value={p.browser} options={BROWSERS} onChange={(browser) => set({ browser })} />
        <Options label="Thème" value={p.theme} options={THEMES} onChange={(theme) => set({ theme })} />
      </Section>

      <Section title="Barre d'adresse">
        <Field label="URL">
          <Input value={p.url} onChange={(e) => set({ url: e.target.value })} placeholder="example.com" />
        </Field>
        {p.browser === 'chrome' && (
          <Field label="Titre de l'onglet">
            <Input value={p.tabTitle} onChange={(e) => set({ tabTitle: e.target.value })} />
          </Field>
        )}
      </Section>

      <Section title="Apparence">
        <Options label="Ratio de l'image finale" value={p.ratio} options={RATIOS} onChange={(ratio) => set({ ratio })} />
        <SliderField label="Arrondi" value={p.radius} min={0} max={32} onChange={(radius) => set({ radius })} />
        <SliderField label="Ombre" value={p.shadow} min={0} max={100} format={(v) => `${v}%`} onChange={(shadow) => set({ shadow })} />
        <SliderField label="Marge" value={p.padding} min={0} max={200} onChange={(padding) => set({ padding })} />
        <Options label="Arrière-plan" value={p.background} options={BACKGROUNDS} onChange={(background) => set({ background })} />
      </Section>

      <Section title="Export">
        <SliderField label="Résolution" value={p.exportScale} min={1} max={4} format={(v) => `×${v}`} onChange={(exportScale) => set({ exportScale })} />
      </Section>
    </>
  )
}

function Preview({ params: p, exportRef }: { params: BrowserParams; set: (patch: Partial<BrowserParams>) => void; exportRef: React.MutableRefObject<ExportFn | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // l'image reste en mémoire dans ce composant : jamais envoyée, jamais sauvegardée
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [over, setOver] = useState(false)
  const stateRef = useRef({ p, img })
  stateRef.current = { p, img }

  const loadFile = useCallback((file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => setImg(im)
    im.onerror = () => URL.revokeObjectURL(url)
    im.src = url
  }, [])

  useEffect(() => {
    renderMock(canvasRef.current!, img, p, 1)
  }, [p, img])

  useEffect(() => {
    exportRef.current = async () => {
      const { p, img } = stateRef.current
      if (!img) throw new Error("Charge d'abord une image.")
      const c = document.createElement('canvas')
      renderMock(c, img, p, p.exportScale)
      const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('export'))), 'image/png'))
      return { blob, filename: 'browser-mockup.png' }
    }
    return () => {
      exportRef.current = null
    }
  }, [exportRef])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
      if (file) loadFile(file)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [loadFile])

  return (
    <div
      className="flex size-full flex-col gap-3"
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        loadFile(e.dataTransfer.files[0])
      }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => loadFile(e.target.files?.[0])} />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <ImageSquare className="size-4" /> Choisir une image
        </Button>
        {img && (
          <Button variant="outline" size="sm" onClick={() => setImg(null)}>
            <Trash className="size-4" /> Retirer
          </Button>
        )}
        <span className="text-xs text-muted-foreground">ou glisse-dépose / colle (⌘V). Rien n'est envoyé : tout reste dans ton navigateur.</span>
      </div>
      <div className={cn('flex min-h-0 flex-1 overflow-y-auto rounded-lg border border-dashed border-transparent', over && 'border-primary bg-muted/40')}>
        {/* ratio fixe : la note entière tient dans la zone ; auto : pleine largeur, on scrolle si l'image est haute */}
        <canvas
          ref={canvasRef}
          className={cn('m-auto rounded-md', p.ratio === 'auto' ? 'h-auto w-full' : 'max-h-full max-w-full', p.background === 'transparent' && 'checker')}
          style={p.ratio === 'auto' ? { maxWidth: WIDTH + p.padding * 2 } : { width: 'auto', height: 'auto' }}
        />
      </div>
    </div>
  )
}

export const browser: Experiment<BrowserParams> = {
  id: 'browser',
  title: 'Browser mockup',
  thumbnail,
  defaultParams,
  Controls,
  Preview,
}
