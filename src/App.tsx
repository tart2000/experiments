import { useEffect, useRef } from 'react'
import { DownloadSimple, SquaresFour } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { experiments } from '@/experiments/registry'
import { navigate, usePath } from '@/lib/router'
import Home from '@/Home'
import type { ExportFn } from '@/experiments/types'
import { useApp } from '@/store'

export default function App() {
  const { hydrated, hydrate, params, setParams } = useApp()
  const path = usePath()
  const exportRef = useRef<ExportFn | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!hydrated) return null
  const exp = experiments.find((e) => `/${e.id}` === path)
  if (!exp) return <Home />

  const download = async () => {
    const res = await exportRef.current?.()
    if (!res) return
    const url = URL.createObjectURL(res.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = res.filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full">
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex gap-2 border-b border-border p-4">
          <Button variant="outline" className="shrink-0 px-2.5" title="Accueil" onClick={() => navigate('/')}>
            <SquaresFour className="size-4" />
          </Button>
          <Select value={exp.id} onValueChange={(id) => navigate(`/${id}`)}>
            <SelectTrigger>{exp.title}</SelectTrigger>
            <SelectContent>
              {experiments.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <exp.Controls key={exp.id} params={params[exp.id]} set={(patch) => setParams(exp.id, patch)} />
        </div>
        <div className="border-t border-border p-4">
          <Button className="w-full" onClick={download}>
            <DownloadSimple className="size-4" /> Télécharger PNG
          </Button>
        </div>
      </aside>
      <main className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden bg-background p-8">
        <exp.Preview key={exp.id} params={params[exp.id]} set={(patch) => setParams(exp.id, patch)} exportRef={exportRef} />
      </main>
    </div>
  )
}
