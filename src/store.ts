import { create } from 'zustand'
import { experiments } from '@/experiments/registry'
import { loadState, saveState } from '@/lib/persist'

interface AppState {
  hydrated: boolean
  params: Record<string, any>
  hydrate: () => Promise<void>
  setParams: (id: string, patch: object) => void
}

export const useApp = create<AppState>((set, get) => ({
  hydrated: false,
  params: Object.fromEntries(experiments.map((e) => [e.id, e.defaultParams])),
  async hydrate() {
    const loaded = await Promise.all(experiments.map((e) => loadState<any>(e.id)))
    const params = Object.fromEntries(
      experiments.map((e, i) => {
        const merged = { ...e.defaultParams, ...loaded[i] }
        return [e.id, e.onLoad?.(merged) ?? merged]
      }),
    )
    set({ params, hydrated: true })
  },
  setParams(id, patch) {
    const next = { ...get().params[id], ...patch }
    set({ params: { ...get().params, [id]: next } })
    saveState(id, next)
  },
}))
