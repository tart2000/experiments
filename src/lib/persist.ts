// Persistance JSON via le middleware Vite (data/<id>.json) : n'existe qu'en dev.
export async function loadState<T>(id: string): Promise<Partial<T>> {
  if (!import.meta.env.DEV) return {}
  try {
    const res = await fetch(`/api/state/${id}`)
    return res.ok ? await res.json() : {}
  } catch {
    return {}
  }
}

const timers = new Map<string, number>()
export function saveState(id: string, value: unknown, delay = 300) {
  if (!import.meta.env.DEV) return
  window.clearTimeout(timers.get(id))
  timers.set(
    id,
    window.setTimeout(() => {
      fetch(`/api/state/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      }).catch(() => {})
    }, delay),
  )
}
