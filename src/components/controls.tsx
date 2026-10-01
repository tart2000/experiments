import { Plus } from '@phosphor-icons/react'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-border px-4 py-4">
      <h3 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span>{label}</span>
        {value !== undefined && <span className="font-mono text-muted-foreground">{value}</span>}
      </div>
      {children}
    </div>
  )
}

export function SliderField(props: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  format?: (v: number) => string
}) {
  const { label, value, onChange, min, max, step = 1, format } = props
  return (
    <Field label={label} value={format ? format(value) : String(value)}>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </Field>
  )
}

export function Chips<T extends string>({ options, value, onChange }: { options: [T, string][]; value: T | undefined; onChange: (v: T) => void }) {
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

export function ColorPicker({ value, onChange, allowNone, swatches }: { value: string | null; onChange: (v: string | null) => void; allowNone?: boolean; swatches: string[] }) {
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
