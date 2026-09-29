import { ArrowCounterClockwise, Plus, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Field, SliderField } from '@/components/controls'
import { cn } from '@/lib/utils'
import { FONTS, fontById } from './fonts'
import type { LetterOverride, LetterSpec } from './layout'
import type { PaletteSet } from './palettes'
import { COLOR_URLS, PAPER_URLS } from './textures'

function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            'flex-1 cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors',
            value === v ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:bg-muted',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({ value, onChange, allowNone, swatches }: { value: string | null; onChange: (v: string | null) => void; allowNone?: boolean; swatches: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowNone && (
        <button
          onClick={() => onChange(null)}
          title="Sans teinte"
          className={cn('size-5 cursor-pointer rounded-full border text-[10px] leading-none text-muted-foreground', value === null ? 'ring-2 ring-primary' : 'border-input')}
        >
          ∅
        </button>
      )}
      {swatches.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          style={{ background: c }}
          className={cn('size-5 cursor-pointer rounded-full border border-input', value?.toLowerCase() === c && 'ring-2 ring-primary ring-offset-1 ring-offset-card')}
        />
      ))}
      <label
        title="Couleur libre"
        className="relative flex size-5 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted-foreground text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3" weight="bold" />
        <input
          type="color"
          value={value ?? '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn(
        'cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors',
        on ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-muted-foreground hover:bg-muted',
      )}
    >
      {label}
    </button>
  )
}

export function LetterPanel(props: {
  spec: LetterSpec
  palette: PaletteSet
  override: LetterOverride | undefined
  onChange: (patch: Partial<LetterOverride>) => void
  onReset: () => void
  onClose: () => void
}) {
  const { spec, palette, override, onChange, onReset, onClose } = props
  const bg = spec.bg
  const swatches = Array.from(new Set([...palette.inks, ...palette.light, ...palette.colors]))
  const isUpper = spec.char !== spec.char.toLowerCase()
  const urls = bg.kind === 'paper' ? PAPER_URLS : COLOR_URLS
  const textTex = spec.textFill.kind === 'texture' ? spec.textFill.tex % COLOR_URLS.length : -1
  const bgColor = bg.kind === 'solid' ? bg.color : bg.tint

  return (
    <div className="absolute top-4 right-4 bottom-4 z-10 flex w-72 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Lettre « {spec.char} »</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onReset} title="Réinitialiser cette lettre">
            <ArrowCounterClockwise className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} title="Fermer">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        <Field label="Police">
          <Select value={spec.fontId} onValueChange={(fontId) => onChange({ fontId })}>
            <SelectTrigger>{fontById(spec.fontId).label}</SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem
                  key={f.id}
                  value={f.id}
                  adornment={
                    <span
                      className="mr-2 flex size-8 shrink-0 items-center justify-center overflow-hidden rounded bg-white text-xl leading-none text-black"
                      style={{ fontFamily: `"${f.family}"`, fontWeight: f.weight }}
                    >
                      {spec.char}
                    </span>
                  }
                >
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Casse">
          <Chips options={[['upper', 'MAJ'], ['lower', 'min']]} value={isUpper ? 'upper' : 'lower'} onChange={(c) => onChange({ case: c })} />
        </Field>
        <SliderField label="Taille" value={override?.sizeScale ?? 1} min={0.5} max={2} step={0.05} format={(v) => `×${v.toFixed(2)}`} onChange={(sizeScale) => onChange({ sizeScale })} />
        <SliderField label="Marge haut / bas" value={Math.round(spec.padY * 100)} min={0} max={40} format={(v) => `${v}%`} onChange={(v) => onChange({ padY: v / 100 })} />
        <SliderField label="Marge côtés" value={Math.round(spec.padX * 100)} min={0} max={40} format={(v) => `${v}%`} onChange={(v) => onChange({ padX: v / 100 })} />
        <SliderField label="Angle" value={Math.round((spec.angle * 180) / Math.PI)} min={-45} max={45} format={(v) => `${v}°`} onChange={(angle) => onChange({ angle })} />

        <Field label="Remplissage du texte">
          <Chips
            options={[['solid', 'Couleur'], ['gradient', 'Dégradé'], ['texture', 'Texture']]}
            value={spec.textFill.kind}
            onChange={(textFill) => onChange({ textFill })}
          />
        </Field>
        {spec.textFill.kind === 'texture' ? (
          <Field label="Texture du texte">
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_URLS.map((u, i) => (
                <button
                  key={u}
                  onClick={() => onChange({ textTex: i })}
                  className={cn('aspect-square cursor-pointer overflow-hidden rounded-md border border-input bg-muted', textTex === i && 'ring-2 ring-primary')}
                >
                  <img src={u} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </Field>
        ) : (
          <>
            <Field label={spec.textFill.kind === 'gradient' ? 'Couleur de début' : 'Couleur du texte'}>
              <ColorPicker swatches={swatches} value={spec.textColor} onChange={(c) => c && onChange({ textColor: c })} />
            </Field>
            {spec.textFill.kind === 'gradient' && (
              <>
                <Field label="Couleur de fin">
                  <ColorPicker swatches={swatches} value={spec.textFill.to} onChange={(c) => c && onChange({ textColor2: c })} />
                </Field>
                <SliderField
                  label="Direction"
                  value={Math.round((spec.textFill.angle * 180) / Math.PI)}
                  min={0}
                  max={360}
                  format={(v) => `${v}°`}
                  onChange={(textGradAngle) => onChange({ textGradAngle })}
                />
              </>
            )}
          </>
        )}

        <Field label="Fond">
          <Chips
            options={[['solid', 'Uni'], ['color', 'Texture'], ['paper', 'Papier']]}
            value={bg.kind}
            onChange={(bgKind) => onChange({ bgKind, tex: undefined, bgColor: undefined })}
          />
        </Field>
        <Field label={bg.kind === 'color' ? 'Teinte du fond' : 'Couleur du fond'}>
          <ColorPicker swatches={swatches} value={bgColor} allowNone={bg.kind === 'color'} onChange={(bgColor) => onChange({ bgColor })} />
        </Field>
        {bg.kind !== 'solid' && (
          <Field label="Texture">
            <div className="grid grid-cols-4 gap-1.5">
              {urls.map((u, i) => (
                <button
                  key={u}
                  onClick={() => onChange({ tex: i })}
                  className={cn('aspect-square cursor-pointer overflow-hidden rounded-md border border-input bg-muted', bg.tex % urls.length === i && 'ring-2 ring-primary')}
                >
                  <img src={u} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Décoration">
          <div className="flex flex-wrap gap-1.5">
            <Toggle label="Cadre" on={!!spec.decoration.frame} onChange={(frame) => onChange({ frame })} />
            <Toggle label="Contour" on={!!spec.decoration.outline} onChange={(outline) => onChange({ outline })} />
            <Toggle label="Ombre" on={!!spec.decoration.textShadow} onChange={(textShadow) => onChange({ textShadow })} />
          </div>
        </Field>
      </div>
    </div>
  )
}
