import { Slider } from '@/components/ui/slider'

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
