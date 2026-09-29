import { experiments } from '@/experiments/registry'
import { navigate } from '@/lib/router'

export default function Home() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">Arthur Schmitt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Petites expérimentations visuelles.</p>

        <div className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {experiments.map((e) => (
            <a
              key={e.id}
              href={`/${e.id}`}
              onClick={(ev) => {
                ev.preventDefault()
                navigate(`/${e.id}`)
              }}
              className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img src={e.thumbnail} alt="" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-sm font-medium">
                {e.title}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
